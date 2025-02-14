package kafka

import (
	"www.github.com/The-iyed/service-example/config"
	"www.github.com/The-iyed/service-example/pkg/logger"

	"github.com/segmentio/kafka-go"
)

func NewKafkaConsumer(cfg *config.Config, log logger.Logger) IKafkaConsumer {
	return &KafkaConsumer{
		reader: kafka.NewReader(kafka.ReaderConfig{
			Brokers:     cfg.Kafka.Brokers,
			GroupID:     cfg.Kafka.GroupID,
			GroupTopics: cfg.Kafka.Topics,
		}),
		logger: log,
	}
}

func NewKafkaProducer(cfg *config.Config, log logger.Logger) IKafkaProducer {
	return &kafkaProducer{
		writer: &kafka.Writer{
			Addr:     kafka.TCP(cfg.Kafka.Brokers...),
			Balancer: &kafka.LeastBytes{},
		},
		logger: log,
	}
}

func NewKafkaTopicManager(brokers []string, log logger.Logger) IKafkaTopicManager {
	return &kafkaTopicManager{
		brokers: brokers,
		logger:  log,
	}
}
