package domain

type AuthService interface {
	Signup(username, password string) error
	Login(username, password string) (string, error)
	VerifyToken(token string) (string, string, error) // returns user id and user name
}
