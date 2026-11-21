package model

import (
	"context"
	"errors"

	"github.com/wbb/rnd-fixer/shared/mongo"
	"go.mongodb.org/mongo-driver/v2/bson"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

const PhasedDocumentID = "phase"

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
		return "", status.Error(codes.Internal, "internal error")
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

func (m *AuthStore) GetPhase(ctx context.Context) (*PhaseDoc, error) {
	phase, err := m.users.FindOne(ctx, bson.M{"_id": PhasedDocumentID})
	if errors.Is(err, mongo.ErrNotFound) {
		return nil, status.Error(codes.NotFound, "phase not found")
	}

	if err != nil {
		return nil, status.Error(codes.Internal, "internal error")
	}

	pd := PhaseDoc{
		Phase: phase.Username,
	}

	return &pd, nil
}

func (m *AuthStore) SetPhase(ctx context.Context, doc *PhaseDoc) (string, error) {
	filter := bson.M{"_id": PhasedDocumentID}
	update := bson.M{
		"$set": bson.M{
			"username": doc.Phase,
		},
	}

	err := m.users.UpdateOne(ctx, filter, update)
	if err != nil {
		return "", status.Error(codes.Internal, "internal error")
	}
	return "updated successfully", nil
}