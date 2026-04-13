package config

import "os"

type Config struct {
	Port        string
	FrontendUrl string
}

func LoadConfig() *Config {
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

	return &Config{
		Port:        port,
		FrontendUrl: frontendUrl,
	}
}
