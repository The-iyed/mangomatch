package config

import (
	"log"
	"os"
	"time"

	"github.com/spf13/viper"
)

const (
	HTTP_PORT = "HTTP_PORT"
)

type Config struct {
	AppVersion string
	Server     Server
	Logger     Logger
	Jaeger     Jaeger
	Metrics    Metrics
	MongoDB    MongoDB
	Kafka      Kafka
	Http       Http
	Redis      Redis
}

type Server struct {
	Port              string
	Development       bool
	Timeout           time.Duration
	ReadTimeout       time.Duration
	WriteTimeout      time.Duration
	MaxConnectionIdle time.Duration
	MaxConnectionAge  time.Duration
	Kafka             Kafka
}

type Http struct {
	Port              string
	PprofPort         string
	Timeout           time.Duration
	ReadTimeout       time.Duration
	WriteTimeout      time.Duration
	CookieLifeTime    int
	SessionCookieName string
}

type Logger struct {
	DisableCaller     bool
	DisableStacktrace bool
	Encoding          string
	Level             string
}

type Jaeger struct {
	Host        string
	ServiceName string
	LogSpans    bool
}

type Kafka struct {
	Brokers []string
	GroupID	string
	Topics 	[]string
}

type Metrics struct {
	Port        string
	URL         string
	ServiceName string
}

type Redis struct {
	RedisAddr      string
	RedisPassword  string
	RedisDB        string
	RedisDefaultDB string
	MinIdleConn    int
	PoolSize       int
	PoolTimeout    int
	Password       string
	DB             int
}

type MongoDB struct {
	URI      string
	User     string
	Password string
	DB       string
}

func exportConfig() error {
	viper.SetConfigType("yaml")
	viper.SetConfigName("config-docker") 
	viper.AddConfigPath(".")
	viper.AddConfigPath("./config") 

	log.Printf("Checking config file in: %s\n", "/app/config")

	if err := viper.ReadInConfig(); err != nil {
		return err
	}
	return nil
}

func ParseConfig() (*Config, error) {
	if err := exportConfig(); err != nil {
		return nil, err
	}

	var c Config
	err := viper.Unmarshal(&c)
	if err != nil {
		log.Printf("unable to decode into struct, %v", err)
		return nil, err
	}

	httpPort := os.Getenv(HTTP_PORT)
	if httpPort != "" {
		c.Http.Port = httpPort
	}

	return &c, nil
}
