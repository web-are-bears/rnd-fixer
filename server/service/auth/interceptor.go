package auth

import (
	"context"
	"log/slog"

	"google.golang.org/grpc"
)

type loggerContextKey string

const contextLoggerKey loggerContextKey = "login.logger"

func WithLogger(ctx context.Context, logger *slog.Logger) context.Context {
	if logger == nil {
		logger = slog.Default()
	}
	return context.WithValue(ctx, contextLoggerKey, logger)
}

func FromContext(ctx context.Context) *slog.Logger {
	if ctx == nil {
		return slog.Default()
	}
	if logger, ok := ctx.Value(contextLoggerKey).(*slog.Logger); ok && logger != nil {
		return logger
	}
	return slog.Default()
}

func LoggerUnaryInterceptor(logger *slog.Logger) grpc.UnaryServerInterceptor {
	base := logger
	if base == nil {
		base = slog.Default()
	}

	return func(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (interface{}, error) {
		ctx = WithLogger(ctx, base)
		base.With("method", info.FullMethod).InfoContext(ctx, "grpc request started")

		resp, err := handler(ctx, req)
		if err != nil {
			base.With("method", info.FullMethod, "error", err).ErrorContext(ctx, "grpc request failed")
			return nil, err
		}

		base.With("method", info.FullMethod).InfoContext(ctx, "grpc request completed")
		return resp, nil
	}
}
