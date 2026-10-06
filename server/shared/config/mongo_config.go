package config

type MongoConfig struct {
	Username      string `json:"username"`
	Password      string `json:"password"`
	Hostname      string `json:"hostname"`
	Database	  string `json:"database"`
	Options       map[string]string `json:"options"`
}

func LoadMongoConfig() (*MongoConfig, error) {
	// TODO (ashu3103): Load configuration from a file or environment variables
	return &MongoConfig{
		Username: "ash2003sharma_db_user",
		Password: "0exzPZXZqQzuwMBa",
		Hostname: "cluster-1.fk4iqvj.mongodb.net",
		Database: "",
		Options: map[string]string{
			"appName": "cluster-1",
		},
	}, nil
}