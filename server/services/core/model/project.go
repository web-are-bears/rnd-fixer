package model

type ProjectDoc struct {
	ProjectId          string `json:"_id" bson:"_id"`
	ProjectName        string `json:"project_name" bson:"project_name"`
	Description 	   string `json:"description" bson:"description"`
	ProfId             string `json:"prof_id" bson:"prof_id"`
	MaxOccupancy	   uint32  `json:"max_occupancy" bson:"max_occupancy"`
	TokenDistribution  map[string]uint32 `json:"token_distribution" bson:"token_distribution"`
}

type TokenDoc struct {
	ProjectId    string `json:"_id" bson:"_id"`
	StudentId    string `json:"student_id" bson:"student_id"`
	Token        uint32 `json:"token" bson:"token"`
}