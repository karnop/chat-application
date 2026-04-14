# Go Project Layout for a Chat App

When building a Go application, especially one that will grow in complexity like a WebSocket chat app, it's best to follow the **Standard Go Project Layout**. This structure separates your code into distinct layers, making it easier to maintain, test, and understand over time.

Here is a typical directory structure for our chat app:

```text
chatapp/
├── cmd/
│   └── chat-server/
│       └── main.go         # The entry point of the application
├── internal/
│   ├── database/           # Database connections and queries
│   │   ├── db.go
│   │   └── models.go
│   ├── websocket/          # WebSocket connection management
│   │   ├── client.go
│   │   ├── hub.go          # Manages all active clients and broadcasts messages
│   │   └── handler.go      # HTTP handler to upgrade connections to WS
│   └── service/            # Core business logic (chat rules, user auth)
│       └── chat_service.go
├── pkg/                    # Code that could be used by other projects (optional)
│   └── logger/
│       └── logger.go
├── go.mod                  # Go module dependencies
└── go.sum                  # Hashes of your dependency versions
```

## Key Directories Explained

### `cmd/`
This is where your main applications live. The directory name for each application should match the name of the executable you want to build. 
- **`cmd/chat-server/main.go`**: This file acts as the wiring for your app. It initializes the config, connects to the database, starts the WebSocket hub, and launches the HTTP server. **It should contain almost zero business logic.** It just glues the pieces together.

### `internal/`
This is the most important folder for the logic of your app. Go enforces a special compiler rule for the `internal` directory: the code inside it can *only* be imported by code within its parent directory tree. This guarantees that your app's private application code cannot be imported by other external projects.
- **`internal/database/`**: Put all your database logic here. This includes initializing the connection (e.g., PostgreSQL or Redis) and executing queries to save/retrieve user messages.
- **`internal/websocket/`**: Put your WebSocket infrastructure here. This typically involves upgrading standard HTTP connections to WebSockets, managing individual connected clients (`client.go`), and utilizing a central "Hub" or "Router" (`hub.go`) to broadcast messages to all connected clients.
- **`internal/service/`**: Core business logic. If a user sends a message, does the user have permission? Are they muted? This layer communicates with both the `websocket` and `database` packages to apply rules before actions occur.

### `pkg/` (Optional)
This directory contains library code that is completely safe and intended to be used by *external* applications. For a beginner project, you usually don't need this right away, and putting things in `internal/` is much safer.
