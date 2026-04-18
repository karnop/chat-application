package service

import (
	"errors"
	"manavmsanger/chatapp/internal/domain"
)

type RoomService struct {
	repo     domain.RoomRepository
	userRepo domain.UserRepository
}

func NewRoomService(repo domain.RoomRepository, userRepo domain.UserRepository) *RoomService {
	return &RoomService{repo: repo, userRepo: userRepo}
}

// CreateRoom handles the business logic of starting a new channel
func (s *RoomService) CreateRoom(name, description string, isPrivate bool, ownerID string) (*domain.Room, error) {
	room := &domain.Room{
		Name:        name,
		Description: description,
		IsPrivate:   isPrivate,
		OwnerId:     ownerID,
	}

	if err := s.repo.Create(room); err != nil {
		return nil, err
	}

	return room, nil
}

// GetUserRoomList returns all public rooms plus private rooms the user belongs to
func (s *RoomService) GetUserRoomList(userID string) ([]*domain.Room, error) {
	// 1. Get all public rooms
	publicRooms, err := s.repo.GetAllPublic()
	if err != nil {
		return nil, err
	}

	// 2. If user is guest (no ID), just return public rooms
	if userID == "" || userID == "guest-id" {
		return publicRooms, nil
	}

	// 3. Get private rooms the user has joined
	joinedRooms, err := s.repo.GetJoinedRooms(userID)
	if err != nil {
		return nil, err
	}

	// 4. Merge them (using a map to avoid duplicates if a user joined a public room)
	roomMap := make(map[string]*domain.Room)
	for _, r := range publicRooms {
		roomMap[r.Id] = r
	}
	for _, r := range joinedRooms {
		roomMap[r.Id] = r
	}

	var allRooms []*domain.Room
	for _, r := range roomMap {
		allRooms = append(allRooms, r)
	}

	return allRooms, nil
}

func (s *RoomService) CanJoinRoom(roomName, userID string) (bool, error) {
	room, err := s.repo.GetByName(roomName)
	if err != nil {
		return false, err
	}

	// If public, anyone can join
	if !room.IsPrivate {
		return true, nil
	}

	// If private, check membership
	return s.repo.IsMember(room.Id, userID)
}

func (s *RoomService) AddMemberToRoom(roomName, username, requesterID string) error {
	// 1. Find the room
	room, err := s.repo.GetByName(roomName)
	if err != nil {
		return errors.New("room not found")
	}
	// 2. 🛡️ Check Ownership
	if room.OwnerId != requesterID {
		return errors.New("only the channel owner can invite members")
	}
	// 3. Find the lucky user being invited
	targetUser, err := s.userRepo.GetByUsername(username)
	if err != nil {
		return errors.New("user not found")
	}
	// 4. Record the membership
	return s.repo.AddMember(room.Id, targetUser.ID)
}
