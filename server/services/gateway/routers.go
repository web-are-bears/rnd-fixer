package router

import (
	"context"
	"log/slog"
	"net/http"

	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"github.com/wbb/rnd-fixer/services/gateway/clients"
	"github.com/wbb/rnd-fixer/services/gateway/middleware"
	"github.com/wbb/rnd-fixer/shared/jwtauth"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/encoding/protojson"
)

func NewRouter(ctx context.Context, conns *clients.Clients, logger *slog.Logger) (http.Handler, error) {
	gw := runtime.NewServeMux(
		runtime.WithMarshalerOption(runtime.MIMEWildcard, &runtime.JSONPb{
			MarshalOptions: protojson.MarshalOptions{
				UseProtoNames: true,
				EmitUnpopulated: true,
			},
		}),

		// block clients from injecting arbitrary metadata via "Grpc-Metadata-*" headers
		runtime.WithIncomingHeaderMatcher(func(string) (string, bool) { return "", false }),

		runtime.WithErrorHandler(func(ctx context.Context, mux *runtime.ServeMux, m runtime.Marshaler,
			w http.ResponseWriter, r *http.Request, err error) {
			if c := status.Code(err); c == codes.Internal || c == codes.Unknown {
				logger.Error("downstream error", "request_id", middleware.RequestIDFrom(r.Context()), "err", err)
				err = status.Error(c, "internal error")
			}
			runtime.DefaultHTTPErrorHandler(ctx, mux, m, w, r, err)
		}),
	)

	if err := conns.RegisterHandler(ctx, gw); err != nil {
		return nil, err
	}

	root := http.NewServeMux()
	root.HandleFunc("GET /health", func(w http.ResponseWriter, _ *http.Request) { w.WriteHeader(http.StatusOK) })
	root.Handle("/", gw) // everything else goes to the generated handlers

	public := map[string]bool{
		"GET /health": true,
		"POST /v1/auth/register": true,
		"POST /v1/auth/login": true,
	}

	// load the public key and verify the authentication key
	pub, err := jwtauth.LoadPublicKey("/home/ashu3103/Desktop/rnd-fixer/server/shared/jwtauth/keys/public.pem") // TODO: change this
	if err != nil {
		logger.Error("failed to fetch public key", "error", err)
		return nil, err
	}

	verifier := jwtauth.NewVerifier(jwtauth.Config{
		Issuer:   "rnd-fixer-auth", // must match the signer in auth-service
		Audience: "rnd-fixer",
	}, pub)

	// add middlewares
	return middleware.Chain(root,
		middleware.AuthMiddleware(verifier, public),
		middleware.RequestIDMiddleware(),
	), nil
}