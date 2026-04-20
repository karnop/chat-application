package database

import (
	"context"
	"time"

	"github.com/redis/go-redis/v9"
)

func InitRedis(url string) (*redis.Client, error) {
	rdb := redis.NewClient(&redis.Options{
		Addr: url,
	})

	// ping to verify
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := rdb.Ping(ctx).Err(); err != nil {
		return nil, err
	}

	return rdb, nil
}
