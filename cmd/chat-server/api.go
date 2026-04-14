package main

import (
	"manavmsanger/chatapp/internal/api"
	"manavmsanger/chatapp/internal/app"
	"manavmsanger/chatapp/internal/websocket"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

// routes handles all api routing for the project
func routes(app *app.Application) http.Handler {
	// using chi for better routing.
	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins: strings.Split(app.Config.FrontendUrl, ","),
		AllowedMethods: []string{
			"GET",
			"POST",
			"PUT",
			"DELETE",
			"OPTIONS",
		},
		AllowedHeaders: []string{
			"Accept",
			"Content-Type",
			"Authorization",
			"X-CSRF-Token",
		},
		ExposedHeaders: []string{
			"Link",
		},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// health check endpoint
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Chat server is running!"))
	})

	// websocket endpoint
	r.Get("/ws", func(w http.ResponseWriter, r *http.Request) {
		websocket.ServeWs(app.Hub, w, r)
	})

	authHandler := api.NewAuthHandler(app.AuthService)
	r.Post("/api/signup", authHandler.Signup)
	r.Post("/api/login", authHandler.Login)

	return r
}
