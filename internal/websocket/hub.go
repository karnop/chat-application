package websocket

import (
	"context"
	"encoding/json"
	"log/slog"
	"manavmsanger/chatapp/internal/domain"
	"time"

	"github.com/redis/go-redis/v9"
)

// hub manages the websocket connections and the broadcast of messages to all clients
type Hub struct {
	rooms       map[string]map[*Client]bool // rooms
	userClients map[string]map[*Client]bool
	msgRepo     domain.MessageRepository
	roomService domain.RoomService
	rdb         *redis.Client
	register    chan *Client // register request from the clients
	unregister  chan *Client // unregister request from the clients

	// special channel that recieves a message and the client who sent it
	onMessage chan messagePacket
}

type messagePacket struct {
	client *Client
	msg    *domain.Message
}

func NewHub(msgRepo domain.MessageRepository, roomService domain.RoomService, rdb *redis.Client) *Hub {
	return &Hub{
		rooms:       make(map[string]map[*Client]bool),
		userClients: make(map[string]map[*Client]bool),
		msgRepo:     msgRepo,
		roomService: roomService,
		rdb:         rdb,
		register:    make(chan *Client),
		unregister:  make(chan *Client),
		onMessage:   make(chan messagePacket),
	}
}

// Run is the main loop of the hub
func (h *Hub) Run() {
	slog.Info("Hub is running...")

	go h.subscribeToRedis()

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
			h.handleMessage(packet.client, packet.msg)
		}
	}
}

// handleMessage handles the incoming messages from clients
func (h *Hub) handleMessage(client *Client, msg *domain.Message) {
	switch msg.Type {
	case "join":
		canJoin, _ := h.roomService.CanJoinRoom(msg.RoomName, client.UserId)
		if !canJoin {
			slog.Warn("Unauthorized join attempt", "user", client.Username, "room", msg.RoomName)
			return
		}
		if h.rooms[msg.RoomName] == nil {
			h.rooms[msg.RoomName] = make(map[*Client]bool)
		}
		h.rooms[msg.RoomName][client] = true
		slog.Info("User joined", "room", msg.RoomName)

		// sending history back to this client
		history, _ := h.msgRepo.GetRoomHistory(msg.RoomName, 50)
		for _, m := range history {
			raw, _ := json.Marshal(m)
			client.send <- raw
		}

	case "chat":
		msg.SenderID = client.UserId
		msg.SenderName = client.Username
		h.broadcastToRoom(msg, true)

	case "dm":
		h.handleDirectMessage(client, msg)
	case "typing":
		msg.SenderName = client.Username
		if _, isRoom := h.rooms[msg.RoomName]; isRoom {
			h.broadcastToRoom(msg, false)
		} else {
			h.routeDMEvent(msg)
		}

	case "reaction":
		var re domain.Reaction
		if err := json.Unmarshal([]byte(msg.Content), &re); err == nil {
			re.UserId = client.UserId
			re.Username = client.Username
			if err := h.msgRepo.AddReaction(&re); err == nil {
				if _, isRoom := h.rooms[msg.RoomName]; isRoom {
					h.broadcastToRoom(msg, false)
				} else {
					h.routeDMEvent(msg)
				}
			}
		}

	case "remove_reaction":
		var re domain.Reaction
		if err := json.Unmarshal([]byte(msg.Content), &re); err == nil {
			re.UserId = client.UserId
			if err := h.msgRepo.RemoveReaction(&re); err == nil {
				h.broadcastToRoom(msg, false)
			}
		}
	}
}

func (h *Hub) handleDirectMessage(client *Client, msg *domain.Message) {
	msg.SenderID = client.UserId
	msg.SenderName = client.Username
	msg.RecipientID = msg.RoomName // The "Room" field in the incoming packet is the RecipientID
	msg.Timestamp = time.Now().UnixMilli()

	// Persist to unified DB
	go h.msgRepo.Save(msg)

	raw, _ := json.Marshal(msg)
	h.rdb.Publish(context.Background(), "chat_broadcast", raw)
}

func (h *Hub) routeDMEvent(msg *domain.Message) {
	raw, _ := json.Marshal(msg)
	h.rdb.Publish(context.Background(), "chat_broadcast", raw)
}

func (h *Hub) subscribeToRedis() {
	pubsub := h.rdb.Subscribe(context.Background(), "chat_broadcast")
	defer pubsub.Close()

	ch := pubsub.Channel()
	for msg := range ch {
		var chatMsg domain.Message
		if err := json.Unmarshal([]byte(msg.Payload), &chatMsg); err != nil {
			slog.Error("Failed to unmarshal redis message", "error", err)
			continue
		}

		// broadcasting locally to clients connected to this instance
		h.localBroadcast(&chatMsg)
	}
}

// localBroadcast sends a message only to clients connected to this specific server instance
func (h *Hub) localBroadcast(msg *domain.Message) {
	raw, _ := json.Marshal(msg)
	// Standard Room Broadcast
	if msg.RoomName != "" && msg.RecipientID == "" {
		for client := range h.rooms[msg.RoomName] {
			client.send <- raw
		}
		return
	}
	// Direct Message Routing
	if msg.RecipientID != "" {
		// Deliver to Recipient if they are on this instance
		if clients, ok := h.userClients[msg.RecipientID]; ok {
			for c := range clients {
				// swap the context for the recipient so it appears in their 'Sender' view
				recipientMsg := *msg
				recipientMsg.RoomName = msg.SenderID
				rRaw, _ := json.Marshal(recipientMsg)
				c.send <- rRaw
			}
		}
		// Deliver to Sender (other tabs/devices) if they are on this instance
		if clients, ok := h.userClients[msg.SenderID]; ok {
			for c := range clients {
				c.send <- raw
			}
		}
	}
}

// broadcastToRoom now publishes to Redis instead of only local broadcast
func (h *Hub) broadcastToRoom(msg *domain.Message, saveToDb bool) {
	msg.Timestamp = time.Now().UnixMilli()
	if saveToDb {
		go h.msgRepo.Save(msg)
	}
	raw, _ := json.Marshal(msg)
	h.rdb.Publish(context.Background(), "chat_broadcast", raw)
}
