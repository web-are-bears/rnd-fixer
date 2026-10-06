package mongo

import (
	"fmt"
	"context"
	"time"

	"github.com/wbb/rnd-fixer/shared/config"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
	"go.mongodb.org/mongo-driver/v2/mongo/readpref"
)

func getMongoURI(cfg *config.MongoConfig) (string, error) {
	uri := "mongodb+srv://"
	if cfg.Username != "" && cfg.Password != "" {
		uri += cfg.Username + ":" + cfg.Password
	} else {
		return "", fmt.Errorf("invalid MongoDB configuration: missing username or password")
	}

	if cfg.Hostname == "" {
		return "", fmt.Errorf("invalid MongoDB configuration: missing hostname")
	}
	uri += "@" + cfg.Hostname
	uri += "/" + cfg.Database

	if len(cfg.Options) > 0 {
		uri += "?"
		first := true
		for key, value := range cfg.Options {
			if !first {
				uri += "&"
			}
			uri += key + "=" + value
			first = false
		}
	}
	return uri, nil
}

func MongoConnect(ctx context.Context) (*mongo.Client, error) {
	cfg, err := config.LoadMongoConfig()
	workDone := make(chan bool)
	client := make(chan *mongo.Client)

	if err != nil {
		return nil, fmt.Errorf("failed to load MongoDB configuration: %v", err)
	}

	// create mongo URI from the configuration
	uri, err := getMongoURI(cfg)
	if err != nil {
		return nil, err
	}

	opts := options.Client().ApplyURI(uri)

	// create a timeout for the connection attempt
	ctxTimeout, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	// connect to MongoDB in a separate goroutine
	go func(ch chan *mongo.Client) {
		client, err := mongo.Connect(opts)
		if err != nil {
			workDone <- false
			ch <- nil
			return
		}

		if err := client.Ping(ctxTimeout, readpref.Primary()); err != nil {
			workDone <- false
			ch <- nil
			return
		}

		ch <- client
		workDone <- true
	}(client)

	select {
	case <-ctxTimeout.Done():   // timeout
		return nil, ctxTimeout.Err()
	case success := <-workDone:
		if !success {
			return nil, fmt.Errorf("failed to connect to MongoDB")
		}
	}

	finalClient := <-client
	return finalClient, nil
}