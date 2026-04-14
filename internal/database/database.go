package database

import (
	"context"
	"log/slog"

	"github.com/jackc/pgx/v5/pgxpool"
)

// initializing a new connection pool to NeonDb
func InitDB(connString string) (*pgxpool.Pool, error) {
	ctx := context.Background()

	// creating the pool
	pool, err := pgxpool.New(ctx, connString)
	if err != nil {
		return nil, err
	}

	// pinging the database to verify the connection
	if err := pool.Ping(ctx); err != nil {
		return nil, err
	}

	slog.Info("Database connection successful")
	return pool, nil
}
