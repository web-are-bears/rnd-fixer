package server

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewServerFromFile(t *testing.T) {
	t.Run("valid config file", func(t *testing.T) {
		srv, err := NewServerFromFile("/home/ashu3103/Desktop/rnd-fixer/server/config/develop.yaml")
		require.NoError(t, err)
		require.NotNil(t, srv)
		assert.Equal(t, "localhost", srv.GetConfig().Host)
		assert.Equal(t, 8080, srv.GetConfig().Port)
	})

	t.Run("invalid config file", func(t *testing.T) {
		srv, err := NewServerFromFile("../config/invalid.yaml")
		require.Error(t, err)
		assert.Nil(t, srv)
	})
}