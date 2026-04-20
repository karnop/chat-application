package main

import (
	"context"
	"log/slog"
	"manavmsanger/chatapp/internal/app"
	"manavmsanger/chatapp/internal/config"
	"manavmsanger/chatapp/internal/database"
	repository "manavmsanger/chatapp/internal/repository/postgres"
	"manavmsanger/chatapp/internal/service"
	"manavmsanger/chatapp/internal/websocket"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
)

func main() {
	// structured logging
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	// loading config
	cfg := config.LoadConfig()

	// init db
	pool, err := database.InitDB(cfg.DatabaseUrl)
	if err != nil {
		slog.Error("Failed to initialize database", "error", err)
		os.Exit(1)
	}
	defer pool.Close()

	// running migrations
	if err := database.RunMigrations(pool); err != nil {
		slog.Error("Failed to run migrations", "error", err)
		os.Exit(1)
	}

	// init services
	userRepo := repository.NewUserRepository(pool)
	authService := service.NewAuthService(userRepo, cfg) // cfg for jwt creds
	msgRepo := repository.NewMessageRepository(pool)
	roomRepo := repository.NewRoomRepository(pool)
	roomService := service.NewRoomService(roomRepo, userRepo)
	hub := websocket.NewHub(msgRepo, roomService)
	go hub.Run()

	chatApp := app.New(cfg, hub, authService, msgRepo, userRepo, roomService)

	// setting up routes
	mux := routes(chatApp)

	// defining the server
	server := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      mux,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  10 * time.Second,
	}

	// channels to listen to interrupt signals
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	// running server in a goroutine so it doesnt block the signal from listening
	go func() {
		slog.Info("Starting server", "port", cfg.Port)
		if err := server.ListenAndServe(); err != nil {
			slog.Error("Server failed to start", "error", err)
		}
	}()

	// waiting for interrupt signal
	<-stop
	slog.Info("Shutting down server...")

	// creating a context with timeout for graceful shutdown
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		slog.Error("Server forced to shutdown", "error", err)
	}

	slog.Info("Server exited")
}
