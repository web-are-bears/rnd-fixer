package authctx

import (
	"context"

	"google.golang.org/grpc/metadata"
)

type User struct {
	ID string
	Role string  // student | professor | admin
}

type userKey struct{}

// pass the user information in the context
func WithContext(ctx context.Context, user *User) context.Context {
	return context.WithValue(ctx, userKey{}, user)
}

// extract the user information from the context
func FromContext(ctx context.Context) *User {
	user, ok := ctx.Value(userKey{}).(*User)
	if !ok {
		return nil
	}
	return user
}

// copies identity into gRPC metadata to downstream
func ToDownstream(ctx context.Context, requestID string) context.Context {
	// pass user data to metadata
	if user := FromContext(ctx); user != nil {
		ctx = metadata.AppendToOutgoingContext(ctx, "x-user-id", user.ID)
		ctx = metadata.AppendToOutgoingContext(ctx, "x-user-role", user.Role)
	}
	
	if requestID != "" {
		ctx = metadata.AppendToOutgoingContext(ctx, "x-request-id", requestID)
	}

	return ctx
}

// extracts identity from gRPC metadata
func FromUpstream(ctx context.Context) *User {
	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return nil
	}

	userID := md.Get("x-user-id")
	userRole := md.Get("x-user-role")

	if len(userID) == 0 || len(userRole) == 0 {
		return nil
	}

	return &User{
		ID:   userID[0],
		Role: userRole[0],
	}
}