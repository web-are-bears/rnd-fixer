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
type DefaultConfig struct {
	tree map[string]*Value
}

func newDefaultConfig(tree map[string]interface{}) *DefaultConfig {
	if tree == nil {
		return &DefaultConfig{tree: map[string]*Value{}}
	}

	var treeWithPointers = make(map[string]*Value)
	for k, v := range tree {
		treeWithPointers[k] = NewValue(v)
	}

	return &DefaultConfig{tree: treeWithPointers}
}

// constructor of config
func NewConfig(tree map[string]interface{}) Config {
	return newDefaultConfig(tree)
}

func (dc *DefaultConfig) Get(key string) (Value, bool) {
	raw, exist := dc.tree[key]
	if !exist {
		return Value{}, false
	}

	return *NewValue(raw), true
}

func (dc *DefaultConfig) Has(key string) (bool) {
	_, exist := dc.tree[key]
	return exist
}

func (dc *DefaultConfig) Keys() []string {
	keys := slices.Collect(maps.Keys(dc.tree))
	return keys
}

func (dc *DefaultConfig) Sub(key string) (Config, error) {
	v, exists := dc.Get(key)
	if !exists {
		return nil, fmt.Errorf("config: key %q not found", key)
	}
	if v.GetKind() != KindMap {
		return nil, fmt.Errorf("config: key %q is not a map", key)
	}

	subTree, ok := v.GetMap()
	if !ok {
		return nil, fmt.Errorf("config: key %q is not a map", key)
	}

	return newDefaultConfig(subTree), nil
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

func (dc *DefaultConfig) Unmarshal(key string, out interface{}) error {
	var raw interface{}
	
	if key != "" {
		v, ok := dc.Get(key)
		if !ok {
			return fmt.Errorf("config: key %q not found", key)
		}

		raw = v.GetRaw()
	} else {
		return fmt.Errorf("config: key is empty")
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

