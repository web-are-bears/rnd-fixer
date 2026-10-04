package config

import "testing"

func TestConfigUnmarshalMapValue(t *testing.T) {
	cfg := NewConfig(map[string]interface{}{
		"server": map[string]interface{}{
			"port": 8080,
		},
	})

	var target struct {
		Port int `yaml:"port"`
	}

	if err := cfg.Unmarshal("server", &target); err != nil {
		t.Fatalf("Unmarshal returned error: %v", err)
	}

	if target.Port != 8080 {
		t.Fatalf("expected port 8080, got %d", target.Port)
	}
}
