package gateway

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/wbb/rnd-fixer/services/gateway"
	"github.com/wbb/rnd-fixer/services/gateway/clients"
	"github.com/wbb/rnd-fixer/shared/config"
)

func main() {
	// create a logger instance with service name attached as key-value pair
	// TODO (ashu3103): replace this with our logger implementation
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil)).With("service", "gateway")
	cfg, err := config.LoadGatewayConfig()

	if err != nil {
		logger.Error("failed to load config", "error", err)
		os.Exit(1)
	}

	cl , err := clients.NewClients(*cfg)
	if err != nil {
		logger.Error("failed to create clients", "error", err)
		os.Exit(1)
	}
	defer cl.Close()

	// listen to interrupt signals for graceful shutdown
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	// define server attributes
	srv := &http.Server{
		Addr:    fmt.Sprintf("%s:%d", cfg.Address, cfg.Port),
		Handler: gateway.NewRouter(*cfg, cl, logger),
		ReadHeaderTimeout: 5*time.Second,
		ReadTimeout:       15*time.Second,
		WriteTimeout:      30*time.Second,
		IdleTimeout:       60*time.Second,
	}

	logger.Info("starting gateway server", "address", cfg.Address, "port", cfg.Port)

	// start the server in goroutine concurrent to main thread
	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Error("failed to start server", "error", err)
			os.Exit(1)
		}
	}()

	<-ctx.Done()
	stop()
	logger.Info("shutting down gateway server")

	if err := srv.Shutdown(context.Background()); err != nil {
		logger.Error("failed to shutdown server gracefully", "error", err)
		os.Exit(1)
	}

	logger.Info("gateway server stopped")
}