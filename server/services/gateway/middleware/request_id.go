package middleware

import (
	"context"
	"net/http"

	"github.com/google/uuid"
)

type requestIDKey struct{}

func RequestIDFrom(ctx context.Context) string {
	if requestID, ok := ctx.Value(requestIDKey{}).(string); ok {
		return requestID
	}
	return ""
}

func WithRequestID(ctx context.Context, requestID string) context.Context {
	return context.WithValue(ctx, requestIDKey{}, requestID)
}

// generate a 64-bit random request ID using UUID
func generateRequestID() string {
	return uuid.New().String()
}

func RequestIDMiddleware() Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			id := r.Header.Get("X-Request-ID")
			if id == "" {
				id = generateRequestID()
			}

			ctx := WithRequestID(r.Context(), id)
			w.Header().Set("X-Request-ID", id)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}