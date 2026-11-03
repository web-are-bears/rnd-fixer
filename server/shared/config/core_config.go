package config

type CoreConfig struct {
	Port int `json:"port"`
}

func LoadCoreConfig() (*CoreConfig, error) {
	return &CoreConfig{
		Port: 9002,
	}, nil
}