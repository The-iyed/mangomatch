package server

import (
	"context"
	"net"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-redis/redis/v8"
	"github.com/labstack/echo/v4"
	"github.com/opentracing/opentracing-go"
	"github.com/pkg/errors"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"www.github.com/The-iyed/service-example/config"
	"www.github.com/The-iyed/service-example/internal/middlewares"
	"www.github.com/The-iyed/service-example/internal/mongo-sync"
	"www.github.com/The-iyed/service-example/pkg/logger"
	"www.github.com/The-iyed/service-example/pkg/mongodb"
)

const (
	certFile        = "ssl/server.crt"
	keyFile         = "ssl/server.pem"
	maxHeaderBytes  = 1 << 20
	gzipLevel       = 5
	stackSize       = 1 << 10
	csrfTokenHeader = "X-CSRF-Token"
	bodyLimit       = "2M"
	kafkaGroupID    = "products_group"
)

type server struct {
	log     logger.Logger
	cfg     *config.Config
	tracer  opentracing.Tracer
	mongoDB *mongo.Client
	echo    *echo.Echo
	redis   *redis.Client
}

func NewServer(log logger.Logger, cfg *config.Config, tracer opentracing.Tracer, mongoDB *mongo.Client, redis *redis.Client) *server {
	return &server{log: log, cfg: cfg, tracer: tracer, mongoDB: mongoDB, echo: echo.New(), redis: redis}
}

func (s *server) Run() error {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	mw := middlewares.NewMiddlewareManager(s.log, s.cfg)

	l, err := net.Listen("tcp", s.cfg.Server.Port)
	if err != nil {
		return errors.Wrap(err, "net.Listen")
	}
	defer l.Close()

	v1 := s.echo.Group("/api/v1")
	v1.Use(mw.Metrics)

	go func() {
		s.log.Infof("Server is listening on PORT: %s", s.cfg.Http.Port)
		s.runHttpServer()
	}()

	// TRYING THE SYNC PACKAGE
	master, err := mongodb.EstablishConn(ctx, &mongodb.MongoConfig{
		URI: "mongodb://mongo:27020/popup_backend",
	})
	if err != nil {
		s.log.Error("error while connecting to master db %v ", err)
	}
	slave, err := mongodb.EstablishConn(ctx, &mongodb.MongoConfig{
		URI: "mongodb://mongo:27020/popup_socket",
	})
	if err != nil {
		s.log.Error("error while connecting to slave db %v ", err)
	}
	defaultOptions := options.Find().
		SetLimit(0).
		SetSort(bson.M{}).
		SetProjection(bson.M{}).
		SetSkip(0)

	go func() {

		s.log.Infof("Starting sync operation")
		var currentTimeUnix int32
		currentTimeUnix = int32(time.Now().Unix())
		operation := sync.NewSync(s.log, sync.MASTER_TO_SLAVE, sync.SyncElement{
			Filter: bson.M{
				"$and": []bson.M{
					{"scheduleISO": bson.M{"$exists": true}},
					{"scheduleISO.startDate": bson.M{"$lt": currentTimeUnix}},
					{"scheduleISO.endDate": bson.M{"$gt": currentTimeUnix}},
					{"isCanceled": bson.M{"$eq": false}},
					{"isDraft": bson.M{"$eq": false}},
					{"isDeleted": bson.M{"$eq": false}},
				},
			},
			Options:      defaultOptions,
			Logger:       s.log,
			Client:       master,
			DataBase:     "popup_backend",
			Collection:   "popups",
			PrimaryField: "_id",
		}, sync.SyncElement{
			Filter:       bson.M{},
			Options:      defaultOptions,
			Logger:       s.log,
			Client:       slave,
			DataBase:     "popup_socket",
			Collection:   "messages",
			PrimaryField: "message_id",
		},
			[]string{"_id;message_id",
				"website;appId",
				"queryString;query",
				"mobilePopupComponents;mobilePopupComponents",
				"status;status",
				"title;title",
				"titleOfPopup;titleOfPopup",
				"replyType;replyType",
				"emojis;emojis",
				"popupBackgroundImage;popupBackgroundImage",
				"popupTime;popupTime",
				"popupBackground;popupBackground",
				"website;website",
				"listOfAudience;listOfAudience",
				"href;href",
				"scheduleISO;scheduleISO",
				"priorityOrder;priorityOrder",
				"popupToken;popupToken",
				"popupHtmlContent;popupHtmlContent",
				"devices;devices"},
			[]string{
				"message_id;string",
			},
			false,
		)

		for {
			currentTimeUnix = int32(time.Now().Unix())
			s.log.Info(currentTimeUnix)
			operation.SyncDb(ctx)
			time.Sleep(2 * time.Second)
		}
	}()

	metricsServer := echo.New()
	go func() {
		metricsServer.GET("/metrics", echo.WrapHandler(promhttp.Handler()))
		s.log.Infof("Metrics server is running on port: %s", s.cfg.Metrics.Port)
		if err := metricsServer.Start(s.cfg.Metrics.Port); err != nil {
			s.log.Error(err)
			cancel()
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)

	select {
	case v := <-quit:
		s.log.Errorf("signal.Notify: %v", v)
	case done := <-ctx.Done():
		s.log.Errorf("ctx.Done: %v", done)
	}

	if err := s.echo.Server.Shutdown(ctx); err != nil {
		return errors.Wrap(err, "echo.Server.Shutdown")
	}

	if err := metricsServer.Shutdown(ctx); err != nil {
		s.log.Errorf("metricsServer.Shutdown: %v", err)
	}
	s.log.Info("Server Exited Properly")

	return nil
}
