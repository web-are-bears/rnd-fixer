package config

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

func (v *Value) GetKind() Kind {
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

func (v *Value) GetInt() (int, bool) {
	switch i := v.raw.(type) {
	case int:
		return i, true
	case int64:
		return int(i), true
	default:
		return 0, false
	}
}

func (v *Value) GetString() (string, bool) {
	s, ok := v.raw.(string)
	return s, ok
}

func (v *Value) GetBool() (bool, bool) {
	b, ok := v.raw.(bool)
	return b, ok
}

func (v *Value) GetFloat() (float64, bool) {
	switch f := v.raw.(type) {
	case float64:
		return f, true
	case float32:
		return float64(f), true
	default:
		return 0, false
	}
}

func (v *Value) GetArray() ([]interface{}, bool) {
	a, ok := v.raw.([]interface{})
	return a, ok
}

func (v *Value) GetMap() (map[string]interface{}, bool) {
	m, ok := v.raw.(map[string]interface{})
	return m, ok
}
