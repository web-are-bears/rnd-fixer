package config

type MongoConfig struct {
	Credentials   string `json:"credentials"`
	Hostname      string `json:"hostname"`
	Database	  string `json:"database"`
	Collection    string `json:"collection"`
	Options       map[string]string `json:"options"`
}

func LoadMongoConfig() (*MongoConfig, error) {
	// TODO (ashu3103): Load configuration from a file or environment variables
	return &MongoConfig{
		Credentials: Env("MONGO_CREDENTIALS", "/home/ashu3103/Desktop/rnd-fixer/server/shared/mongo/keys/credentials.txt"),
		Hostname: "cluster-1.fk4iqvj.mongodb.net",
		Database: Env("MONGO_DB", "rnd_match_fixer"),
		Collection: Env("MONGO_COLLECTION", "auth"),
		Options: map[string]string{
			"appName": "cluster-1",
		},
	}, nil
}