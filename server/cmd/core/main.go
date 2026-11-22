package main

import (
	"context"
	"fmt"
	"log/slog"
	"net"
	"os"
	"os/signal"
	"syscall"

	"github.com/wbb/rnd-fixer/services/core/handler"
	"github.com/wbb/rnd-fixer/services/core/interceptor"
	mdl "github.com/wbb/rnd-fixer/services/core/model"
	pb "github.com/wbb/rnd-fixer/services/core/proto"
	"github.com/wbb/rnd-fixer/shared/config"
	"github.com/wbb/rnd-fixer/shared/jwtauth"
	"github.com/wbb/rnd-fixer/shared/mongo"
	"google.golang.org/grpc"
)


func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil)).With("service", "core-service")
	server := make(chan *grpc.Server, 1)

	cfg, err := config.LoadCoreConfig()
	if err != nil {
		logger.Error("failed to load auth config", "error", err)
		os.Exit(1)
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	// get mongodb connection
	mongo_cfg, err := config.LoadCoreMongoConfig()
	if err != nil {
		logger.Error("error loading the mongo config")
	}
	mongoClient, err := mongo.MongoConnect(ctx, mongo_cfg)
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
		lis, err := net.Listen("tcp", config.Env("CORE_LISTEN_ADDR", "localhost:9002"))
		if err != nil {
			logger.Error(fmt.Sprintf("failed to listen to port: %v", cfg.Port))
			os.Exit(1)
		}

		pub, err := jwtauth.LoadPublicKey(config.Env("JWT_PUBLIC_KEY", "/home/ashu3103/Desktop/rnd-fixer/server/shared/jwtauth/keys/public.pem"))
		if (err != nil) {
			logger.Error("failed to fetch public key", "error", err)
			os.Exit(1)
		}

		// create a store
		proj_store := mongo.NewStore[mdl.ProjectDoc](logger, mongoClient, mongo_cfg.Database, mongo_cfg.Collection + "_project")
		prof_store := mongo.NewStore[mdl.ProfessorDoc](logger, mongoClient, mongo_cfg.Database, mongo_cfg.Collection + "_professor")
		stud_store := mongo.NewStore[mdl.StudentDoc](logger, mongoClient, mongo_cfg.Database, mongo_cfg.Collection + "_student")
		grpcServer := grpc.NewServer(
			grpc.ChainUnaryInterceptor(interceptor.AuthInterceptor(&pub)),
		)
		ch <- grpcServer
		
		// register your gRPC services here
		var handle *handler.Handler = handler.NewHandler(proj_store, prof_store, stud_store)
		pb.RegisterCoreProfessorServiceServer(grpcServer, handle)
		pb.RegisterCoreProjectServiceServer(grpcServer, handle)
		pb.RegisterCoreStudentServiceServer(grpcServer, handle)
		pb.RegisterAlgorithmServiceServer(grpcServer, handle)

		logger.Info("starting gRPC core service on", "port", cfg.Port)
		if err := grpcServer.Serve(lis); err != nil {
			logger.Error(fmt.Sprintf("failed to serve: %v", err))
			os.Exit(1)
		}
	}(server)

	<-ctx.Done()
	stop()

	logger.Info("shutting down core service")
	serverInstance := <-server
	serverInstance.GracefulStop()

	logger.Info("core service shut down gracefully")
}