package middleware

import (
	"log/slog"
	"net/http"

	"github.com/wbb/rnd-fixer/services/gateway/apierror"
)

func RecoverMiddleware(logger *slog.Logger) Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			defer func() {
				if err := recover(); err != nil {
					logger.Error("panic recovered", "error", err)
					reqID := RequestIDFrom(r.Context())
					apierror.Write(w, http.StatusInternalServerError, apierror.Error{
						Code:      "INTERNAL",
						Message:   "internal error",
						RequestID: reqID,
					})
				}
			}()
			next.ServeHTTP(w, r)
		})
	}
}