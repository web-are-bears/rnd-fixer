package config

import (
	"fmt"
	"strconv"
)

type Kind int

const (
	KindInvalid Kind = iota
	KindNull
	KindString
	KindFloat
	KindInt
	KindBool
	KindArray
	KindMap
)

func (k Kind) String() string {
	switch k {
	case KindNull:
		return "null"
	case KindBool:
		return "bool"
	case KindFloat:
		return "float"
	case KindString:
		return "string"
	case KindInt:
		return "int"
	case KindArray:
		return "array"
	case KindMap:
		return "map"
	default:
		return "invalid"
	}
}

// it denotes each node of the parsed config tree
type Value struct {
	raw interface{}
}

// Constructor of Value
func NewValue(raw interface{}) *Value { return &Value{raw: raw} }

func (v *Value) GetRaw() interface{} {
	return v.raw
}

func (v Value) GetKind() Kind {
	switch v.raw.(type) {
	case nil:
		return KindNull
	case string:
		return KindString
	case int, int64:
		return KindInt
	case float64, float32:
		return KindFloat
	case bool:
		return KindBool
	case []interface{}:
		return KindArray
	case map[string]interface{}:
		return KindMap
	default:
		return KindInvalid
	}
}


