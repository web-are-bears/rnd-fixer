package logger

import (
	"io"
	"fmt"
	"log/slog"
	"os"
	"path/filepath"
	"strings"

	config "github.com/wbb/rnd-fixer/shared/config"
)

type Logger struct {
	*slog.Logger
	closer io.Closer
}

func New() (*Logger, error) {
	return NewWithConfig(config.LoggerConfig{
		Level: "info",
		Path:  "stdout",
		JSON:  false,
	})
}

func NewWithConfig(cfg config.LoggerConfig) (*Logger, error) {
	if err := cfg.Validate(); err != nil {
		return nil, err
	}

	level, err := parseLevel(cfg.Level)
	if err != nil {
		return nil, err
	}

	writer, closer, err := openSink(cfg.Path)
	if err != nil {
		return nil, err
	}

	options := &slog.HandlerOptions{Level: level}
	var handler slog.Handler
	if cfg.JSON {
		handler = slog.NewJSONHandler(writer, options)
	} else {
		handler = slog.NewTextHandler(writer, options)
	}

	return &Logger{
		Logger: slog.New(handler),
		closer: closer,
	}, nil
}

func NewFromConfig(c config.Config) (*Logger, error) {
	if c == nil {
		return New()
	}

	cfg := config.LoggerConfig{}
	if c.Has("logger") {
		if err := config.LoadInto(c, "logger", &cfg); err != nil {
			return nil, err
		}
	} else {
		return nil, fmt.Errorf("config: missing 'logger' section")
	}

	return NewWithConfig(cfg)
}

func (l *Logger) Close() error {
	if l == nil || l.closer == nil {
		return nil
	}
	return l.closer.Close()
}

func (l *Logger) Info(msg string, args ...any) {
	l.Logger.Info(msg, args...)
}

func (l *Logger) Debug(msg string, args ...any) {
	l.Logger.Debug(msg, args...)
}

func (l *Logger) Warn(msg string, args ...any) {
	l.Logger.Warn(msg, args...)
}

func (l *Logger) Error(msg string, args ...any) {
	l.Logger.Error(msg, args...)
}

func parseLevel(level string) (slog.Level, error) {
	switch strings.ToLower(level) {
	case "debug":
		return slog.LevelDebug, nil
	case "info":
		return slog.LevelInfo, nil
	case "warn":
		return slog.LevelWarn, nil
	case "error":
		return slog.LevelError, nil
	default:
		return slog.LevelInfo, nil
	}
}

func openSink(path string) (io.Writer, io.Closer, error) {
	switch strings.ToLower(path) {
	case "", "stdout", "std out", "standard output":
		return os.Stdout, nil, nil
	case "stderr", "std err", "standard error":
		return os.Stderr, nil, nil
	case "stdin", "std in", "standard input":
		return os.Stdout, nil, nil
	default:
		if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
			return nil, nil, err
		}
		file, err := os.OpenFile(path, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0o644)
		if err != nil {
			return nil, nil, err
		}
		return file, file, nil
	}
}

