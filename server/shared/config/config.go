package config

import "os"

// Env returns the environment variable, or def if it's unset.
func Env(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}