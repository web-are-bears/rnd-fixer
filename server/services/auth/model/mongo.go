package auth

import (
	"context"
	"errors"

	"github.com/wbb/rnd-fixer/shared/mongo"
	"go.mongodb.org/mongo-driver/v2/bson"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type AuthStore struct{ users *mongo.Store[UserDoc] }

func NewAuthStore(store *mongo.Store[UserDoc]) *AuthStore {
	return &AuthStore{
		users: store,
	}
}

func (m *AuthStore) CreateUser(ctx context.Context, doc *UserDoc) (string, error) {
	id, err := m.users.Insert(ctx, *doc)
	if errors.Is(err, mongo.ErrDuplicate) {
		return "", status.Error(codes.AlreadyExists, "username already taken")
	}

	if err != nil {
		return "", err
	}

	return id, nil
}

func (m *AuthStore) GetUserByID(ctx context.Context, username string) (*UserDoc, error) {
	user, err := m.users.FindOne(ctx, bson.M{"username": username})
	if errors.Is(err, mongo.ErrNotFound) {
		return nil, status.Error(codes.NotFound, "user not found")
	}

	if err != nil {
		return nil, status.Error(codes.Internal, "internal error")
	}

	return user, nil
}