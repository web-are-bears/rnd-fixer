package model

type AlgoDoc struct {
	StudUsername   string `json:"stud_username" bson:"stud_username"`
	ProjId   string `json:"proj_id" bson:"proj_id"`
}