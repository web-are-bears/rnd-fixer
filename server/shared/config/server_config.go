package config

import (
	"fmt"
)

type ServerConfig struct {
	Host string `yaml:"host"`
	Port int    `yaml:"port"`
}

func (sc *ServerConfig) Validate() error {
	if sc.Host == "" {
		sc.Host = "localhost"
	}

	if sc.Port < 0 || sc.Port > 65535 {
		return fmt.Errorf("server: port must be between 0 and 65535, got %d", sc.Port)
	}

	if sc.Port == 0 {
		return fmt.Errorf("server: port must be specified and greater than 0")
	}
	return nil
}