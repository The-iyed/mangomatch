package kafka

import "github.com/google/wire"

var ConsumerProviderSet = wire.NewSet(
	NewKafkaConsumer,
)

var ProducerProviderSet = wire.NewSet(
	NewKafkaProducer,
)