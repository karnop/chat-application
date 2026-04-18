-- +goose Up
CREATE TABLE direct_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES users(id),
    recipient_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    timestamp BIGINT NOT NULL
);

-- Index for fast retrieval of conversation history between two users
-- This allows us to quickly fetch: "All messages between User A and User B"
CREATE INDEX idx_dm_conversation ON direct_messages (sender_id, recipient_id, timestamp DESC);
CREATE INDEX idx_dm_recipient_search ON direct_messages (recipient_id, sender_id, timestamp DESC);

-- +goose Down
DROP TABLE direct_messages;
