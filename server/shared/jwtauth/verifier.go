package jwtauth

import (
	"crypto/ed25519"
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var ErrInvalidToken = errors.New("invalid token")

type Verifier struct {
	keys   map[string]ed25519.PublicKey // kid -> key
	parser *jwt.Parser
}

// Pass several public keys to accept tokens signed by old and new keys during rotation.
func NewVerifier(cfg Config, pubs ...ed25519.PublicKey) *Verifier {
	keys := make(map[string]ed25519.PublicKey, len(pubs))
	for _, p := range pubs {
		keys[KeyID(p)] = p
	}
	return &Verifier{
		keys: keys,
		parser: jwt.NewParser(
			jwt.WithValidMethods([]string{"EdDSA"}), // reject any other alg, including "none"
			jwt.WithIssuer(cfg.Issuer),
			jwt.WithAudience(cfg.Audience),
			jwt.WithExpirationRequired(),
			jwt.WithLeeway(5*time.Second), // clock skew between machines
		),
	}
}

func (v *Verifier) Verify(raw string) (*Claims, error) {
	claims := &Claims{}
	_, err := v.parser.ParseWithClaims(raw, claims, func(t *jwt.Token) (any, error) {
		kid, _ := t.Header["kid"].(string)
		key, ok := v.keys[kid]
		if !ok {
			return nil, errors.New("unknown key id")
		}
		return key, nil
	})
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrInvalidToken, err)
	}
	if claims.Subject == "" {
		return nil, fmt.Errorf("%w: missing subject", ErrInvalidToken)
	}
	return claims, nil
}