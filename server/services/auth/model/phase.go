package model

type PhaseDoc struct {
	Username string `json:"username" bson:"username"`
	Phase string `json:"phase" bson:"phase"`
}