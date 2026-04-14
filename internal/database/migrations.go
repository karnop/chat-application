package database

import (
	"embed"
	"log/slog"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jackc/pgx/v5/stdlib"
	"github.com/pressly/goose/v3"
)

// this tells go to take everything inside migrations folder and embed it into the variable
//
//go:embed migrations/*.sql
var embedMigrations embed.FS

func RunMigrations(pool *pgxpool.Pool) error {
	// goose works with standard sql pacakge, so we are converting the pool temporarily
	db := stdlib.OpenDBFromPool(pool)
	defer db.Close()

	// making goose use the embedded files we just defined
	goose.SetBaseFS(embedMigrations)
	if err := goose.SetDialect("postgres"); err != nil {
		return err
	}

	// running the migrations
	slog.Info("Running DB migrations")
	if err := goose.Up(db, "migrations"); err != nil {
		return err
	}

	slog.Info("DB migrations completed successfully")
	return nil
}
