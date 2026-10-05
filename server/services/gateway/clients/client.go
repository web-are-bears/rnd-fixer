package clients

import (
	"context"

	"github.com/wbb/rnd-fixer/shared/config"
	"github.com/wbb/rnd-fixer/services/gateway/middleware"
	"github.com/wbb/rnd-fixer/shared/authctx"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

type Clients struct {
	conns []*grpc.ClientConn
}

func forwardIdentity(
	ctx context.Context, method string, req, reply any,
	cc *grpc.ClientConn, invoker grpc.UnaryInvoker, opts ...grpc.CallOption,
) error {
	ctx = authctx.ToDownstream(ctx, middleware.RequestIDFrom(ctx))
	return invoker(ctx, method, req, reply, cc, opts...)
}

func dial(addr string) (*grpc.ClientConn, error) {
	return grpc.NewClient(addr, grpc.WithTransportCredentials(insecure.NewCredentials()), grpc.WithChainUnaryInterceptor(forwardIdentity))
}

func NewClients(cfg config.GatewayConfig) (*Clients, error) {
	clients := &Clients{}
	for _, d := range []struct{
		addr string
		set  func(*grpc.ClientConn)
	}{
		// TODO (ashu3103): add services here
	} {
		conn, err := dial(d.addr)
		if err != nil {
			return nil, err
		}
		clients.conns = append(clients.conns, conn)
		d.set(conn)
	}
	return clients, nil
}

func (c *Clients) Close() {
	for _, conn := range c.conns {
		_ = conn.Close()
	}
}