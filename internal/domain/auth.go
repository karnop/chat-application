package domain

type AuthService interface {
	Signup(username, password string) error
	Login(username, password string) (token string, userId string, err error)
	VerifyToken(token string) (userId string, username string, err error)
}
