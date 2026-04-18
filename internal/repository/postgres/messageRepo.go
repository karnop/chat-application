package repository

import (
	"context"
	"manavmsanger/chatapp/internal/domain"

	"github.com/jackc/pgx/v5/pgxpool"
)

type MessageRepository struct {
	pool *pgxpool.Pool
}

func NewMessageRepository(pool *pgxpool.Pool) *MessageRepository {
	return &MessageRepository{pool: pool}
}

func (r *MessageRepository) Save(msg *domain.Message) error {
	query := `INSERT INTO messages (room, username, content, timestamp) VALUES ($1, $2, $3, $4)`
	_, err := r.pool.Exec(context.Background(), query, msg.Room, msg.User, msg.Content, msg.Timestamp)
	return err
}

func (r *MessageRepository) GetRecentMessagesByRoom(room string, limit int) ([]*domain.Message, error) {
	query := `SELECT room, username, content, timestamp FROM messages WHERE room = $1 ORDER BY timestamp DESC LIMIT $2`
	rows, err := r.pool.Query(context.Background(), query, room, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []*domain.Message
	for rows.Next() {
		var msg domain.Message
		if err := rows.Scan(&msg.Room, &msg.User, &msg.Content, &msg.Timestamp); err != nil {
			return nil, err
		}
		messages = append(messages, &msg)
	}

	// reversing the history for chronological order
	for i, j := 0, len(messages)-1; i < j; i, j = i+1, j-1 {
		messages[i], messages[j] = messages[j], messages[i]
	}

	return messages, nil
}
