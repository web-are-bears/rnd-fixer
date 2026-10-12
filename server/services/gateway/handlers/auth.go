package handlers

import (
	"log/slog"
	"net/http"

	auth "github.com/wbb/rnd-fixer/services/auth/proto"
)

type AuthHandler struct {
	client auth.AuthServiceClient
	log    *slog.Logger
}

func NewAuthHandler(cl auth.AuthServiceClient, logger *slog.Logger) *AuthHandler {
	return &AuthHandler{
		client: cl,
		log: logger,
	}
}

// mount the service's routes
func (h *AuthHandler) Mount(mux *http.ServeMux, protect func(http.Handler) http.Handler) {
	mux.HandleFunc("POST /v1/auth/register", h.Register)
}


// HTTP wrappers around gRPC calls
func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {}