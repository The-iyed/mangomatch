package main

import (
	"context"
	"fmt"
	"log"

	"github.com/opentracing/opentracing-go"
	"www.github.com/The-iyed/service-example/config"
	"www.github.com/The-iyed/service-example/internal/server"
	"www.github.com/The-iyed/service-example/pkg/jaeger"
	"www.github.com/The-iyed/service-example/pkg/logger"
	"www.github.com/The-iyed/service-example/pkg/mongodb"
	"www.github.com/The-iyed/service-example/pkg/redis"
)

func main() {

	fmt.Println("Starting service...")
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	cfg, err := config.ParseConfig()
	if err != nil {
		log.Fatal(err)
	}

	appLogger := logger.NewApiLogger(cfg)
	appLogger.InitLogger()
	appLogger.Info("Starting server")

	appLogger.Infof("Success parsed config: %#v", cfg.AppVersion)

	tracer, closer, err := jaeger.InitJaeger(cfg)
	if err != nil {
		appLogger.Fatal("cannot create tracer", err)
	}
	appLogger.Info("Jaeger connected")

	opentracing.SetGlobalTracer(tracer)
	defer closer.Close()
	appLogger.Info("Opentracing connected")

	mongoDBConn, err := mongodb.NewMongoDBConn(ctx, cfg)
	if err != nil {
		appLogger.Fatal("cannot connect mongodb", err)
	}
	defer func() {
		if err := mongoDBConn.Disconnect(ctx); err != nil {
			appLogger.Fatal("mongoDBConn.Disconnect", err)
		}
	}()
	appLogger.Infof("MongoDB connected: %v", mongoDBConn.NumberSessionsInProgress())

	redisClient := redis.NewRedisClient(cfg)
	appLogger.Info("Redis connected")

	s := server.NewServer(appLogger, cfg, tracer, mongoDBConn, redisClient)
	appLogger.Fatal(s.Run())

}
