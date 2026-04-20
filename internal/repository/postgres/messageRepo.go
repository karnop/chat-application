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

// Save persists a message (Room or DM) to the unified table
func (r *MessageRepository) Save(msg *domain.Message) error {
	var dbRoom interface{} = nil
	if msg.RoomName != "" && msg.RecipientID == "" {
		dbRoom = msg.RoomName
	}
	var dbRecipient interface{} = nil
	if msg.RecipientID != "" {
		dbRecipient = msg.RecipientID
	}
	query := `
		INSERT INTO messages (sender_id, room_name, recipient_id, content, timestamp) 
		VALUES ($1, $2, $3, $4, $5) 
		RETURNING id`
	err := r.pool.QueryRow(context.Background(), query,
		msg.SenderID, dbRoom, dbRecipient, msg.Content, msg.Timestamp).Scan(&msg.Id)

	return err
}

// GetRoomHistory fetches chronological history for a specific room
func (r *MessageRepository) GetRoomHistory(roomName string, limit int) ([]*domain.Message, error) {
	query := `
		SELECT m.id, m.sender_id, u.username, m.room_name, m.content, m.timestamp 
		FROM messages m 
		JOIN users u ON m.sender_id = u.id 
		WHERE m.room_name = $1 
		ORDER BY m.timestamp DESC LIMIT $2`

	return r.fetchMessages(query, roomName, limit)
}

// GetDMHistory fetches chronological history between two users
func (r *MessageRepository) GetDMHistory(user1, user2 string, limit int) ([]*domain.Message, error) {
	query := `
		SELECT m.id, m.sender_id, u.username, m.recipient_id, m.content, m.timestamp 
		FROM messages m 
		JOIN users u ON m.sender_id = u.id 
		WHERE (m.sender_id = $1 AND m.recipient_id = $2) 
		   OR (m.sender_id = $2 AND m.recipient_id = $1) 
		ORDER BY m.timestamp DESC LIMIT $3`

	return r.fetchMessages(query, user1, user2, limit)
}

// GetRecentDMPartners finds IDs of users the given user has recently chatted with
func (r *MessageRepository) GetRecentDMPartners(userID string) ([]string, error) {
	query := `
		SELECT DISTINCT CASE WHEN sender_id = $1 THEN recipient_id ELSE sender_id END as partner_id
		FROM messages
		WHERE (sender_id = $1 OR recipient_id = $1) AND recipient_id IS NOT NULL
		ORDER BY partner_id ASC`

	rows, err := r.pool.Query(context.Background(), query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var partners []string
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		partners = append(partners, id)
	}
	return partners, nil
}

// Helper to handle common message fetching logic (Scans + Reactions)
func (r *MessageRepository) fetchMessages(query string, args ...interface{}) ([]*domain.Message, error) {
	rows, err := r.pool.Query(context.Background(), query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []*domain.Message
	for rows.Next() {
		m := &domain.Message{}
		var room *string
		if err := rows.Scan(&m.Id, &m.SenderID, &m.SenderName, &room, &m.Content, &m.Timestamp); err != nil {
			return nil, err
		}
		if room != nil {
			m.RoomName = *room
		}
		// Note: The RecipientID scan is handled by checking query params in the callers or can be added to scan if needed
		messages = append(messages, m)
	}

	// Fetch reactions for every message
	for _, m := range messages {
		reactions, _ := r.GetReactionsForMessage(m.Id)
		m.Reactions = reactions
	}

	// Reverse to chronological order (DB returns newest first)
	for i, j := 0, len(messages)-1; i < j; i, j = i+1, j-1 {
		messages[i], messages[j] = messages[j], messages[i]
	}

	return messages, nil
}

func (r *MessageRepository) AddReaction(re *domain.Reaction) error {
	query := `
		INSERT INTO message_reactions (message_id, user_id, emoji) 
		VALUES ($1, $2, $3) 
		ON CONFLICT ON CONSTRAINT message_reactions_message_id_user_id_emoji_key DO NOTHING`
	_, err := r.pool.Exec(context.Background(), query, re.MessageId, re.UserId, re.Emoji)
	return err
}

func (r *MessageRepository) RemoveReaction(re *domain.Reaction) error {
	query := `DELETE FROM message_reactions WHERE message_id = $1 AND user_id = $2 AND emoji = $3`
	_, err := r.pool.Exec(context.Background(), query, re.MessageId, re.UserId, re.Emoji)
	return err
}

func (r *MessageRepository) GetReactionsForMessage(messageId string) ([]*domain.Reaction, error) {
	query := `
		SELECT r.message_id, r.user_id, u.username, r.emoji 
		FROM message_reactions r 
		JOIN users u ON r.user_id = u.id 
		WHERE r.message_id = $1`

	rows, err := r.pool.Query(context.Background(), query, messageId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var reactions []*domain.Reaction
	for rows.Next() {
		re := &domain.Reaction{}
		if err := rows.Scan(&re.MessageId, &re.UserId, &re.Username, &re.Emoji); err != nil {
			return nil, err
		}
		reactions = append(reactions, re)
	}
	return reactions, nil
}
