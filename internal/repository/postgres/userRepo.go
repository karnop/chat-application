package repository

import (
	"context"
	"manavmsanger/chatapp/internal/domain"

	"github.com/jackc/pgx/v5/pgxpool"
)

// implements domain.UserRepository interface
type UserRepository struct {
	pool *pgxpool.Pool
}

func NewUserRepository(pool *pgxpool.Pool) *UserRepository {
	return &UserRepository{pool: pool}
}

// add a new user
func (r *UserRepository) Create(username, hash string) error {
	query := `INSERT INTO users (username, password_hash) VALUES ($1, $2)`

	_, err := r.pool.Exec(context.Background(), query, username, hash)
	return err
}

// get a user by username
func (r *UserRepository) GetByUsername(username string) (*domain.User, error) {
	query := `SELECT id, username, password_hash, created_at FROM users WHERE username = $1`

	row := r.pool.QueryRow(context.Background(), query, username)

	var user domain.User
	err := row.Scan(&user.ID, &user.Username, &user.PasswordHash, &user.CreatedAt)
	return &user, err
}
