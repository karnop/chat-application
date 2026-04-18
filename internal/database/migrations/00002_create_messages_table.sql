-- +goose Up
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    timestamp BIGINT NOT NULL
);
-- Index for fast room history retrieval
CREATE INDEX idx_messages_room_timestamp ON messages (room, timestamp DESC);
-- +goose Down
DROP TABLE messages;