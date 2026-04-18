package api

import (
	"encoding/json"
	"manavmsanger/chatapp/internal/domain"
	"net/http"

	"github.com/go-chi/chi/v5"
)

type DMHandler struct {
	dmRepo   domain.DMRepository
	userRepo domain.UserRepository
}

func NewDMHandler(dmRepo domain.DMRepository, userRepo domain.UserRepository) *DMHandler {
	return &DMHandler{dmRepo: dmRepo, userRepo: userRepo}
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

	history, _ := h.dmRepo.GetConversation(currentUserId, partnerId, 100)
	json.NewEncoder(w).Encode(history)
}
