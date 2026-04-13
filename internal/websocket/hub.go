package websocket

import (
	"encoding/json"
	"log/slog"
	"time"
)

// hub manages the websocket connections and the broadcast of messages to all clients
type Hub struct {
	rooms      map[string]map[*Client]bool // rooms
	history    map[string][]Message        // last 50 messages for new users
	register   chan *Client                // register request from the clients
	unregister chan *Client                // unregister request from the clients

	// special channel that recieves a message and the client who sent it
	onMessage chan messagePacket
}

type messagePacket struct {
	client *Client
	msg    Message
}

func NewHub() *Hub {
	return &Hub{
		rooms:      make(map[string]map[*Client]bool),
		history:    make(map[string][]Message),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		onMessage:  make(chan messagePacket),
	}
}

// Run is the main loop of the hub
func (h *Hub) Run() {
	slog.Info("Hub is running...")
	for {
		select {
		// case when a client wants to register
		case _ = <-h.register:
			slog.Info("Connection activated")

		// case when a client wants to unregister
		case client := <-h.unregister:
			for name, clients := range h.rooms {
				delete(clients, client)
				slog.Info("User left", "room", name)
			}
			close(client.send)

		// case when a message is received from a client
		case packet := <-h.onMessage:
			h.handleMessage(packet.client, packet.msg)
		}
	}
}

// handleMessage handles the incoming messages from clients
func (h *Hub) handleMessage(client *Client, msg Message) {
	switch msg.Type {
	case "join":
		if h.rooms[msg.Room] == nil {
			h.rooms[msg.Room] = make(map[*Client]bool)
		}
		h.rooms[msg.Room][client] = true
		slog.Info("User joined", "room", msg.Room)

		// sending history back to this client
		if hist, ok := h.history[msg.Room]; ok {
			for _, m := range hist {
				raw, _ := json.Marshal(m)
				client.send <- raw
			}
		}

	case "chat":
		h.broadcastToRoom(msg)
	}
}

// broadcastToRoom broadcasts a message to all clients in a room
func (h *Hub) broadcastToRoom(msg Message) {
	// setting timestamp
	msg.Timestamp = time.Now().UnixMilli()

	h.history[msg.Room] = append(h.history[msg.Room], msg)
	if len(h.history[msg.Room]) > 50 {
		h.history[msg.Room] = h.history[msg.Room][1:]
	}

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
