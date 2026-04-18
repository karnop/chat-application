package domain

import "time"

// A registered person in the software
type User struct {
	ID           string    `json:"id"`
	Username     string    `json:"username"`
	PasswordHash string    `json:"-"`
	CreatedAt    time.Time `json:"created_at"`
}

// UserRepository defines the contract for how we save/load users
// any db we use must follow these rules
type UserRepository interface {
	Create(username, hash string) error
	GetByUsername(username string) (*User, error)
	// GetByID(id string) (*User, error)
	GetAll(excludeID string) ([]User, error)
}
