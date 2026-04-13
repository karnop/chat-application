package websocket

type Message struct {
	Type      string `json:"type"`      // "chat", "join", "leave", "create"
	Room      string `json:"room"`      // target room name
	User      string `json:"user"`      // sender's name
	Content   string `json:"content"`   // message text
	Timestamp int64  `json:"timestamp"` // message timestamp
}
