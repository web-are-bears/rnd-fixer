package mongo

import (
	"regexp"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

type Query struct {
	Filter     bson.M
	Sort       bson.D // e.g. bson.D{{Key: "created_at", Value: -1}}
	Limit      int64
	Skip       int64
	Projection bson.M
}

func (q Query) findOptions() *options.FindOptionsBuilder {
	o := options.Find()
	if len(q.Sort) > 0 {
		o.SetSort(q.Sort)
	}
	if q.Limit > 0 {
		o.SetLimit(q.Limit)
	}
	if q.Skip > 0 {
		o.SetSkip(q.Skip)
	}
	if q.Projection != nil {
		o.SetProjection(q.Projection)
	}
	return o
}

type Page[T any] struct {
	Items  []T   `json:"items"`
	Total  int64 `json:"total"`
	Page   int64 `json:"page"`
	Size   int64 `json:"size"`
}

// the driver rejects a nil filter, so normalize it
func nz(f bson.M) bson.M {
	if f == nil {
		return bson.M{}
	}
	return f
}

// regex is a case-insensitive "contains" match.
func Regex(field, term string) bson.M {
	return bson.M{field: bson.M{"$regex": regexp.QuoteMeta(term), "$options": "i"}}
}

// text uses a text index (create one with ensureIndexes; one per collection).
func Text(term string) bson.M {
	return bson.M{"$text": bson.M{"$search": term}}
}

// and combines non-empty filters.
func And(filters ...bson.M) bson.M {
	out := make([]bson.M, 0, len(filters))
	for _, f := range filters {
		if len(f) > 0 {
			out = append(out, f)
		}
	}
	switch len(out) {
	case 0:
		return bson.M{}
	case 1:
		return out[0]
	}
	return bson.M{"$and": out}
}