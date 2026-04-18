package repository

import (
	"context"
	"manavmsanger/chatapp/internal/domain"

	"github.com/jackc/pgx/v5/pgxpool"
)

type DMRepository struct {
	pool *pgxpool.Pool
}

func NewDMRepository(pool *pgxpool.Pool) *DMRepository {
	return &DMRepository{pool: pool}
}

func (r *DMRepository) Save(dm *domain.DMMessage) error {
	query := `INSERT INTO direct_messages (sender_id, recipient_id, content, timestamp) 
              VALUES ($1, $2, $3, $4) RETURNING id`

	return r.pool.QueryRow(context.Background(), query,
		dm.SenderID, dm.RecipientID, dm.Content, dm.Timestamp).Scan(&dm.ID)
}

func (r *DMRepository) GetConversation(user1, user2 string, limit int) ([]*domain.DMMessage, error) {
	query := `
		SELECT dm.id, dm.sender_id, u.username, dm.recipient_id, dm.content, dm.timestamp 
		FROM direct_messages dm
		JOIN users u ON dm.sender_id = u.id
		WHERE (dm.sender_id = $1 AND dm.recipient_id = $2) 
		   OR (dm.sender_id = $2 AND dm.recipient_id = $1)
		ORDER BY dm.timestamp DESC 
		LIMIT $3`

	rows, err := r.pool.Query(context.Background(), query, user1, user2, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var dms []*domain.DMMessage
	for rows.Next() {
		var dm domain.DMMessage
		if err := rows.Scan(&dm.ID, &dm.SenderID, &dm.SenderName, &dm.RecipientID, &dm.Content, &dm.Timestamp); err != nil {
			return nil, err
		}
		dms = append(dms, &dm)
	}
	return dms, nil
}

func (r *DMRepository) GetRecentParticipants(userID string) ([]string, error) {
	query := `
		SELECT DISTINCT partner_id FROM (
			SELECT recipient_id as partner_id, timestamp FROM direct_messages WHERE sender_id = $1
			UNION
			SELECT sender_id as partner_id, timestamp FROM direct_messages WHERE recipient_id = $1
		) as conversations
		ORDER BY timestamp DESC LIMIT 20`

	rows, err := r.pool.Query(context.Background(), query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var ids []string
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}
	return ids, nil
}
