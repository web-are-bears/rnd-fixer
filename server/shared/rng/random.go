package rng

import "uuid"

func GenerateUUID() string {
	id := uuid.New()
	return id.String()
}