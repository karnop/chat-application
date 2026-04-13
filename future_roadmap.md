# Future Roadmap: Go Backend Expansion

This document outlines the architectural roadmap for evolving the current in-memory, single-node chat application into a highly scalable, production-ready distributed system. The focus is primarily on advanced Go backend concepts.

---

## Phase 1: Persistence & Identity
*Currently, the app stores state in memory and uses anonymous sessions. The first real-world step is persisting state securely.*

1. **Relational Database (PostgreSQL / MySQL)**
   - **User Models**: Store registered users, securely hashed passwords (using `bcrypt`), and profile metadata.
   - **Room Metadata**: Store room owners, creation dates, and descriptions.
   - **Chat History**: Persist chat messages to disk. The `Hub` will asynchronously write messages to the DB (e.g., using a worker pool) while instantly serving active connections from memory.

2. **Authentication & Authorization**
   - **JWT (JSON Web Tokens)**: Implement a secure login flow that returns a JWT. Pass this token during the initial HTTP WebSocket upgrade request to authenticate the socket.
   - **RBAC (Role-Based Access Control)**: Define roles like `Admin`, `Moderator`, and `User`. Prevent unauthorized users from sending messages to "locked" channels.

## Phase 2: Horizontal Scalability
*Currently, if we deploy 5 copies of our Go server behind a Load Balancer, a user on Server A cannot chat with a user on Server B. We need to distribute the Hub.*

1. **Redis Pub/Sub Integration**
   - Instead of the Go server just broadcasting to its *local* `rooms` map, it will publish the message to a Redis channel (e.g., `PUBLISH room:general "{...}"`).
   - Every Go server subscribes to Redis. When a message arrives from Redis, the local server checks if any of its active WebSocket clients are in that room, and if so, pushes the message.
   
2. **Presence & State Management**
   - Use Redis to track "Who is Online". When a user connects to *any* Go server, set a Redis key with an expiration (TTL). 
   - Broadcast "User X went offline" events seamlessly.

## Phase 3: Advanced Chat Mechanics
*With scale and data secured, we focus on user-centric messaging features.*

1. **Direct Messaging (1-to-1)**
   - Create private, encrypted communication channels restricted strictly to two users.
   - Implement read receipts (Delivered / Read) using specialized WebSocket event types.

2. **Typing Indicators & Reactions**
   - Create ephemeral WebSocket events (e.g., `type: "typing"`) that do not get persisted to the database but are simply routed through the Hub.

3. **Rate Limiting & Anti-Spam**
   - Implement the Token Bucket algorithm (using Go's `golang.org/x/time/rate`) as middleware.
   - Restrict users from sending more than 5 messages per second to prevent network congestion and abuse.

4. **Media Uploads**
   - Integrate an S3-compatible service (AWS S3, MinIO).
   - Create a Go HTTP route that generates **Presigned URLs**. The client uploads heavy images directly to S3 via the URL, and then sends a fast WebSocket message containing the image link, keeping the Go server lightweight.

## Phase 4: Operational Readiness
*Preparing the codebase for massive traffic and enterprise-grade reliability.*

1. **Metrics & Tracing (Observability)**
   - Expose a `/metrics` endpoint using **Prometheus**. Track metrics like:
     - `active_websockets_total`
     - `messages_processed_per_second`
     - `websocket_errors_total`
   - Implement OpenTelemetry for tracing the lifespan of a message.

2. **Testing Strategy**
   - Write Go unit tests for `hub.go` isolating the logic from the network using mocked Client interfaces.
   - Use Load Testing tools like `K6` or `Vegeta` to throw 100,000 synthetic connections at the Go server to tune the OS limits, `ulimit`, and Go Garbage Collector profiles.

3. **Containerization**
   - Create a Multi-stage `Dockerfile` to compile the "Single Binary" (Go backend + embedded React frontend) into a distroless alpine image weighing < 20MB.

---

## 🎨 UI/Frontend Considerations (Secondary)
While the backend handles the heavy lifting, the React frontend will need extensions to consume these APIs:
1. **JWT Header injections** for standard API calls.
2. **Optimistic UI Updates**: Instantly showing a message on the sender's screen while a subtle "loading" spinner waits for the server to confirm receipt.
3. **Infinite Scrolling**: Fetching paginated historical messages via a standard REST API (`/api/rooms/general/messages?page=2`) as the user scrolls up.
