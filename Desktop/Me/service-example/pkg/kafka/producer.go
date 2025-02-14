package kafka

import (
	"context"

	"www.github.com/The-iyed/service-example/pkg/logger"

	"github.com/segmentio/kafka-go"
)

type kafkaProducer struct {
	writer *kafka.Writer
	logger logger.Logger
}

func (p *kafkaProducer) Publish(topic string, key, message []byte) error {
	p.logger.Infof("Publishing message to topic: %s", topic)
	err := p.writer.WriteMessages(context.Background(),
		kafka.Message{
			Topic: topic,
			Key:   key,
			Value: message,
		},
	)
	if err != nil {
		p.logger.Errorf("Failed to publish message: %v", err)
		return err
	}
	p.logger.Info("Message published successfully")
	return nil
}

func (p *kafkaProducer) Close() error {
	p.logger.Info("Closing Kafka producer")
	return p.writer.Close()
}
