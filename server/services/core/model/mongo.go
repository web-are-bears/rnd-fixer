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
	projects  *mongo.Store[ProjectDoc]
	professor *mongo.Store[ProfessorDoc]
	student   *mongo.Store[StudentDoc]
}

func NewCoreStore(projStore *mongo.Store[ProjectDoc], profStore *mongo.Store[ProfessorDoc], studStore *mongo.Store[StudentDoc]) *CoreStore {
	return &CoreStore{
		projects: projStore,
		professor: profStore,
		student: studStore,
	}
}

// Projects APIs

func (m *CoreStore) AddProject(ctx context.Context, doc *ProjectDoc) (string, error) {
	if (doc.ProjName == "") {
		return "", status.Error(codes.InvalidArgument, "project name not found")
	}

	if (doc.Description == "") {
		return "", status.Error(codes.InvalidArgument, "project description not found")
	}

	if (doc.MaxOccupancy == 0) {
		return "", status.Error(codes.InvalidArgument, "project max occupancy not found")
	}

	if (doc.TokenDistribution == nil) {
		doc.TokenDistribution = map[string]uint32{}
	}

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
	projects, err := m.projects.Find(ctx, mongo.Query{Filter: bson.M{"prof_username": id}})
	if (len(projects) == 0 || err != nil) {
		return nil, status.Error(codes.NotFound, "projects not found or error")
	}

	return projects, nil
}

func (m *CoreStore) FetchProject(ctx context.Context, id string) (*ProjectDoc, error) {
	project, err := m.projects.FindOne(ctx, bson.M{"_id": id})
	if errors.Is(err, mongo.ErrNotFound) {
		return nil, status.Error(codes.NotFound, "project not found")
	}

	if err != nil {
		return nil, status.Error(codes.Internal, "internal error")
	}

	return project, nil
}

func (m *CoreStore) AddStudentTokenToProject(ctx context.Context, tok TokenDoc) (string, error) {
	filter := bson.M{"_id": tok.ProjId}
	update := bson.M{"$set" : bson.M{
		"token_distribution." + tok.StudUsername: tok.Token,
	}}
	err := m.projects.UpdateOne(ctx, filter, update)
	if errors.Is(err, mongo.ErrNotFound) {
		return "", status.Error(codes.NotFound, "project not found")
	}

	if err != nil {
		return "", status.Error(codes.Internal, "internal error")
	}

	return tok.ProjId, nil
}

func (m *CoreStore) DeleteStudentTokenToProject(ctx context.Context, projectId, studentUsername string) (string, error) {
	key := "token_distribution." + studentUsername
	filter := bson.M{
		"_id": projectId,
		key: bson.M{"$exists": true},
	}
	update := bson.M{"$unset": bson.M{key: ""}}

	err := m.projects.UpdateOne(ctx, filter, update)
	if errors.Is(err, mongo.ErrNotFound) {
		return "", status.Error(codes.NotFound, "token not found")
	}
	if err != nil {
		return "", status.Error(codes.Internal, "internal error")
	}
	return projectId, nil
}

// Professor APIs

func (m *CoreStore) AddProfessorProfile(ctx context.Context, doc *ProfessorDoc) (string, error) {
	if (doc.ProfUsername == "" || doc.ProfName == "") {
		return "", status.Error(codes.InvalidArgument, "professor name is not found")
	}

	if (doc.Email == "") {
		return "", status.Error(codes.InvalidArgument, "professor email not found")
	}

	if (doc.Link == nil) {
		doc.Link = []string{}
	}

	id, err := m.professor.Insert(ctx, *doc)
	if errors.Is(err, mongo.ErrDuplicate) {
		return "", status.Error(codes.AlreadyExists, "professor already exists")
	}

	if err != nil {
		return "", status.Error(codes.Internal, "internal error")
	}

	return id, nil
}

func (m *CoreStore) EditProfessorProfile(ctx context.Context, doc *ProfessorEdit, id string) (string, error) {
	set := bson.M{}

	if doc.ProfName != "" {
		set["prof_name"] = doc.ProfName
	}

	if doc.Email != "" {
		set["email"] = doc.Email
	}
	if doc.About != "" {
		set["about"] = doc.About
	}
	if len(doc.Link) > 0 {
		set["link"] = doc.Link
	}

	if len(set) == 0 {
		return "", status.Error(codes.InvalidArgument, "no fields to update")
	}

	filter := bson.M{ "prof_username": id }
	update := bson.M{ "$set": set}

	err := m.professor.UpdateOne(ctx, filter, update)
	if errors.Is(err, mongo.ErrNotFound) {
		return "", status.Error(codes.NotFound, "professor not found")
	}
	if err != nil {
		return "", status.Error(codes.Internal, "internal error")
	}

	return id, nil
}

// Students API

func (m *CoreStore) AddStudentProfile(ctx context.Context, doc *StudentDoc) (string, error) {
	if (doc.StudUsername == "" || doc.StudName == "") {
		return "", status.Error(codes.InvalidArgument, "student name not found")
	}

	if (doc.Email == "") {
		return "", status.Error(codes.InvalidArgument, "student email not found")
	}

	if (doc.Link == nil) {
		doc.Link = []string{}
	}

	id, err := m.student.Insert(ctx, *doc)
	if errors.Is(err, mongo.ErrDuplicate) {
		return "", status.Error(codes.AlreadyExists, "student already exists")
	}

	if err != nil {
		return "", status.Error(codes.Internal, "internal error")
	}

	return id, nil
}

func (m *CoreStore) EditStudentProfile(ctx context.Context, doc *StudentEdit, id string) (string, error) {
	set := bson.M{}

	if doc.StudName != "" {
		set["stud_name"] = doc.StudName
	}

	if doc.Email != "" {
		set["email"] = doc.Email
	}

	if doc.About != "" {
		set["about"] = doc.About
	}

	if len(doc.Link) > 0 {
		set["link"] = doc.Link
	}

	if len(set) == 0 {
		return "", status.Error(codes.InvalidArgument, "no fields to update")
	}

	filter := bson.M{ "stud_username": id }
	update := bson.M{ "$set": set}

	err := m.student.UpdateOne(ctx, filter, update)
	if errors.Is(err, mongo.ErrNotFound) {
		return "", status.Error(codes.NotFound, "student not found")
	}
	if err != nil {
		return "", status.Error(codes.Internal, "internal error")
	}

	return id, nil
}

func (m *CoreStore) AddProjectTokenToStudent(ctx context.Context, tok TokenDoc) (string, error) {
	filter := bson.M{"stud_username": tok.StudUsername}
	update := bson.M{"$set": bson.M {
		"token_distribution." + tok.ProjId: tok.Token,
	}}

	err := m.projects.UpdateOne(ctx, filter, update)
	if errors.Is(err, mongo.ErrNotFound) {
		return "", status.Error(codes.NotFound, "student not found")
	}

	if err != nil {
		return "", status.Error(codes.Internal, "internal error")
	}

	return tok.ProjId, nil
}

func (m *CoreStore) DeleteProjectTokenToStudent(ctx context.Context, projectId, studentUsername string) (string, error) {
	key := "token_distribution." + projectId
	filter := bson.M{
		"stud_username": studentUsername,
		key: bson.M{"$exists": true},
	}
	update := bson.M{"$unset": bson.M{key: ""}}

	err := m.projects.UpdateOne(ctx, filter, update)
	if errors.Is(err, mongo.ErrNotFound) {
		return "", status.Error(codes.NotFound, "token not found")
	}
	if err != nil {
		return "", status.Error(codes.Internal, "internal error")
	}
	return studentUsername, nil
}