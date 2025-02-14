package kafka

import "context"

type IKafkaProducer interface {
	Publish(topic string, key, message []byte) error 
}

type IKafkaConsumer interface {
	Consume(ctx context.Context)
	Close() error
}

type IKafkaTopicManager interface {
	CreateTopic(topic string, numPartitions int, replicationFactor int) error
	TopicExists(topic string) (bool, error)
	DeleteTopic(topic string) error
}