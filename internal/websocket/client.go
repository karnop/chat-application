package websocket

import (
	"encoding/json"
	"log/slog"
	"manavmsanger/chatapp/internal/domain"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
	"golang.org/x/time/rate"
)

const (
	writeWait      = 10 * time.Second      // max time allowed to send a message
	pongWait       = 60 * time.Second      // max time allowed to receive a pong after a ping
	pingPeriod     = (pongWait * 60) / 100 // send ping every pingPeriod
	maxMessageSize = 512                   // max size of a message
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024, // buffer size for reading messages
	WriteBufferSize: 1024, // buffer size for writing messages

	// imp for security, for now we are allowing everything
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

// client is the middleman between the websocket connection and the hub
type Client struct {
	hub  *Hub            // pointer to the hub
	conn *websocket.Conn // the actual websocket connection
	send chan []byte     // buffered channel of outbound messages

	UserId   string
	Username string
	IsGuest  bool
	limiter  *rate.Limiter // rate limiting to prevent spam
}

// readPump : Wait for the browser to send data, and pass it to the Hub.
func (c *Client) readPump() {
	// defer is used to ensure that the connection is closed and the client is unregistered from the hub when the function returns
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()

	// setting the read limit to maxMessageSize
	c.conn.SetReadLimit(maxMessageSize)

	// setting the read and write deadlines
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	// infinite loop to read messages from the websocket connection
	for {
		_, raw, err := c.conn.ReadMessage()
		if err != nil {
			break
		}

		// rate limiting
		if !c.limiter.Allow() {
			slog.Warn("Rate limit exceeded", "user", c.Username)
			errMsg := domain.Message{
				Type:       "error",
				Content:    "Slow down! You're sending messages too fast.",
				SenderName: "System",
				Timestamp:  time.Now().UnixMilli(),
			}
			if raw, err := json.Marshal(errMsg); err == nil {
				c.send <- raw
			}
			continue
		}

		var msg domain.Message
		if err := json.Unmarshal(raw, &msg); err != nil {
			slog.Error("JSON error", "error", err)
			continue
		}

		// guest user vs authenticated
		if c.IsGuest && msg.Type == "chat" {
			slog.Warn("Guest tried to send a message", "user", c.Username)
			continue
		}

		// setting the username of the message
		msg.SenderName = c.Username

		// sending the message to the hub
		c.hub.onMessage <- messagePacket{client: c, msg: &msg}
	}
}

// writePump : Deliver messages from the Hub to browser and Send "Heartbeats" (Pings) to keep the connection alive.
func (c *Client) writePump() {
	// creating a ticker to send pings at regular intervals
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	// infinite loop to write messages from the hub to the websocket connection
	for {
		select {
		// case when a message is received from the hub
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				// if the channel is closed, close the websocket connection
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			// getting the next writer for the websocket connection
			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)
			if err := w.Close(); err != nil {
				return
			}

		// case when the ticker sends a ping
		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// ServeWs handles the websocket requests from the peer
func ServeWs(hub *Hub, authService domain.AuthService, w http.ResponseWriter, r *http.Request) {
	// extracting token from URL
	token := r.URL.Query().Get("token")
	var userId, username string
	var isGuest bool
	if token == "" {
		// guest user
		isGuest = true
		userId = "guest-id"
		username = "guest"

	} else {
		// authenticated user
		var err error
		userId, username, err = authService.VerifyToken(token)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		isGuest = false
	}

	// upgrading the http connection to a websocket connection
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		slog.Error("upgrade error", "error", err)
		return
	}

	// creating a new client
	client := &Client{
		hub:      hub,
		conn:     conn,
		send:     make(chan []byte, 256),
		UserId:   userId,
		Username: username,
		IsGuest:  isGuest,
		limiter:  rate.NewLimiter(rate.Limit(3), 5),
	}

	// registering the client with the hub
	client.hub.register <- client

	// starting the read and write pumps
	go client.writePump()
	go client.readPump()
}
