package app

import (
	"manavmsanger/chatapp/internal/config"
	"manavmsanger/chatapp/internal/domain"
	"manavmsanger/chatapp/internal/websocket"
)

// container for all services and dependencies
type Application struct {
	Config      *config.Config
	Hub         *websocket.Hub
	AuthService domain.AuthService
	MsgRepo     domain.MessageRepository
	UserRepo    domain.UserRepository
	RoomService domain.RoomService
}

func New(cfg *config.Config, hub *websocket.Hub, auth domain.AuthService, msgRepo domain.MessageRepository, userRepo domain.UserRepository, roomService domain.RoomService) *Application {
	return &Application{
		Config:      cfg,
		Hub:         hub,
		AuthService: auth,
		MsgRepo:     msgRepo,
		UserRepo:    userRepo,
		RoomService: roomService,
	}
}
