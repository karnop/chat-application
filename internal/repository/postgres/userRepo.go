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

func (r *UserRepository) GetAll(excludeID string) ([]domain.User, error) {
	query := `SELECT id, username FROM users WHERE id != $1 ORDER BY username ASC`
	rows, err := r.pool.Query(context.Background(), query, excludeID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var users []domain.User
	for rows.Next() {
		var u domain.User
		if err := rows.Scan(&u.ID, &u.Username); err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, nil
}
