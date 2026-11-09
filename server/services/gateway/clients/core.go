package clients

import (
	"context"

	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"google.golang.org/grpc"
	core_pb "github.com/wbb/rnd-fixer/services/core/proto"
)

type CoreClient struct {
	conn *grpc.ClientConn
}

func (c *CoreClient) Close() error {
	return c.conn.Close()
}

func NewCoreClient(c *grpc.ClientConn) Client {
	return &CoreClient {
		conn: c,
	}
}

func (c *CoreClient) RegisterHandler(ctx context.Context, mux *runtime.ServeMux) error {
	if err := core_pb.RegisterCoreProjectServiceHandler(ctx, mux, c.conn); err != nil {
		return err
	}
	if err := core_pb.RegisterCoreProfessorServiceHandler(ctx, mux, c.conn); err != nil {
		return err
	}
	if err := core_pb.RegisterCoreStudentServiceHandler(ctx, mux, c.conn); err != nil {
		return err
	}
	return nil
}