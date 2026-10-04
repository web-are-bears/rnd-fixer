package logger

import (
	"os"
	"path/filepath"
	"testing"

	config "github.com/wbb/rnd-fixer/shared/config"
)

func TestLoggerConfigValidateRejectsUnknownLevel(t *testing.T) {
	cfg := config.LoggerConfig{Level: "verbose"}
	if err := cfg.Validate(); err == nil {
		t.Fatal("expected validation error for invalid log level")
	}
}

func TestNewWithConfigWritesToFile(t *testing.T) {
	path := filepath.Join(t.TempDir(), "app.log")
	cfg := config.LoggerConfig{Level: "info", Path: path, JSON: true}

	l, err := NewWithConfig(cfg)
	if err != nil {
		t.Fatalf("NewWithConfig returned error: %v", err)
	}
	defer l.Close()

	l.Info("hello from file")

	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("reading log file: %v", err)
	}
	if len(data) == 0 {
		t.Fatal("expected log file to contain output")
	}
}
