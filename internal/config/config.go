package config

import (
	"log"
	"log/slog"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port        string
	FrontendUrl string
	DatabaseUrl string
	JWTSecret   string
	RedisUrl    string
}

func LoadConfig() *Config {
	// loading env variables
	err := godotenv.Load()
	if err != nil {
		slog.Warn("No .env file found")
	}

	// port to run web server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// frontend url to allow cors
	frontendUrl := os.Getenv("FRONTEND_URL")
	if frontendUrl == "" {
		frontendUrl = "http://localhost:5173,http://127.0.0.1:5173"
	}

	// JWT secret
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		log.Fatal("JWT_SECRET is not set")
	}

	// database url
	databaseUrl := os.Getenv("DATABASE_URL")
	if databaseUrl == "" {
		log.Fatal("DATABASE_URL is not set")
	}

	// redis url
	redisUrl := os.Getenv("REDIS_URL")
	if redisUrl == "" {
		redisUrl = "localhost:6379"
	}

	return &Config{
		Port:        port,
		FrontendUrl: frontendUrl,
		DatabaseUrl: databaseUrl,
		JWTSecret:   jwtSecret,
		RedisUrl:    redisUrl,
	}

}
