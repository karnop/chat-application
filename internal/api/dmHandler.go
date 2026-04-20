package api

import (
	"encoding/json"
	"manavmsanger/chatapp/internal/domain"
	"net/http"

	"github.com/go-chi/chi/v5"
)

type DMHandler struct {
	msgRepo  domain.MessageRepository
	userRepo domain.UserRepository
}

func NewDMHandler(msgRepo domain.MessageRepository, userRepo domain.UserRepository) *DMHandler {
	return &DMHandler{msgRepo: msgRepo, userRepo: userRepo}
}

// ListUsers returns all users you can start a DM with
func (h *DMHandler) ListUsers(w http.ResponseWriter, r *http.Request) {
	userId := GetUserIDFromContext(r.Context())
	users, _ := h.userRepo.GetAll(userId)
	json.NewEncoder(w).Encode(users)
}

// GetHistory returns conversation history between current user and another
func (h *DMHandler) GetHistory(w http.ResponseWriter, r *http.Request) {
	currentUserId := GetUserIDFromContext(r.Context())
	partnerId := chi.URLParam(r, "userId")

	history, _ := h.msgRepo.GetDMHistory(currentUserId, partnerId, 100)
	json.NewEncoder(w).Encode(history)
}
