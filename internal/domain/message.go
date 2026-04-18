package domain

// represents a single chat message in the system
type Message struct {
	Type      string `json:"type"`
	Room      string `json:"room"`
	User      string `json:"user"`
	Content   string `json:"content"`
	Timestamp int64  `json:"timestamp"`
}

type MessageRepository interface {
	Save(msg *Message) error
	GetRecentMessagesByRoom(room string, limit int) ([]*Message, error)
}
