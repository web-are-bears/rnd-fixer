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
	pb.UnimplementedCoreServiceServer
	projectStore *mdl.CoreStore
}

func NewHandler(ps *mongo.Store[mdl.ProjectDoc]) *Handler {
	return &Handler{
		projectStore: mdl.NewCoreStore(ps),
	}
}

func (handle *Handler) AddProject(ctx context.Context, req *pb.ProjectData) (*pb.ProjectId, error) {
	document := mdl.ProjectDoc{
		ProjectId: rng.GenerateUUID(),
		ProjectName: req.ProjectName,
		ProfId: req.ProfId,
		Description: req.Description,
		MaxOccupancy: req.MaxOccupancy,
		TokenDistribution: req.TokenDistribution,
	}

	id, err := handle.projectStore.AddProject(ctx, &document)
	if err != nil {
		return nil, err
	}

	return &pb.ProjectId{ ProjectId: id }, nil
}

func (handle *Handler) FetchProject(ctx context.Context, req *pb.ProjectId) (*pb.ProjectData, error) {
	document, err := handle.projectStore.FetchProject(ctx, req.ProjectId)
	if err != nil {
		return nil, err
	}

	return &pb.ProjectData{
		ProjectId: document.ProjectId,
		ProjectName: document.ProjectName,
		ProfId: document.ProfId,
		Description: document.Description,
		MaxOccupancy: document.MaxOccupancy,
		TokenDistribution: document.TokenDistribution,
	}, nil
}

func (handle *Handler) FetchAllProjects(ctx context.Context, _ *emptypb.Empty) (*pb.ProjectList, error) {
	projects, err := handle.projectStore.FetchAllProjects(ctx)
	if err != nil {
		return nil, err
	}

	var pl pb.ProjectList
	for _, proj := range projects {
		pl.Projects = append(pl.Projects, &pb.ProjectData{
			ProjectId: proj.ProjectId,
			ProjectName: proj.ProjectName,
			ProfId: proj.ProfId,
			Description: proj.Description,
			MaxOccupancy: proj.MaxOccupancy,
			TokenDistribution: proj.TokenDistribution,
		})
	}
	return &pl, nil
}

func (handle *Handler) FetchProjectByProfId(ctx context.Context, req *pb.ProfId) (*pb.ProjectList, error) {
	projects, err := handle.projectStore.FetchProjectByProfId(ctx, req.ProfId)
	if err != nil {
		return nil, err
	}

	var pl pb.ProjectList
	for _, proj := range projects {
		pl.Projects = append(pl.Projects, &pb.ProjectData{
			ProjectId: proj.ProfId,
			ProjectName: proj.ProjectName,
			ProfId: proj.ProfId,
			Description: proj.Description,
			MaxOccupancy: proj.MaxOccupancy,
			TokenDistribution: proj.TokenDistribution,
		})
	}
	return &pl, nil
}

func (handle *Handler) AddStudentTokenToProject(ctx context.Context, req *pb.TokenData) (*pb.ProjectId, error) {
	id, err := handle.projectStore.AddStudentTokenToProject(ctx, mdl.TokenDoc{
		ProjectId: req.ProjectId,
		StudentId: req.StudentId,
		Token: req.Token,
	})

	if err != nil {
		return nil, err
	}

	return &pb.ProjectId{ProjectId: id}, nil
}

func (handle *Handler) DeleteStudentTokenToProject(ctx context.Context, req *pb.StudentId) (*pb.ProjectId, error) {
	id, err := handle.projectStore.DeleteStudentTokenToProject(ctx, req.ProjectId, req.StudentId)
	if err != nil {
		return nil, err
	}

	return &pb.ProjectId{ProjectId: id}, nil
}