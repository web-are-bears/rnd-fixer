package main

import (
	"context"
	"fmt"
	"log/slog"
	"net"
	"os"
	"os/signal"
	"syscall"

	pb  "github.com/wbb/rnd-fixer/services/auth/proto"
	mdl "github.com/wbb/rnd-fixer/services/auth/model"
	handler "github.com/wbb/rnd-fixer/services/auth/handler"
	"github.com/wbb/rnd-fixer/shared/config"
	"github.com/wbb/rnd-fixer/shared/mongo"
	"google.golang.org/grpc"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil)).With("service", "auth-service")
	server := make(chan *grpc.Server, 1)

	cfg, err := config.LoadAuthConfig()
	if err != nil {
		logger.Error("failed to load auth config", "error", err)
		os.Exit(1)
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	// get mongodb connection
	mongoClient, err := mongo.MongoConnect(ctx)
	if err != nil {
		logger.Error("failed  to connect to mongodb", "error", err)
		os.Exit(1)
	}
	defer func() {
		if err := mongoClient.Disconnect(ctx); err != nil {
			logger.Error("failed to disconnect from mongodb", "error", err)
		}
	}()

	go func(ch chan *grpc.Server) {
		lis, err := net.Listen("tcp", fmt.Sprintf(":%d", cfg.Port))
		if err != nil {
			logger.Error(fmt.Sprintf("failed to listen to port: %v", cfg.Port))
			os.Exit(1)
		}

		// create a store
		store := mongo.NewStore[mdl.UserDoc](logger, mongoClient, "rnd_match_fixer", "User") // TODO (ashu3103): use database name and collection name
		grpcServer := grpc.NewServer() // TODO (ashu3103): Unary Interceptors
		ch <- grpcServer
		
		// register your gRPC services here
		pb.RegisterAuthServiceServer(grpcServer, handler.NewHandler(store))

		logger.Info("starting gRPC auth service on", "port", cfg.Port)
		if err := grpcServer.Serve(lis); err != nil {
			logger.Error(fmt.Sprintf("failed to serve: %v", err))
			os.Exit(1)
		}
	}(server)

	<-ctx.Done()
	stop()

	logger.Info("shutting down auth service")
	serverInstance := <-server
	serverInstance.GracefulStop()

	logger.Info("auth service shut down gracefully")
}

