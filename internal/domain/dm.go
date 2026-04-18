package domain

// DMMessage represents a 1-to-1 message between two users
type DMMessage struct {
	ID          string `json:"id"`
	SenderID    string `json:"sender_id"`
	SenderName  string `json:"user"`
	RecipientID string `json:"recipient_id"`
	Content     string `json:"content"`
	Timestamp   int64  `json:"timestamp"`
}

// DMRepository handles persistence for direct messages
type DMRepository interface {
	Save(dm *DMMessage) error
	GetConversation(user1, user2 string, limit int) ([]*DMMessage, error)
	GetRecentParticipants(userID string) ([]string, error) // Found who you've talked to
}
