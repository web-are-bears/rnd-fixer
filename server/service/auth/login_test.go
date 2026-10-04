package auth

import (
	"context"
	"io"
	"log/slog"
	"testing"
)

func TestFromContextAndLogin(t *testing.T) {
	logger := slog.New(slog.NewTextHandler(io.Discard, nil))
	ctx := WithLogger(context.Background(), logger)
	if got := FromContext(ctx); got == nil {
		t.Fatal("expected logger from context")
	}

	svc := NewDummyAuthService(logger)
	resp, err := svc.Login(ctx, &LoginRequest{Email: "john@example.com", Password: "password123"})
	if err != nil {
		t.Fatalf("Login returned error: %v", err)
	}
	if !resp.Success {
		t.Fatal("expected login response to be successful")
	}
}
