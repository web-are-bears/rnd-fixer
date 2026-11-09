package handler

import (
	"context"

	mdl "github.com/wbb/rnd-fixer/services/core/model"
	pb "github.com/wbb/rnd-fixer/services/core/proto"
	"google.golang.org/protobuf/types/known/emptypb"
	"github.com/wbb/rnd-fixer/shared/mongo"
	"github.com/wbb/rnd-fixer/shared/rng"
)

type Handler struct {
	pb.UnimplementedCoreProfessorServiceServer
	pb.UnimplementedCoreProjectServiceServer
	pb.UnimplementedCoreStudentServiceServer
	Store *mdl.CoreStore
}

func NewHandler(projs *mongo.Store[mdl.ProjectDoc], profs *mongo.Store[mdl.ProfessorDoc], studs *mongo.Store[mdl.StudentDoc]) *Handler {
	return &Handler{
		Store: mdl.NewCoreStore(projs, profs, studs),
	}
}

func (handle *Handler) AddProject(ctx context.Context, req *pb.ProjectData) (*pb.ProjectId, error) {
	document := mdl.ProjectDoc{
		ProjId: rng.GenerateUUID(),
		ProjName: req.ProjName,
		ProfUsername: req.ProfUsername,
		Description: req.Description,
		MaxOccupancy: req.MaxOccupancy,
		TokenDistribution: req.TokenDistribution,
	}

	id, err := handle.Store.AddProject(ctx, &document)
	if err != nil {
		return nil, err
	}

	return &pb.ProjectId{ ProjId: id }, nil
}

func (handle *Handler) FetchProject(ctx context.Context, req *pb.ProjectId) (*pb.ProjectData, error) {
	document, err := handle.Store.FetchProject(ctx, req.ProjId)
	if err != nil {
		return nil, err
	}

	return &pb.ProjectData{
		ProjId: document.ProjId,
		ProjName: document.ProjName,
		ProfUsername: document.ProfUsername,
		Description: document.Description,
		MaxOccupancy: document.MaxOccupancy,
		TokenDistribution: document.TokenDistribution,
	}, nil
}

func (handle *Handler) FetchAllProjects(ctx context.Context, _ *emptypb.Empty) (*pb.ProjectList, error) {
	projects, err := handle.Store.FetchAllProjects(ctx)
	if err != nil {
		return nil, err
	}

	var pl pb.ProjectList
	for _, proj := range projects {
		pl.Projects = append(pl.Projects, &pb.ProjectData{
			ProjId: proj.ProjId,
			ProjName: proj.ProjName,
			ProfUsername: proj.ProfUsername,
			Description: proj.Description,
			MaxOccupancy: proj.MaxOccupancy,
			TokenDistribution: proj.TokenDistribution,
		})
	}
	return &pl, nil
}

func (handle *Handler) FetchProjectByProfId(ctx context.Context, req *pb.ProfProjectUsername) (*pb.ProjectList, error) {
	projects, err := handle.Store.FetchProjectByProfId(ctx, req.ProfUsername)
	if err != nil {
		return nil, err
	}

	var pl pb.ProjectList
	for _, proj := range projects {
		pl.Projects = append(pl.Projects, &pb.ProjectData{
			ProjId: proj.ProjId,
			ProjName: proj.ProjName,
			ProfUsername: proj.ProfUsername,
			Description: proj.Description,
			MaxOccupancy: proj.MaxOccupancy,
			TokenDistribution: proj.TokenDistribution,
		})
	}
	return &pl, nil
}

func (handle *Handler) AddStudentTokenToProject(ctx context.Context, req *pb.TokenProjectData) (*pb.ProjectId, error) {
	id, err := handle.Store.AddStudentTokenToProject(ctx, mdl.TokenDoc{
		ProjId: req.ProjId,
		StudUsername: req.StudUsername,
		Token: req.Token,
	})

	if err != nil {
		return nil, err
	}

	return &pb.ProjectId{ ProjId: id}, nil
}

func (handle *Handler) DeleteStudentTokenToProject(ctx context.Context, req *pb.StudentProjectUsername) (*pb.ProjectId, error) {
	id, err := handle.Store.DeleteStudentTokenToProject(ctx, req.ProjId, req.StudUsername)
	if err != nil {
		return nil, err
	}

	return &pb.ProjectId{ ProjId: id}, nil
}

func (handle *Handler) AddProfessorProfile(ctx context.Context, req *pb.ProfessorData) (*pb.ProfessorUsername, error) {
	id, err := handle.Store.AddProfessorProfile(ctx, &mdl.ProfessorDoc{
		ProfId: rng.GenerateUUID(),
		ProfUsername: req.ProfUsername,
		ProfName: req.ProfName,
		Email: req.Email,
		About: req.About,
		Link: req.Link,
	})

	if err != nil {
		return nil, err
	}

	return &pb.ProfessorUsername{ ProfUsername: id }, nil
}

func (handle *Handler) EditProfessorProfile(ctx context.Context, req *pb.ProfessorEditData) (*pb.ProfessorUsername, error) {
	id, err := handle.Store.EditProfessorProfile(ctx, &mdl.ProfessorEdit{
		ProfName: req.ProfName,
		Email: req.Email,
		About: req.About,
		Link: req.Link,
	}, req.ProfUsername)

	if err != nil {
		return nil, err
	}

	return &pb.ProfessorUsername{ ProfUsername: id}, nil
}

func (handle *Handler) AddStudentProfile(ctx context.Context, req *pb.StudentData) (*pb.StudentUsername, error) {
	id, err := handle.Store.AddStudentProfile(ctx, &mdl.StudentDoc{
		StudId: rng.GenerateUUID(),
		StudUsername: req.StudUsername,
		StudName: req.StudName,
		Email: req.Email,
		About: req.About,
		FinalProjId: req.FinalProjId,
		Link: req.Link,
		TokenDistribution: req.TokenDistribution,
	})

	if err != nil {
		return nil, err
	}

	return &pb.StudentUsername{ StudUsername: id }, nil
}

func (handle *Handler) EditStudentProfile(ctx context.Context, req *pb.StudentData) (*pb.StudentUsername, error) {
	id, err := handle.Store.EditStudentProfile(ctx, &mdl.StudentEdit{
		StudName: req.StudName,
		Email: req.Email,
		About: req.About,
		Link: req.Link,
	}, req.StudName)

	if err != nil {
		return nil, err
	}

	return &pb.StudentUsername{ StudUsername: id}, nil
}

func (handle *Handler) AddProjectTokenToStudent(ctx context.Context, req *pb.TokenStudentData) (*pb.StudentUsername, error) {
	id, err := handle.Store.AddProjectTokenToStudent(ctx, mdl.TokenDoc{
		ProjId: req.ProjId,
		StudUsername: req.StudUsername,
		Token: req.Token,
	})

	if err != nil {
		return nil, err
	}

	return &pb.StudentUsername{ StudUsername: id}, nil
}

func (handle *Handler) DeleteProjectTokenToStudent(ctx context.Context, req *pb.ProjectStudentId) (*pb.StudentUsername, error) {
	id, err := handle.Store.DeleteProjectTokenToStudent(ctx, req.ProjId, req.StudUsername)
	if err != nil {
		return nil, err
	}

	return &pb.StudentUsername{ StudUsername: id}, nil
}