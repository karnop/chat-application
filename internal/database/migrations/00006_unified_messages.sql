-- +goose Up
-- Create the unified messages table
CREATE TABLE IF NOT EXISTS messages_new (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    room_name TEXT, -- NULL for DMs
    recipient_id UUID, -- NULL for Room messages
    content TEXT NOT NULL,
    timestamp BIGINT NOT NULL
);

-- Index for room history
CREATE INDEX idx_messages_room_time ON messages_new (room_name, timestamp DESC) WHERE room_name IS NOT NULL;

-- Index for DM history between two users
-- This index covers (UserA, UserB) OR (UserB, UserA) history combined with recipient_id lookups
CREATE INDEX idx_messages_dm_conversation ON messages_new (sender_id, recipient_id, timestamp DESC) WHERE recipient_id IS NOT NULL;
CREATE INDEX idx_messages_dm_recipient ON messages_new (recipient_id, sender_id, timestamp DESC) WHERE recipient_id IS NOT NULL;

-- 🚚 Migrate data from old messages table
INSERT INTO messages_new (sender_id, room_name, content, timestamp)
SELECT u.id, m.room, m.content, m.timestamp 
FROM messages m
JOIN users u ON m.username = u.username;

-- 🚚 Migrate data from direct_messages table
INSERT INTO messages_new (sender_id, recipient_id, content, timestamp)
SELECT sender_id, recipient_id, content, timestamp 
FROM direct_messages;

-- Swap the tables
DROP TABLE messages CASCADE;
DROP TABLE direct_messages CASCADE;
ALTER TABLE messages_new RENAME TO messages;

-- Re-create reaction foreign key to point to the new messages table
ALTER TABLE message_reactions 
DROP CONSTRAINT IF EXISTS message_reactions_message_id_fkey,
ADD CONSTRAINT message_reactions_message_id_fkey 
FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE;

-- +goose Down
-- This is a destructive migration due to the table merge, 
-- but we can try to recreate the split if needed.
-- For now, we focus on the forward-moving refactor.
