package repository

import (
	"context"
	"manavmsanger/chatapp/internal/domain"

	"github.com/jackc/pgx/v5/pgxpool"
)

type RoomRepository struct {
	pool *pgxpool.Pool
}

func NewRoomRepository(pool *pgxpool.Pool) *RoomRepository {
	return &RoomRepository{pool: pool}
}

// Create persists a new room and automatically adds the owner as a member
func (r *RoomRepository) Create(room *domain.Room) error {
	ctx := context.Background()
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// Create the room
	query := `
		INSERT INTO rooms (name, description, is_private, owner_id) 
		VALUES ($1, $2, $3, $4) 
		RETURNING id, created_at
	`
	err = tx.QueryRow(ctx, query, room.Name, room.Description, room.IsPrivate, room.OwnerId).
		Scan(&room.Id, &room.CreatedAt)
	if err != nil {
		return err
	}

	// Automatically add owner as the first member
	memberQuery := `INSERT INTO room_members (room_id, user_id) VALUES ($1, $2)`
	_, err = tx.Exec(ctx, memberQuery, room.Id, room.OwnerId)
	if err != nil {
		return err
	}
	return tx.Commit(ctx)
}

// GetAllPublic returns all rooms flagged as public
func (r *RoomRepository) GetAllPublic() ([]*domain.Room, error) {
	query := `SELECT id, name, description, is_private, owner_id, created_at FROM rooms WHERE is_private = false ORDER BY name ASC`
	rows, err := r.pool.Query(context.Background(), query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var rooms []*domain.Room
	for rows.Next() {
		var room domain.Room
		if err := rows.Scan(&room.Id, &room.Name, &room.Description, &room.IsPrivate, &room.OwnerId, &room.CreatedAt); err != nil {
			return nil, err
		}
		rooms = append(rooms, &room)
	}
	return rooms, nil
}

// GetJoinedRooms returns all rooms (public or private) that a user has joined
func (r *RoomRepository) GetJoinedRooms(userID string) ([]*domain.Room, error) {
	query := `
		SELECT r.id, r.name, r.description, r.is_private, r.owner_id, r.created_at 
		FROM rooms r
		JOIN room_members rm ON r.id = rm.room_id
		WHERE rm.user_id = $1
		ORDER BY r.name ASC
	`
	rows, err := r.pool.Query(context.Background(), query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var rooms []*domain.Room
	for rows.Next() {
		var room domain.Room
		if err := rows.Scan(&room.Id, &room.Name, &room.Description, &room.IsPrivate, &room.OwnerId, &room.CreatedAt); err != nil {
			return nil, err
		}
		rooms = append(rooms, &room)
	}
	return rooms, nil
}

// GetByName finds a room by its slug/name
func (r *RoomRepository) GetByName(name string) (*domain.Room, error) {
	query := `SELECT id, name, description, is_private, owner_id, created_at FROM rooms WHERE name = $1`
	var room domain.Room
	err := r.pool.QueryRow(context.Background(), query, name).
		Scan(&room.Id, &room.Name, &room.Description, &room.IsPrivate, &room.OwnerId, &room.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &room, nil
}

// AddMember adds a user to a room's access list
func (r *RoomRepository) AddMember(roomID, userID string) error {
	query := `INSERT INTO room_members (room_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`
	_, err := r.pool.Exec(context.Background(), query, roomID, userID)
	return err
}

// IsMember checks if a user has access to a specific room
func (r *RoomRepository) IsMember(roomID, userID string) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM room_members WHERE room_id = $1 AND user_id = $2)`
	var exists bool
	err := r.pool.QueryRow(context.Background(), query, roomID, userID).Scan(&exists)
	return exists, err
}
