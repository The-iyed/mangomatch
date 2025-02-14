package injector

import (
	"github.com/google/wire"
	"www.github.com/The-iyed/service-example/config"
	"www.github.com/The-iyed/service-example/pkg/kafka"
	"www.github.com/The-iyed/service-example/pkg/logger"
)

func NewKafkaConsumer(cfg *config.Config, log logger.Logger) kafka.IKafkaConsumer {
	wire.Build(
		kafka.ConsumerProviderSet,
	)
	return nil
}

func NewKafkaProducer(cfg *config.Config, log logger.Logger) kafka.IKafkaProducer {
	wire.Build(
		kafka.ProducerProviderSet,
	)
	return nil
}
