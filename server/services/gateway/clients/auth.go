package clients

import (
	"context"

	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"google.golang.org/grpc"
	auth_pb "github.com/wbb/rnd-fixer/services/auth/proto"
)

type AuthClient struct {
	conn *grpc.ClientConn
}

func (c *AuthClient) Close() error {
	return c.conn.Close()
}

func NewAuthClient(c *grpc.ClientConn) Client {
	return &AuthClient{
		conn: c,
	}
}

func (c *AuthClient) RegisterHandler(ctx context.Context, mux *runtime.ServeMux) error {
	if err := auth_pb.RegisterAuthServiceHandler(ctx, mux, c.conn); err != nil {
		return err
	}
	return nil
}