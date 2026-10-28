package clients

import (
	"context"

	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"github.com/wbb/rnd-fixer/services/gateway/middleware"
	"github.com/wbb/rnd-fixer/shared/authctx"
	"github.com/wbb/rnd-fixer/shared/config"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

type Client interface {
	Close() error
	RegisterHandler(context.Context, *runtime.ServeMux) error
}

type Clients struct {
	conns []Client
}

func forwardIdentity(
	ctx context.Context, method string, req, reply any,
	cc *grpc.ClientConn, invoker grpc.UnaryInvoker, opts ...grpc.CallOption,
) error {
	ctx = authctx.ToDownstream(ctx, middleware.RequestIDFrom(ctx))
	return invoker(ctx, method, req, reply, cc, opts...)
}

// TODO (ashu3103): can add streaming interceptor here if needed
func dial(addr string) (*grpc.ClientConn, error) {
	return grpc.NewClient(addr, grpc.WithTransportCredentials(insecure.NewCredentials()), grpc.WithChainUnaryInterceptor(forwardIdentity))
}

func NewClients(cfg config.GatewayConfig) (*Clients, error) {
	clients := &Clients{}
	for _, d := range []struct{
		addr string
		constructor  func(*grpc.ClientConn) Client
	}{
		{config.Env("AUTH_ADDR", "localhost:9001"), NewAuthClient},
	} {
		conn, err := dial(d.addr)
		if err != nil {
			return nil, err
		}
		clients.conns = append(clients.conns, d.constructor(conn))
	}
	return clients, nil
}

func (c *Clients) Close() {
	for _, conn := range c.conns {
		_ = conn.Close()
	}
}

func (c *Clients) RegisterHandler(ctx context.Context, mux *runtime.ServeMux) error {
	for _, conn := range c.conns {
		if err := conn.RegisterHandler(ctx, mux); err != nil {
			return err;
		}
	}
	return nil
}