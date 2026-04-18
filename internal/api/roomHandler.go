package api

import (
	"encoding/json"
	"manavmsanger/chatapp/internal/domain"
	"net/http"
)

type roomHandler struct {
	roomService domain.RoomService
}

func NewRoomHandler(roomService domain.RoomService) *roomHandler {
	return &roomHandler{roomService: roomService}
}

func (h *roomHandler) ListRooms(w http.ResponseWriter, r *http.Request) {
	userId := GetUserIDFromContext(r.Context())

	rooms, err := h.roomService.GetUserRoomList(userId)
	if err != nil {
		http.Error(w, "Failed to list rooms", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(rooms)
}

func (h *roomHandler) CreateRoom(w http.ResponseWriter, r *http.Request) {
	userId := GetUserIDFromContext(r.Context())
	if userId == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var input struct {
		Name        string `json:"name"`
		Description string `json:"description"`
		IsPrivate   bool   `json:"is_private"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	room, err := h.roomService.CreateRoom(input.Name, input.Description, input.IsPrivate, userId)
	if err != nil {
		http.Error(w, "Failed to create room", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(room)
}

func (h *roomHandler) InviteMember(w http.ResponseWriter, r *http.Request) {
	userId := GetUserIDFromContext(r.Context())
	if userId == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	var input struct {
		RoomName string `json:"room_name"`
		Username string `json:"username"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	err := h.roomService.AddMemberToRoom(input.RoomName, input.Username, userId)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "User invited successfully"})
}
