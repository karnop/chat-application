# GoChat - High-Performance WebSocket Chat

A production-grade, multi-room chat application built with **Go** (Backend) and **React + Tailwind CSS** (Frontend). Designed with scalability in mind, it features a concurrent Hub & Client architecture, structured logging, and a robust Direct Messaging system.

---

## 🚀 Key Features

- **Real-time Communication**: Low-latency messaging via WebSockets.
- **Direct Messaging (DM)**: Secure 1-to-1 private conversations between users.
- **Room Management**: Support for public and private channels with invitation-only access for private rooms.
- **JWT Authentication**: Secure user registration and session management.
- **Glassmorphic UI**: A modern, responsive interface with backdrop-blurs and glowing accents.
- **Clean Architecture**: Backend strictly follows the Hexagonal (Ports & Adapters) pattern for maintainability.
- **Persistence**: Full message history and user data stored in PostgreSQL.

---

## 🏗 Backend Documentation

### Architecture
The backend is structured using **Clean Architecture**. This decouples business logic from external dependencies like databases or web frameworks.
- **Domain**: Business entities and repository interfaces (`internal/domain`).
- **Service**: Orchestrates business rules (`internal/service`).
- **Repository**: Data persistence implementations (`internal/repository`).
- **API**: HTTP handlers and WebSocket logic (`internal/api`, `internal/websocket`).

### API Endpoint Reference

| Endpoint | Method | Auth | Description |
| :--- | :--- | :--- | :--- |
| `/api/signup` | POST | No | Register a new user account. |
| `/api/login` | POST | No | Authenticate and receive a JWT. |
| `/api/rooms` | GET | Yes | List all public rooms and joined private rooms. |
| `/api/rooms` | POST | Yes | Create a new channel (Public or Private). |
| `/api/rooms/invite` | POST | Yes | Invite a user to a private room. |
| `/api/users` | GET | Yes | Discover other users to start a DM. |
| `/api/dm/history/{id}` | GET | Yes | Fetch message history for a 1-to-1 conversation. |
| `/ws` | GET | No | WebSocket upgrade endpoint (token passed as query param). |

### WebSocket Protocol
Messages are exchanged as JSON envelopes with the following structure:
```json
{
  "type": "chat | dm | join",
  "room": "RoomName or RecipientID",
  "user": "SenderUsername",
  "content": "Message content",
  "timestamp": 123456789
}
```

---

## 🎨 Frontend Architecture

The frontend is built with **Vite, React, and Tailwind CSS v4**. It was recently refactored from a monolithic `App.jsx` into a modular component-based system.

### Core Components (`src/components/`)
- **`sidebar/`**: Manages Channel lists and the searchable Private Messages interface.
- **`chat/`**: Handles the Message List, Chat Header, and Input logic.
- **`auth/`**: Isolated screens for Login and Signup.
- **`common/`**: Reusable UI elements like `Toast` notifications and `AmbientBackground`.

### State Management
- **`useWebSocket`**: A custom hook that abstracts the socket connection, manages automatic reconnection, and handles incoming message buffering.

---

## 🛠 Setup & Development

### Deployment Checklist (Environment Variables)
Ensure the following variables are set:
- `DATABASE_URL`: Postgres connection string.
- `JWT_SECRET`: Secret key for token signing.
- `PORT`: Server port (default: 8080).
- `FRONTEND_URL`: CORS allowed origin (e.g., `http://localhost:5173`).

### Database Migrations
We use `goose` for schema management.
```bash
# Apply migrations
goose -dir internal/database/migrations postgres "$DATABASE_URL" up
```

### Running Locally
```bash
# Backend
go run cmd/chat-server/*.go

# Frontend
cd frontend
npm run dev
```

---

## 📁 Directory Structure
```text
.
├── cmd/chat-server/    # Application entrypoint
├── internal/
│   ├── api/            # HTTP Handlers
│   ├── domain/         # Core Models & Interfaces
│   ├── service/        # Business Logic
│   ├── repository/     # Postgres Implementations
│   └── websocket/      # Real-time Hub & Client logic
├── frontend/
│   ├── src/
│   │   ├── components/ # Modular UI components
│   │   └── hooks/      # Custom React hooks
│   └── index.css       # Tailwind v4 configuration
└── README.md
```

### UI

![alt text](assets/images/image-1.png)
![alt text](assets/images/image-2.png)
![alt text](assets/images/image.png)
