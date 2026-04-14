package auth

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// creates a new jwt for a specific user if
func GenerateToken(secret string, userId string) (string, error) {
	claims := jwt.MapClaims{
		"user_id": userId,
		"exp":     time.Now().Add(time.Hour * 24).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}
