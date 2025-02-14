package kafka

import (
	"context"
	"github.com/segmentio/kafka-go"
	"www.github.com/The-iyed/service-example/pkg/logger"
)

type KafkaConsumer struct {
	reader *kafka.Reader
	logger logger.Logger
}

func (c *KafkaConsumer) Consume(ctx context.Context) {
	c.logger.Info("Starting the consumer service ... ")
	for {
		msg, err := c.reader.ReadMessage(ctx)
		if err != nil {
			c.logger.Errorf("Error consuming message: %v", err)
			continue
		}
		c.logger.Infof("Consumed message: %s", string(msg.Value))
	}
}

func (c *KafkaConsumer) Close() error {
	c.logger.Info("Closing Kafka consumer")
	return c.reader.Close()
}
