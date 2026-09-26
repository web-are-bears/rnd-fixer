package config

import (
	"fmt"
	"maps"
	"os"
	"slices"

	yaml "gopkg.in/yaml.v3"
)

type Config interface {
	Get(key string) (Value, bool)
	Has(key string) (bool)
	Keys() []string
	Sub(key string) (Config, error)
	Unmarshal(key string, out interface{}) (error)
}

type Validatable interface {
	Validate() error
}

// map config is default Config implementation
type defaultConfig struct {
	tree map[string]interface{}
}

func newDefaultConfig(tree map[string]interface{}) *defaultConfig { 
	if tree == nil {
		return &defaultConfig{tree: map[string]interface{}{}}
	}
	return &defaultConfig{tree: tree} 
}

// constructor of config
func NewConfig(tree map[string]interface{}) Config {
	return newDefaultConfig(tree)
}

func (dc *defaultConfig) Get(key string) (Value, bool) {
	raw, exist := dc.tree[key]
	if !exist {
		return Value{}, false
	}

	return *NewValue(raw), true
}

func (dc *defaultConfig) Has(key string) (bool) {
	_, exist := dc.tree[key]
	return exist
}

func (dc *defaultConfig) Keys() []string {
	keys := slices.Collect(maps.Keys(dc.tree))
	return keys
}

func (dc *defaultConfig) Sub(key string) (Config, error) {
	return nil, nil
}

// utility functions to load config file

func LoadFile(path string) (Config, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("config: reading %s: %v", path, err)
	}
	return LoadBytes(data)
}

func LoadBytes(data []byte) (Config, error) {
	var tree map[string]interface{}
	if err := yaml.Unmarshal(data, &tree); err != nil {
		return nil, fmt.Errorf("config: parsing yaml: %v", err)
	}
	return newDefaultConfig(tree), nil
}

func (dc *defaultConfig) Unmarshal(key string, out interface{}) error {
	var raw interface{} = dc.tree
	
	if key != "" {
		v, ok := dc.Get(key)
		if !ok {
			return fmt.Errorf("config: key %q not found", key)
		}

		raw = v.raw
	}
	
	data, err := yaml.Marshal(raw)
	if err != nil {
		return fmt.Errorf("config: marshal failed: %w", err)
	}
	if err := yaml.Unmarshal(data, out); err != nil {
		return fmt.Errorf("config: unmarshal into %T: %w", out, err)
	}
	return nil
}

func LoadInto(c Config, key string, out Validatable) error {
	if err := c.Unmarshal(key, out); err != nil {
		return err
	}
	
	return out.Validate()
}

