package mongo

import (
	"errors"
	"fmt"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

var (
	ErrNotFound  = errors.New("mongostore: not found")
	ErrDuplicate = errors.New("mongostore: duplicate key")
	ErrInvalidID = errors.New("mongostore: invalid id")
)

func mapErr(err error) error {
	switch {
	case err == nil:
		return nil
	case errors.Is(err, mongo.ErrNoDocuments):
		return ErrNotFound
	case mongo.IsDuplicateKeyError(err):
		return ErrDuplicate
	default:
		return err
	}
}

func ObjectID(id string) (bson.ObjectID, error) {
	oid, err := bson.ObjectIDFromHex(id)
	if err != nil {
		return bson.NilObjectID, ErrInvalidID
	}
	return oid, nil
}

func idString(v any) string {
	if oid, ok := v.(bson.ObjectID); ok {
		return oid.Hex()
	}
	return fmt.Sprint(v)
}