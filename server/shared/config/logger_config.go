package config

import "fmt"

type LoggerConfig struct {
	Level string `yaml:"level"`
	Path  string `yaml:"path"`
	JSON  bool   `yaml:"json"`
}

func (lc *LoggerConfig) Validate() error {
	if lc.Level == "" {
		lc.Level = "info"
	}

	switch lc.Level {
	case "debug", "info", "warn", "error":
	default:
		return fmt.Errorf("logger: invalid level %q (want debug|info|warn|error)", lc.Level)
	}

	if lc.Path == "" {
		lc.Path = "stdout"
	}

	return nil
}
