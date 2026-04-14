package service

import (
	"errors"
	"manavmsanger/chatapp/internal/auth"
	"manavmsanger/chatapp/internal/config"
	"manavmsanger/chatapp/internal/domain"
)

type AuthService struct {
	repo domain.UserRepository
	cfg  *config.Config
}

func NewAuthService(repo domain.UserRepository, cfg *config.Config) *AuthService {
	return &AuthService{repo: repo, cfg: cfg}
}

func (s *AuthService) Signup(username, password string) error {
	hash, err := auth.HashPassword(password)
	if err != nil {
		return err
	}
	return s.repo.Create(username, hash)
}

func (s *AuthService) Login(username, password string) (string, error) {
	user, err := s.repo.GetByUsername(username)
	if err != nil {
		return "", err
	}

	if !auth.CheckPassword(user.PasswordHash, password) {
		return "", errors.New("invalid password")
	}

	token, err := auth.GenerateToken(s.cfg.JWTSecret, user.ID)
	if err != nil {
		return "", err
	}

	return token, nil
}
