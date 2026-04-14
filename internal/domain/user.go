package domain

import "time"

// A registered person in the software
type User struct {
	ID           string
	Username     string
	PasswordHash string
	CreatedAt    time.Time
}

// UserRepository defines the contract for how we save/load users
// any db we use must follow these rules
type UserRepository interface {
	Create(username, hash string) error
	GetByUsername(username string) (*User, error)
}
