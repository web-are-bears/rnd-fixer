package mongo

import (
	"context"
	"fmt"
	"log/slog"
	"net/url"
	"time"

	"github.com/wbb/rnd-fixer/shared/config"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
	"go.mongodb.org/mongo-driver/v2/mongo/readpref"
)

type Store[T any] struct {
	coll *mongo.Collection
	logger *slog.Logger
}

func getMongoURI(cfg *config.MongoConfig) (string, error) {
	if cfg.Username == "" || cfg.Password == "" {
		return "", fmt.Errorf("invalid MongoDB configuration: missing username or password")
	}

	if cfg.Hostname == "" {
		return "", fmt.Errorf("invalid MongoDB configuration: missing hostname")
	}

	// escape username/password because they may contain characters such as
	// @, :, /, etc.
	username := url.QueryEscape(cfg.Username)
	password := url.QueryEscape(cfg.Password)

	uri := fmt.Sprintf(
		"mongodb+srv://%s:%s@%s/%s",
		username,
		password,
		cfg.Hostname,
		cfg.Database,
	)

	if len(cfg.Options) > 0 {
		values := url.Values{}

		for key, value := range cfg.Options {
			values.Set(key, value)
		}

		uri += "?" + values.Encode()
	}

	return uri, nil
}

func MongoConnect(ctx context.Context) (*mongo.Client, error) {
	cfg, err := config.LoadMongoConfig()
	if err != nil {
		return nil, fmt.Errorf("failed to load MongoDB configuration: %w", err)
	}

	uri, err := getMongoURI(cfg)
	if err != nil {
		return nil, err
	}

	opts := options.Client().
		ApplyURI(uri).
		SetServerSelectionTimeout(10 * time.Second)

	client, err := mongo.Connect(opts)
	if err != nil {
		return nil, fmt.Errorf("failed to create MongoDB client: %w", err)
	}

	defer func() {
		if err != nil {
			_ = client.Disconnect(context.Background())
		}
	}()

	pingCtx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	if err = client.Ping(pingCtx, readpref.Primary()); err != nil {
		return nil, fmt.Errorf("failed to ping MongoDB: %w", err)
	}

	return client, nil
}

// create a new store
func NewStore[T any](logger *slog.Logger,
					 client *mongo.Client,
					 database_name string,
					 collection_name string) *Store[T] {
	return &Store[T]{
		coll: client.Database(database_name).Collection(collection_name),
		logger: logger,
	}
}

// fetch the collection from store
func (s *Store[T]) GetCollection() *mongo.Collection {
	return s.coll
}

// insert returns the new document's id as a hex string.
func (s *Store[T]) Insert(ctx context.Context, doc T) (string, error) {
	res, err := s.coll.InsertOne(ctx, doc)
	if err != nil {
		return "", mapErr(err)
	}
	return idString(res.InsertedID), nil
}

func (s *Store[T]) InsertMany(ctx context.Context, docs []T) ([]string, error) {
	if len(docs) == 0 {
		return nil, nil
	}
	res, err := s.coll.InsertMany(ctx, docs)
	if err != nil {
		return nil, mapErr(err)
	}
	ids := make([]string, len(res.InsertedIDs))
	for i, id := range res.InsertedIDs {
		ids[i] = idString(id)
	}
	return ids, nil
}

func (s *Store[T]) GetByID(ctx context.Context, id string) (*T, error) {
	oid, err := ObjectID(id)
	if err != nil {
		return nil, err
	}
	return s.FindOne(ctx, bson.M{"_id": oid})
}

func (s *Store[T]) FindOne(ctx context.Context, filter bson.M) (*T, error) {
	var out T
	if err := s.coll.FindOne(ctx, nz(filter)).Decode(&out); err != nil {
		return nil, mapErr(err)
	}
	return &out, nil
}

// find never returns a nil slice, which keeps JSON output as [] instead of null.
func (s *Store[T]) Find(ctx context.Context, q Query) ([]T, error) {
	cur, err := s.coll.Find(ctx, nz(q.Filter), q.findOptions())
	if err != nil {
		return nil, mapErr(err)
	}
	out := []T{}
	if err := cur.All(ctx, &out); err != nil { // All also closes the cursor
		return nil, mapErr(err)
	}
	return out, nil
}

func (s *Store[T]) Count(ctx context.Context, filter bson.M) (int64, error) {
	return s.coll.CountDocuments(ctx, nz(filter))
}

func (s *Store[T]) Exists(ctx context.Context, filter bson.M) (bool, error) {
	n, err := s.coll.CountDocuments(ctx, nz(filter), options.Count().SetLimit(1))
	return n > 0, err
}

// paginate is offset-based. page starts at 1; size is clamped to 1..100.
func (s *Store[T]) Paginate(ctx context.Context, q Query, page, size int64) (*Page[T], error) {
	if page < 1 {
		page = 1
	}
	if size < 1 {
		size = 20
	}
	if size > 100 {
		size = 100
	}
	total, err := s.Count(ctx, q.Filter)
	if err != nil {
		return nil, err
	}
	q.Skip, q.Limit = (page-1)*size, size
	items, err := s.Find(ctx, q)
	if err != nil {
		return nil, err
	}
	return &Page[T]{Items: items, Total: total, Page: page, Size: size}, nil
}

// setByID updates only the given fields ($set).
func (s *Store[T]) SetByID(ctx context.Context, id string, fields bson.M) error {
	oid, err := ObjectID(id)
	if err != nil {
		return err
	}
	return s.UpdateOne(ctx, bson.M{"_id": oid}, bson.M{"$set": fields})
}

// updateOne takes a full update document with operators ($set, $inc, $push, ...).
func (s *Store[T]) UpdateOne(ctx context.Context, filter, update bson.M) error {
	res, err := s.coll.UpdateOne(ctx, nz(filter), update)
	if err != nil {
		return mapErr(err)
	}
	if res.MatchedCount == 0 {
		return ErrNotFound
	}
	return nil
}

func (s *Store[T]) UpdateMany(ctx context.Context, filter, update bson.M) (int64, error) {
	res, err := s.coll.UpdateMany(ctx, nz(filter), update)
	if err != nil {
		return 0, mapErr(err)
	}
	return res.ModifiedCount, nil
}

// upsert updates the matching document, or inserts one if none matches.
func (s *Store[T]) Upsert(ctx context.Context, filter, update bson.M) error {
	_, err := s.coll.UpdateOne(ctx, nz(filter), update, options.UpdateOne().SetUpsert(true))
	return mapErr(err)
}

func (s *Store[T]) DeleteByID(ctx context.Context, id string) error {
	oid, err := ObjectID(id)
	if err != nil {
		return err
	}
	res, err := s.coll.DeleteOne(ctx, bson.M{"_id": oid})
	if err != nil {
		return mapErr(err)
	}
	if res.DeletedCount == 0 {
		return ErrNotFound
	}
	return nil
}

func (s *Store[T]) DeleteMany(ctx context.Context, filter bson.M) (int64, error) {
	res, err := s.coll.DeleteMany(ctx, nz(filter))
	if err != nil {
		return 0, mapErr(err)
	}
	return res.DeletedCount, nil
}

