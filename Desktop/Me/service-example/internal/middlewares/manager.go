package middlewares

import (
	"github.com/labstack/echo/v4"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
	"www.github.com/The-iyed/service-example/config"
	"www.github.com/The-iyed/service-example/pkg/logger"
)

var (
	httpTotalRequests = promauto.NewCounter(prometheus.CounterOpts{
		Name: "http_microservice_total_requests",
		Help: "The total number of incoming HTTP requests",
	})
)


type middlewareManager struct {
	log logger.Logger
	cfg *config.Config
}

type MiddlewareManager interface {
	Metrics(next echo.HandlerFunc) echo.HandlerFunc
}

func NewMiddlewareManager(log logger.Logger, cfg *config.Config) *middlewareManager {
	return &middlewareManager{log: log, cfg: cfg}
}

func (m *middlewareManager) Metrics(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		httpTotalRequests.Inc()
		return next(c)
	}
}
