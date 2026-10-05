package config

type GatewayConfig struct {
	Address string `json:"address"`
	Port    int    `json:"port"`
}

func LoadGatewayConfig() (*GatewayConfig, error) {
	// TODO (ashu3103): Load configuration from a file or environment variables
	return &GatewayConfig{
		Address: "localhost",
		Port:    8000,
	}, nil
}