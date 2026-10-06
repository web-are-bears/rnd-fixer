package mongo

import (
	"context"

	"go.mongodb.org/mongo-driver/v2/mongo"
)

func WithTx(ctx context.Context, client *mongo.Client, fn func(ctx context.Context) error) error {
	session, err := client.StartSession()
	if err != nil {
		return err
	}
	defer session.EndSession(ctx)

	_, err = session.WithTransaction(ctx, func(ctx context.Context) (any, error) {
		return nil, fn(ctx)
	})

	return err
}