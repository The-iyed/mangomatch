# Config Package Overview

The `config` package is responsible for loading and parsing the configuration for the application from a YAML file. It uses the `viper` package to read configuration files, environment variables, and provide the configuration to the application.

## Key Components

### `Config` Struct
The main struct `Config` contains the entire configuration structure for the application, which is split into various sub-structs:
- **AppVersion**: The version of the application.
- **Server**: Configuration related to the server, including connection timeouts, max idle connections, and Kafka configurations.
- **Logger**: Configurations for logging such as log level, encoding, and enabling/disabling stacktrace.
- **Jaeger**: Configuration for distributed tracing with Jaeger.
- **Metrics**: Configuration related to metrics collection.
- **MongoDB**: MongoDB database connection configuration.
- **Kafka**: Kafka configuration for brokers, topics, and consumer group IDs.
- **Http**: HTTP server settings like port, session cookie configuration, and timeouts.
- **Redis**: Redis connection settings, including address, password, DB, and connection pool configurations.

### Struct Definitions

#### `Server`
The `Server` struct contains settings specific to the server like:
- **Port**: The port for the HTTP server.
- **Development**: A boolean flag to indicate whether the application is running in development mode.
- **Timeout, ReadTimeout, WriteTimeout**: Timeouts for server requests.
- **MaxConnectionIdle, MaxConnectionAge**: Max idle time and max connection age for database connections.

#### `Http`
The `Http` struct contains settings for the HTTP server:
- **Port**: The port for the HTTP server.
- **PprofPort**: The port for pprof (profiling).
- **Timeout, ReadTimeout, WriteTimeout**: Timeouts for the HTTP server.
- **CookieLifeTime**: Lifetime of the session cookie.
- **SessionCookieName**: The name for the session cookie.

#### `Logger`
The `Logger` struct contains logging configurations such as:
- **DisableCaller**: Flag to disable caller info in logs.
- **DisableStacktrace**: Flag to disable stack traces in logs.
- **Encoding**: Log format (e.g., JSON).
- **Level**: Log level (e.g., info, debug, error).

#### `Jaeger`
The `Jaeger` struct contains configuration for distributed tracing with Jaeger:
- **Host**: Jaeger host address.
- **ServiceName**: Name of the service for Jaeger tracing.
- **LogSpans**: Flag to enable logging of spans.

#### `Kafka`
The `Kafka` struct contains configuration related to Kafka:
- **Brokers**: List of Kafka brokers.
- **GroupID**: Kafka consumer group ID.
- **Topics**: List of Kafka topics to subscribe to.

#### `Metrics`
The `Metrics` struct contains metrics-related configuration:
- **Port**: Port for the metrics server.
- **URL**: URL for the metrics endpoint.
- **ServiceName**: The service name for metrics.

#### `Redis`
The `Redis` struct contains Redis connection configurations:
- **RedisAddr**: Redis server address.
- **RedisPassword**: Redis password for authentication.
- **RedisDB**: Redis database to connect to.
- **MinIdleConn**: Minimum number of idle connections.
- **PoolSize**: Size of the connection pool.
- **PoolTimeout**: Timeout for getting connections from the pool.
- **Password**: Redis password.
- **DB**: The Redis DB to connect to.

#### `MongoDB`
The `MongoDB` struct contains MongoDB connection configurations:
- **URI**: MongoDB connection URI.
- **User**: MongoDB user for authentication.
- **Password**: MongoDB user password.
- **DB**: MongoDB database name.

### `exportConfig` Function
This function initializes `viper` with the YAML file name (`config-docker`) and config file paths. It reads the configuration file from the specified paths and returns any errors encountered.

### `ParseConfig` Function
This function calls `exportConfig` to load the configuration, then unmarshals the configuration into the `Config` struct. It also allows overriding the `Http.Port` setting using the `HTTP_PORT` environment variable, if specified.

## How to Use the Config Package
1. **Configuration File**: Make sure to have the `config-docker.yaml` file in the appropriate directory (either in the current directory or in the `./config` folder).
2. **Loading Configuration**: Call the `ParseConfig` function to load and parse the configuration into a `Config` struct.
3. **Override HTTP Port**: The HTTP port can be overridden by setting the `HTTP_PORT` environment variable.

## Example Usage

```go
package main

import (
	"fmt"
	"log"
	"yourproject/config"
)

func main() {
	conf, err := config.ParseConfig()
	if err != nil {
		log.Fatalf("Error loading configuration: %v", err)
	}

	// Access configuration fields
	fmt.Println("HTTP Port:", conf.Http.Port)
}
```