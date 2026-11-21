package interceptor

import (
	"context"
	"crypto/ed25519"
	"fmt"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/wbb/rnd-fixer/shared/authctx"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
)

func AuthInterceptor(pub *ed25519.PublicKey) grpc.UnaryServerInterceptor {
	return func(ctx context.Context, req any, _ *grpc.UnaryServerInfo, next grpc.UnaryHandler) (any, error) {
		md, _ := metadata.FromIncomingContext(ctx)
		vals := md.Get("authorization")
		if len(vals) == 0 {
			return nil, status.Error(codes.Unauthenticated, "missing token")
		}

		raw := strings.TrimPrefix(vals[0], "Bearer ")
		tok, err := jwt.Parse(raw,
			func(*jwt.Token) (any, error) {
				return *pub, nil
			},
			jwt.WithValidMethods([]string{jwt.SigningMethodEdDSA.Alg()}),
		)
		if err != nil || !tok.Valid {
			return nil, status.Error(codes.Unauthenticated, "invalid token")
		}

		mc, _ := tok.Claims.(jwt.MapClaims)
		username, _ := mc["username"].(string)
		role, _ := mc["role"].(string)
		if username == "" {
			return nil, status.Error(codes.Unauthenticated, "invalid token")
		}

		return next(authctx.WithContext(ctx, &authctx.User{ID: username, Role: role}), req)
	}
}