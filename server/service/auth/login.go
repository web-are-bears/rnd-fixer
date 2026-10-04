package auth

import (
	"context"
	"fmt"
	"log/slog"

	"google.golang.org/grpc"
)

type AuthService struct {
	UnimplementedAuthServiceServer
	logger *slog.Logger
	users  map[string]string
}

func NewDummyAuthService(logger *slog.Logger) *AuthService {
	if logger == nil {
		logger = slog.Default()
	}

	return &AuthService{
		logger: logger,
		users: map[string]string{
			"john@example.com": "password123",
			"jane@example.com": "secret123",
		},
	}
}

func NewGRPCServer(logger *slog.Logger, svc AuthServiceServer) *grpc.Server {
	if logger == nil {
		logger = slog.Default()
	}
	server := grpc.NewServer(grpc.UnaryInterceptor(LoggerUnaryInterceptor(logger)))
	RegisterAuthServiceServer(server, svc)
	return server
}

func (s *AuthService) Login(ctx context.Context, req *LoginRequest) (*LoginResponse, error) {
	logger := FromContext(ctx)
	if logger == nil {
		logger = s.logger
	}
	if logger == nil {
		logger = slog.Default()
	}

	if req == nil {
		logger.WarnContext(ctx, "empty login request")
		return &LoginResponse{Success: false, Message: "request is empty"}, nil
	}

	logger.InfoContext(ctx, "attempting login", "email", req.Email)

	password, ok := s.users[req.Email]
	if !ok {
		logger.WarnContext(ctx, "login failed: unknown email", "email", req.Email)
		return &LoginResponse{Success: false, Message: "invalid email or password"}, nil
	}

	if password != req.Password {
		logger.WarnContext(ctx, "login failed: invalid password", "email", req.Email)
		return &LoginResponse{Success: false, Message: "invalid email or password"}, nil
	}

	resp := &LoginResponse{
		Success: true,
		Message: "login successful",
		UserId:  fmt.Sprintf("user-%s", req.Email),
	}
	logger.InfoContext(ctx, "login succeeded", "email", req.Email, "user_id", resp.UserId)
	return resp, nil
}
