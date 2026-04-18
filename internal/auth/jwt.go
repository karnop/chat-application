package auth

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// creates a new jwt for a specific user if
func GenerateToken(secret string, userId, username string) (string, error) {
	claims := jwt.MapClaims{
		"user_id":  userId,
		"username": username,
		"exp":      time.Now().Add(time.Hour * 24).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

// verifies token and returns user id and user name
func ParseToken(tokenString, secret string) (string, string, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		return []byte(secret), nil
	})

	if err != nil || !token.Valid {
		return "", "", errors.New("invalid token")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return "", "", errors.New("invalid token claims")
	}

	return claims["user_id"].(string), claims["username"].(string), nil
}
