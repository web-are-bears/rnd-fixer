package gateway

import (
	"log/slog"
	"net/http"

	"github.com/wbb/rnd-fixer/shared/config"
	"github.com/wbb/rnd-fixer/services/gateway/clients"
	"github.com/wbb/rnd-fixer/services/gateway/middleware"
)

func NewRouter(cfg config.GatewayConfig, cl *clients.Clients, logger *slog.Logger) http.Handler {
	// TODO (ashu3103): add handlers here

	// TODO (ashu3103): add authentication and roles middleware here

	mux := http.NewServeMux()

	// health (unauthenticated, no rate limit needed)
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	// TODO (ashu3103): add more routes here

	// global middleware, outermost first
	return middleware.Chain(mux,
		middleware.RequestIDMiddleware(),
		middleware.RecoverMiddleware(logger),
		middleware.LoggerMiddleware(logger),
		// TODO (ashu3103): add rate limiting middleware here
	)
}