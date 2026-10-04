package server

import (
	"fmt"
	config "github.com/wbb/rnd-fixer/shared/config"
)

type Server struct {
	config *config.ServerConfig
}

func NewServerFromFile(file string) (*Server, error) {
	c, err := config.LoadFile(file)
	if err != nil {
		return nil, err
	}

	cfg := config.ServerConfig{}
	fmt.Printf("Server config: %+v\n", cfg)
	if err := config.LoadInto(c, "server", &cfg); err != nil {
		return nil, err
	}

	return &Server{config: &cfg}, nil
}

func (s *Server) GetConfig() *config.ServerConfig {
	return s.config
}

func NewServer(config *config.ServerConfig) *Server {
	return &Server{config: config}
}

func (s *Server) Start() error {
	// start the server
	return nil
}