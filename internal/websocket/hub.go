package websocket

import (
	"encoding/json"
	"log/slog"
	"manavmsanger/chatapp/internal/domain"
	"time"
)

// hub manages the websocket connections and the broadcast of messages to all clients
type Hub struct {
	rooms       map[string]map[*Client]bool // rooms
	userClients map[string]map[*Client]bool
	msgRepo     domain.MessageRepository
	dmRepo      domain.DMRepository
	roomService domain.RoomService
	register    chan *Client // register request from the clients
	unregister  chan *Client // unregister request from the clients

	// special channel that recieves a message and the client who sent it
	onMessage chan messagePacket
}

type messagePacket struct {
	client *Client
	msg    *domain.Message
}

func NewHub(msgRepo domain.MessageRepository, dmRepo domain.DMRepository, roomService domain.RoomService) *Hub {
	return &Hub{
		rooms:       make(map[string]map[*Client]bool),
		userClients: make(map[string]map[*Client]bool),
		msgRepo:     msgRepo,
		dmRepo:      dmRepo,
		roomService: roomService,
		register:    make(chan *Client),
		unregister:  make(chan *Client),
		onMessage:   make(chan messagePacket),
	}
}

// Run is the main loop of the hub
func (h *Hub) Run() {
	slog.Info("Hub is running...")
	for {
		select {
		// case when a client wants to register
		case client := <-h.register:
			// registering user connection
			if h.userClients[client.UserId] == nil {
				h.userClients[client.UserId] = make(map[*Client]bool)
			}
			h.userClients[client.UserId][client] = true
			slog.Info("Connection activated", "user_id", client.UserId)

		// case when a client wants to unregister
		case client := <-h.unregister:
			if clients, ok := h.userClients[client.UserId]; ok {
				delete(clients, client)
				if len(clients) == 0 {
					delete(h.userClients, client.UserId)
				}
			}
			for _, clients := range h.rooms {
				delete(clients, client)
			}
			close(client.send)

		// case when a message is received from a client
		case packet := <-h.onMessage:
			h.handleMessage(packet.client, *packet.msg)
		}
	}
}

// handleMessage handles the incoming messages from clients
func (h *Hub) handleMessage(client *Client, msg domain.Message) {
	switch msg.Type {
	case "join":
		canJoin, _ := h.roomService.CanJoinRoom(msg.Room, client.UserId)
		if !canJoin {
			slog.Warn("Unauthorized join attempt", "user", client.Username, "room", msg.Room)
			return
		}
		if h.rooms[msg.Room] == nil {
			h.rooms[msg.Room] = make(map[*Client]bool)
		}
		h.rooms[msg.Room][client] = true
		slog.Info("User joined", "room", msg.Room)

		// sending history back to this client
		history, _ := h.msgRepo.GetRecentMessagesByRoom(msg.Room, 50)
		for _, m := range history {
			raw, _ := json.Marshal(m)
			client.send <- raw
		}

	case "chat":
		h.broadcastToRoom(msg)

	case "dm":
		h.handleDirectMessage(client, msg)
	}

}

func (h *Hub) handleDirectMessage(client *Client, msg domain.Message) {
	// Force sender's username into the message object
	msg.User = client.Username

	// Prepare DM entity for DB
	dm := &domain.DMMessage{
		SenderID:    client.UserId,
		RecipientID: msg.Room,
		Content:     msg.Content,
		Timestamp:   time.Now().UnixMilli(),
	}
	// Persist to DB
	go h.dmRepo.Save(dm)

	// Route to Recipient AND Sender (multiple tabs support)
	senderMsg, _ := json.Marshal(msg)

	recipientMsg := msg
	recipientMsg.Room = client.UserId      // Room = Sender's ID for the recipient
	recipientMsg.User = client.Username // Sender's Name
	rawRecipientMsg, _ := json.Marshal(recipientMsg)

	// Deliver to Recipient
	if clients, ok := h.userClients[dm.RecipientID]; ok {
		for c := range clients {
			c.send <- rawRecipientMsg
		}
	}

	// Deliver to Sender (other tabs/devices)
	if clients, ok := h.userClients[dm.SenderID]; ok {
		for c := range clients {
			if c != client {
				c.send <- senderMsg
			}
		}
	}
}

// broadcastToRoom broadcasts a message to all clients in a room
func (h *Hub) broadcastToRoom(msg domain.Message) {
	// setting timestamp
	msg.Timestamp = time.Now().UnixMilli()

	// saving to db
	go h.msgRepo.Save(&msg)

	raw, _ := json.Marshal(msg)
	for client := range h.rooms[msg.Room] {
		select {
		case client.send <- raw:
		default:
			close(client.send)
			delete(h.rooms[msg.Room], client)
		}
	}
}
