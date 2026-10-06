package config

type AuthConfig struct {
	Port int `json:"port"`
}

func LoadAuthConfig() (*AuthConfig, error) {
	return &AuthConfig{
		Port: 9001,
	}, nil
}