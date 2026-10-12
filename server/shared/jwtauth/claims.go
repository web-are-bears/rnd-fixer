package jwtauth

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type Config struct {
	Issuer string
	Audience string
	TTL time.Duration
}

type Claims struct {
	Username string `json:username`
	Role string `json:role`
	jwt.RegisteredClaims
}