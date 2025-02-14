package kafka

import (
	"fmt"

	"github.com/segmentio/kafka-go"
	"www.github.com/The-iyed/service-example/pkg/logger"
)

type kafkaTopicManager struct {
	brokers []string
	logger  logger.Logger
}


func (ktm *kafkaTopicManager) CreateTopic(topic string, numPartitions int, replicationFactor int) error {
	conn, err := kafka.Dial("tcp", ktm.brokers[0])
	if err != nil {
		return fmt.Errorf("failed to connect to Kafka: %v", err)
	}
	defer conn.Close()

	controller, err := conn.Controller()
	if err != nil {
		return fmt.Errorf("failed to get Kafka controller: %v", err)
	}

	controllerConn, err := kafka.Dial("tcp", controller.Host)
	if err != nil {
		return fmt.Errorf("failed to connect to Kafka controller: %v", err)
	}
	defer controllerConn.Close()

	topicConfigs := []kafka.TopicConfig{
		{
			Topic:             topic,
			NumPartitions:     numPartitions,
			ReplicationFactor: replicationFactor,
		},
	}

	err = controllerConn.CreateTopics(topicConfigs...)
	if err != nil {
		ktm.logger.Errorf("failed to create topic %s: %v", topic, err)
		return err
	}

	ktm.logger.Infof("Topic %s created successfully", topic)
	return nil
}

func (ktm *kafkaTopicManager) TopicExists(topic string) (bool, error) {
	conn, err := kafka.Dial("tcp", ktm.brokers[0])
	if err != nil {
		return false, fmt.Errorf("failed to connect to Kafka: %v", err)
	}
	defer conn.Close()

	partitions, err := conn.ReadPartitions(topic)
	if err != nil {
		return false, nil
	}

	return len(partitions) > 0, nil
}

func (ktm *kafkaTopicManager) DeleteTopic(topic string) error {
	conn, err := kafka.Dial("tcp", ktm.brokers[0])
	if err != nil {
		return fmt.Errorf("failed to connect to Kafka: %v", err)
	}
	defer conn.Close()

	err = conn.DeleteTopics(topic)
	if err != nil {
		ktm.logger.Errorf("failed to delete topic %s: %v", topic, err)
		return err
	}

	ktm.logger.Infof("Topic %s deleted successfully", topic)
	return nil
}
