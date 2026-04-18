-- +goose Up
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    is_private BOOLEAN DEFAULT false,
    owner_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE room_members (
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (room_id, user_id)
);

INSERT INTO rooms (name, description, is_private, owner_id)
SELECT 'General', 'The main lobby for everyone', false, id FROM users LIMIT 1;

INSERT INTO rooms (name, description, is_private, owner_id)
SELECT 'Tech', 'Talk about Go, React, and Architecture', false, id FROM users LIMIT 1;

INSERT INTO rooms (name, description, is_private, owner_id)
SELECT 'Random', 'Anything goes here!', false, id FROM users LIMIT 1;

-- +goose Down
DROP TABLE room_members;
DROP TABLE rooms;
