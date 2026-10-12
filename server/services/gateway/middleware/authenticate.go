package middleware

import (
	"net/http"
	"strings"

	"github.com/wbb/rnd-fixer/shared/authctx"
	"github.com/wbb/rnd-fixer/shared/httpx"
	"github.com/wbb/rnd-fixer/shared/jwtauth"
)

func unauthorized(w http.ResponseWriter, msg string) {
	w.Header().Set("WWW-Authenticate", `Bearer realm="api"`)
	httpx.WriteError(w, http.StatusUnauthorized, msg)
}

func AuthMiddleware(v *jwtauth.Verifier, public map[string]bool) Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func (w http.ResponseWriter, r *http.Request) {
			if public[r.Method+" "+r.URL.Path] {
				next.ServeHTTP(w, r)
				return
			}

			raw, ok := strings.CutPrefix(r.Header.Get("Authorization"), "Bearer ")
			// authentication token not found - redirect to login page
			if !ok || raw == "" {
				unauthorized(w, "missing or malformed authorization token")
				return
			}

			// failed to verify claims - redirect to login page
			claims, err := v.Verify(raw)
			if err != nil {
				unauthorized(w, "invalid or expired token")
				return
			}

			ctx := authctx.WithContext(r.Context(), &authctx.User{ ID: claims.ID, Role: claims.Role })
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}