package model

type StudentDoc struct {
	StudId            string `json:"_id" bson:"_id"`
	StudUsername      string `json:"stud_username" bson:"stud_username"`
	StudName  	      string `json:"stud_name" bson:"stud_name"`
	Email          	  string `json:"email" bson:"email"`
	About          	  string `json:"about" bson:"about"`
	Link           	  []string `json:"link" bson:"link"`
	FinalProjId    	  string `json:"final_proj_id" bson:"final_proj_id"`
	TokenDistribution map[string]uint32 `json:"token_distribution" bson:"token_distribution"`
}

type StudentEdit struct {
	StudName       string `json:"stud_name" bson:"stud_name"`
	Email          string `json:"email" bson:"email"`
	About          string `json:"about" bson:"about"`
	Link           []string `json:"link" bson:"link"`
}

