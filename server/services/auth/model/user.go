package auth

type RoleType int8

const (
	ROLE_STUDENT RoleType = 0
	ROLE_PROFESSOR
	ROLE_ADMIN
)

type UserDoc struct {
	Username string `json:"username" bson:"username"`
	Password string `json:"password" bson:"password"`
	Role     RoleType `json:"role" bson:"role"`
}