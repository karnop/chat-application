package domain

type AuthService interface {
	Signup(username, password string) error
	Login(username, password string) (string, error)
}
