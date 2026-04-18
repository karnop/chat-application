package api

import (
	"context"
	"manavmsanger/chatapp/internal/domain"
	"net/http"
	"strings"
)

type contextKey string

const UserIdKey contextKey = "userId"

func JWTMiddleware(authService domain.AuthService) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				next.ServeHTTP(w, r) // No token, continue as guest
				return
			}
			// Expecting "Bearer <token>"
			parts := strings.Split(authHeader, " ")
			if len(parts) != 2 || parts[0] != "Bearer" {
				http.Error(w, "Invalid authorization header", http.StatusUnauthorized)
				return
			}
			userID, _, err := authService.VerifyToken(parts[1])
			if err != nil {
				http.Error(w, "Invalid token", http.StatusUnauthorized)
				return
			}
			// Add UserID to context
			ctx := context.WithValue(r.Context(), UserIdKey, userID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// GetUserIDFromContext is a helper to get the ID back out in the handlers
func GetUserIDFromContext(ctx context.Context) string {
	val := ctx.Value(UserIdKey)
	if val == nil {
		return ""
	}
	id, ok := val.(string)
	if !ok {
		return ""
	}
	return id
}
