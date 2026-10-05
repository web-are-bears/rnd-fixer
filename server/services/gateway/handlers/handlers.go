package handlers

import (
	"encoding/json"
	"log/slog"
	"net/http"

	"github.com/wbb/rnd-fixer/services/gateway/clients"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type Handler struct {
	c      *clients.Clients
	logger *slog.Logger
}

func New(c *clients.Clients, l *slog.Logger) *Handler { return &Handler{c: c, logger: l} }

func writeJSON(w http.ResponseWriter, code int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, code int, msg string) {
	writeJSON(w, code, map[string]string{"error": msg})
}

func decode(w http.ResponseWriter, r *http.Request, dst any) bool {
	r.Body = http.MaxBytesReader(w, r.Body, 1<<20) // 1 MiB
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	if err := dec.Decode(dst); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return false
	}
	return true
}

// writeGRPCError maps gRPC status codes to HTTP so clients get meaningful responses.
func (h *Handler) writeGRPCError(w http.ResponseWriter, r *http.Request, err error) {
	st, _ := status.FromError(err)
	code := http.StatusInternalServerError
	switch st.Code() {
	case codes.InvalidArgument:
		code = http.StatusBadRequest
	case codes.NotFound:
		code = http.StatusNotFound
	case codes.AlreadyExists:
		code = http.StatusConflict
	case codes.Unauthenticated:
		code = http.StatusUnauthorized
	case codes.PermissionDenied:
		code = http.StatusForbidden
	case codes.ResourceExhausted:
		code = http.StatusTooManyRequests
	case codes.Unavailable, codes.DeadlineExceeded:
		code = http.StatusServiceUnavailable
	}
	msg := st.Message()
	if code == http.StatusInternalServerError {
		h.logger.Error("downstream error", "err", err, "request_id", r.Header.Get("X-Request-ID"))
		msg = "internal error" // don't leak internals
	}
	writeError(w, code, msg)
}