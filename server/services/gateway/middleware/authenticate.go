package middleware

import (
	"net/http"
	"strings"

	"github.com/wbb/rnd-fixer/services/gateway/apierror"
	"github.com/wbb/rnd-fixer/shared/authctx"
	"github.com/wbb/rnd-fixer/shared/jwtauth"
)

func unauthorized(w http.ResponseWriter, r *http.Request, msg string) {
	w.Header().Set("WWW-Authenticate", `Bearer realm="api"`)
	apierror.Write(w, http.StatusUnauthorized, apierror.Error{
		Code:      "UNAUTHENTICATED",
		Message:   msg,
		RequestID: RequestIDFrom(r.Context()),
	})
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
				unauthorized(w, r, "missing or malformed authorization token")
				return
			}

			// failed to verify claims - redirect to login page
			claims, err := v.Verify(raw)
			if err != nil {
				unauthorized(w, r, "invalid or expired token")
				return
			}

			ctx := authctx.WithContext(r.Context(), &authctx.User{ ID: claims.ID, Role: claims.Role })
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}