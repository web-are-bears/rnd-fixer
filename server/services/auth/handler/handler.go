package auth

import (
	"context"
	"fmt"
	"time"

	mdl "github.com/wbb/rnd-fixer/services/auth/model"
	pb "github.com/wbb/rnd-fixer/services/auth/proto"
	"github.com/wbb/rnd-fixer/shared/jwtauth"
	"github.com/wbb/rnd-fixer/shared/mongo"
	"golang.org/x/crypto/bcrypt"
)

type Handler struct {
	pb.UnimplementedAuthServiceServer
	store *mdl.AuthStore
	signer *jwtauth.Signer
}

func NewHandler(s *mongo.Store[mdl.UserDoc]) *Handler {
	priv, err := jwtauth.LoadPrivateKey("/home/ashu3103/Desktop/rnd-fixer/server/shared/jwtauth/keys/private.pem") // TODO: change this
	if err != nil {
		return nil
	}
	signer := jwtauth.NewSigner(priv, jwtauth.Config{
		Issuer:   "rnd-fixer-auth",
		Audience: "rnd-fixer",
		TTL:      15 * time.Minute,
	})
	return &Handler{
		store: mdl.NewAuthStore(s),
		signer: signer,
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
		Role:     req.Role,
	}

	id, err := handle.store.CreateUser(ctx, &document)
	if err != nil {
		return nil, err
	}

	return &pb.RegisterResponse{UserId: id}, nil
}

func (handle *Handler) Login(ctx context.Context, req *pb.LoginRequest) (*pb.LoginResponse, error) {
	document, err := handle.store.GetUserByID(ctx, req.Username)
	if err != nil {
		return nil, err
	}

	// verify the password
	if err := bcrypt.CompareHashAndPassword([]byte(document.Password), []byte(req.Password)); err != nil {
		return nil, fmt.Errorf("incorrect credentials")
	}

	// generate jwt token
	tok, _, err := handle.signer.Issue(document.Username, document.Role)
	if err != nil {
		return nil, err
	}

	return &pb.LoginResponse{AccessToken: tok}, nil
}
