package model

import (
	"context"
	"errors"

	"github.com/wbb/rnd-fixer/shared/mongo"
	"go.mongodb.org/mongo-driver/v2/bson"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)



type CoreStore struct {
	projects *mongo.Store[ProjectDoc]
}

func NewCoreStore(store *mongo.Store[ProjectDoc]) *CoreStore {
	return &CoreStore{
		projects: store,
	}
}

func (m *CoreStore) AddProject(ctx context.Context, doc *ProjectDoc) (string, error) {
	id, err := m.projects.Insert(ctx, *doc)
	if errors.Is(err, mongo.ErrDuplicate) {
		return "", status.Error(codes.AlreadyExists, "project already exists")
	}

	if err != nil {
		return "", status.Error(codes.Internal, "internal error")
	}
	
	return id, nil
}

func (m *CoreStore) FetchAllProjects(ctx context.Context) ([]ProjectDoc, error) {
	projects, err := m.projects.Find(ctx, mongo.Query{Filter: bson.M{}})

	if (len(projects) == 0 || err != nil) {
		return nil, status.Error(codes.NotFound, "projects not found or error")
	}

	return projects, nil
}

func (m *CoreStore) FetchProjectByProfId(ctx context.Context, id string) ([]ProjectDoc, error) {
	projects, err := m.projects.Find(ctx, mongo.Query{Filter: bson.M{"prof_id": id}})
	if (len(projects) == 0 || err != nil) {
		return nil, status.Error(codes.NotFound, "projects not found or error")
	}

	return projects, nil
}

func (m *CoreStore) FetchProject(ctx context.Context, id string) (*ProjectDoc, error) {
	project, err := m.projects.FindOne(ctx, bson.M{"_id": id})
	if errors.Is(err, mongo.ErrNotFound) {
		return nil, status.Error(codes.NotFound, "user not found")
	}

	if err != nil {
		return nil, status.Error(codes.Internal, "internal error")
	}

	return project, nil
}

func (m *CoreStore) AddStudentTokenToProject(ctx context.Context, tok TokenDoc) (string, error) {
	filter := bson.M{"_id": tok.ProjectId}
	update := bson.M{"$set" : bson.M{
		"token_distribution." + tok.StudentId: tok.Token,
	}}
	err := m.projects.UpdateOne(ctx, filter, update)
	if errors.Is(err, mongo.ErrNotFound) {
		return "", status.Error(codes.NotFound, "project not found")
	}

	if err != nil {
		return "", status.Error(codes.Internal, "internal error")
	}

	return tok.ProjectId, nil
}

func (m *CoreStore) DeleteStudentTokenToProject(ctx context.Context, projectId, studentId string) (string, error) {
	key := "token_distribution." + studentId
	filter := bson.M{
		"_id": projectId,
		key: bson.M{"$exists": true},
	}
	update := bson.M{"$unset": bson.M{key: ""}}

	err := m.projects.UpdateOne(ctx, filter, update)
	if errors.Is(err, mongo.ErrNotFound) {
		return "", status.Error(codes.NotFound, "project or student token not found")
	}
	if err != nil {
		return "", status.Error(codes.Internal, "internal error")
	}
	return projectId, nil
}