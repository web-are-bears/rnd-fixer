package model

type ProjectDoc struct {
	ProjId             string `json:"_id" bson:"_id"`
	ProjName           string `json:"proj_name" bson:"proj_name"`
	Description 	   string `json:"description" bson:"description"`
	ProfUsername       string `json:"prof_username" bson:"prof_username"`
	MaxOccupancy	   uint32  `json:"max_occupancy" bson:"max_occupancy"`
	TokenDistribution  map[string]uint32 `json:"token_distribution" bson:"token_distribution"`
}

type TokenDoc struct {
	ProjId    		string `json:"_id" bson:"_id"`
	StudUsername    string `json:"stud_username" bson:"stud_username"`
	Token        	uint32 `json:"token" bson:"token"`
}