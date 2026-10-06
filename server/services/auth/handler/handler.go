package auth

import (
	"context"

	mdl "github.com/wbb/rnd-fixer/services/auth/model"
	pb "github.com/wbb/rnd-fixer/services/auth/proto"
	"github.com/wbb/rnd-fixer/shared/mongo"
	"golang.org/x/crypto/bcrypt"
)

type Handler struct {
	*pb.UnimplementedAuthServiceServer
	store *mdl.AuthStore
}

func NewHandler(s *mongo.Store[mdl.UserDoc]) *Handler {
	return &Handler{
		store: mdl.NewAuthStore(s),
	}
}

func (handle *Handler) Register(ctx context.Context, req *pb.RegisterRequest) (*pb.RegisterResponse, error) {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), 10)
	if err != nil {
		return nil, err
	}

	document := mdl.UserDoc{
		Username: req.Username,
		Password: string(hashedPassword),
		Role: mdl.RoleType(req.Role),
	}

	id, err := handle.store.CreateUser(ctx, &document)
	if err != nil {
		return nil, err
	}

	return &pb.RegisterResponse{UserId: id}, nil
}