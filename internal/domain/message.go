package domain

// Message represents a single chat message in the system (Rooms or DMs)
type Message struct {
	Id          string      `json:"id"`
	Type        string      `json:"type"` // "chat", "dm", "typing", "reaction", etc.
	SenderID    string      `json:"sender_id"`
	SenderName  string      `json:"user"`               // for UI display
	RoomName    string      `json:"room,omitempty"`      // NULL for DMs
	RecipientID string      `json:"recipient_id,omitempty"` // NULL for Rooms
	Content     string      `json:"content"`
	Timestamp   int64       `json:"timestamp"`
	Reactions   []*Reaction `json:"reactions,omitempty"`
}

type Reaction struct {
	MessageId string `json:"message_id"`
	UserId    string `json:"user_id"`
	Username  string `json:"username"`
	Emoji     string `json:"emoji"`
}

type MessageRepository interface {
	Save(msg *Message) error
	GetRoomHistory(roomName string, limit int) ([]*Message, error)
	GetDMHistory(user1, user2 string, limit int) ([]*Message, error)
	GetRecentDMPartners(userID string) ([]string, error)
	AddReaction(reaction *Reaction) error
	RemoveReaction(reaction *Reaction) error
	GetReactionsForMessage(messageId string) ([]*Reaction, error)
}
