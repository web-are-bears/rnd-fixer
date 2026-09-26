package logger

import (
	"log/slog"
	"io"
)

type Logger struct {
	sink io.Writer
	logger slog.Logger
}

