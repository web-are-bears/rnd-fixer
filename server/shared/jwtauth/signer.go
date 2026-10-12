package jwtauth

import (
	"crypto/ed25519"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type Signer struct {
	key ed25519.PrivateKey
	kid string
	cfg Config
}

func NewSigner(key ed25519.PrivateKey, cfg Config) *Signer {
	pub := key.Public().(ed25519.PublicKey)
	return &Signer{key: key, kid: KeyID(pub), cfg: cfg}
}

// Issue returns the signed token and its lifetime in seconds.
func (s *Signer) Issue(userID string, role string) (string, int32, error) {
	now := time.Now()
	claims := Claims{
		Role: role,
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    s.cfg.Issuer,
			Audience:  jwt.ClaimStrings{s.cfg.Audience},
			Subject:   userID,
			IssuedAt:  jwt.NewNumericDate(now),
			NotBefore: jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(s.cfg.TTL)),
			ID:        uuid.NewString(), // jti, useful later for revocation
		},
	}
	tok := jwt.NewWithClaims(jwt.SigningMethodEdDSA, claims)
	tok.Header["kid"] = s.kid // lets verifiers pick the right key during rotation

	signed, err := tok.SignedString(s.key)
	if err != nil {
		return "", 0, err
	}
	return signed, int32(s.cfg.TTL.Seconds()), nil
}