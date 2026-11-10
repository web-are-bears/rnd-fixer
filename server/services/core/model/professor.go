package model

type ProfessorDoc struct {
	ProfId         string `json:"_id" bson:"_id"`
	ProfUsername   string `json:"prof_username" bson:"prof_username"`
	ProfName       string `json:"prof_name" bson:"prof_name"`
	Email          string `json:"email" bson:"email"`
	About          string `json:"about" bson:"about"`
	Link           []string `json:"link" bson:"link"`
}

type ProfessorEdit struct {
	ProfName       string `json:"prof_name" bson:"prof_name"`
	Email          string `json:"email" bson:"email"`
	About          string `json:"about" bson:"about"`
	Link           []string `json:"link" bson:"link"`
}