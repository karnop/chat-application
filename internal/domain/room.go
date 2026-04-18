package domain

import "time"

// represents a channel/room with metadata and privacy settings
type Room struct {
	Id          string    `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	IsPrivate   bool      `json:"is_private"`
	OwnerId     string    `json:"owner_id"`
	CreatedAt   time.Time `json:"created_at"`
}

type RoomRepository interface {
	// Create persists a new room and automatically adds the owner as a member
	Create(room *Room) error

	// GetAllPublic returns all rooms flagged as public
	GetAllPublic() ([]*Room, error)

	// GetJoinedRooms returns all rooms (public or private) that a user has joined
	GetJoinedRooms(userID string) ([]*Room, error)

	// GetByName finds a room by its slug/name
	GetByName(name string) (*Room, error)

	// AddMember adds a user to a room's access list
	AddMember(roomID, userID string) error

	// IsMember checks if a user has access to a specific room
	IsMember(roomID, userID string) (bool, error)
}

type RoomService interface {
	GetUserRoomList(userID string) ([]*Room, error)
	CreateRoom(name, description string, isPrivate bool, ownerID string) (*Room, error)
	CanJoinRoom(roomID, userID string) (bool, error)
	AddMemberToRoom(roomName, username, requesterID string) error
}
