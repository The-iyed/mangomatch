# Popups Service Example

## Introduction

Welcome to the **Popups Service Example**, a microservice built using **Golang**. This service is designed with a scalable and modular architecture for handling various functionalities such as logging, messaging, retry mechanisms, and integrations with multiple external services like Kafka and MongoDB. The architecture follows best practices for building modern cloud-native services.

---

## Project Architecture

The project structure is organized for easy maintainability and scalability. The main components are structured as follows:

---

## Key Features

- **Microservice Architecture**: Follows a clean and modular approach to service design.
- **Built with Golang**: For high performance and scalability.
- **Kafka Integration**: Messaging with robust producer and consumer patterns.
- **MongoDB and Redis Support**: Persistent and caching layers for data storage.
- **Retry Mechanism**: Ensures reliable message processing.
- **gRPC and HTTP Server**: Supports multiple communication protocols.
- **Jaeger Tracing**: Distributed tracing for observability.
- **Dockerized Environment**: Simplified deployment using Docker and Docker Compose.

## Getting Started

### Prerequisites

- **Go 1.21.x** installed
- **Docker and Docker Compose** installed
- Access to **Kafka**, **MongoDB**, and **Redis** services.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/popups-service-example.git
   cd popups-service-example
   ```

# Makefile Commands Documentation

This document provides an overview of the available commands in the Makefile for managing the service's lifecycle.

## Available Commands

### `make up`

Starts the server instance by building and running the Docker containers in detached mode:

```bash
make up
```

### `make logs`

Displays the logs of the running Docker containers:

```bash
make logs
```

### `make restart`

Restarts the running Docker containers:

```bash
make restart
```

### `make down`

Stops and removes the Docker containers:

```bash
make down
```

### `make cert`

Generates SSL certificates by running a script located in the `./ssl` directory:

```bash
make cert
```

## Running the Project

After generating the SSL certificates using the `make cert` command, you can run the project using the following command:

### `make run`

Runs the project with the configured settings:

You can configure the port for the project by editing the `/config/config.yaml` file. Simply update the `port` field with the desired port number.

📕 Features included

- [Operations](docs/project/features/operations/Intro.md)
- [Sync](docs/project/features/sync/Intro.md)

## 👾 [Config Package Overview](docs/project/config/Into.md)

The `config` package is responsible for loading and parsing the configuration for the application from a YAML file. It uses the `viper` package to read configuration files, environment variables, and provide the configuration to the application.
For detailed information on the `Config` package, please refer to the Config Package Overview .

## 👾 [Kafka and Event-Driven Architecture](docs/project/pkg/kafka/Intro.md)

This project leverages **Kafka** as the core messaging system to implement an **event-driven architecture**. Kafka is a distributed streaming platform that allows for reliable message streaming, real-time processing, and asynchronous communication between services. It plays a critical role in decoupling various microservices, allowing them to communicate effectively without directly depending on each other.

## 👾 [Retry Mechanism for Go Microservices](docs/project/pkg/retry/Intro.md)

This project includes a built-in retry mechanism that allows you to execute operations multiple times with configurable delay, retry limits, and exponential backoff.

## 👾 [Dependency injection with google wire](docs/project/pkg/injector/Intro.md)

This project includes a dependency injection package that allows you to manage dependencies in a structured and type-safe way at compile time, unlike traditional runtime dependency injection frameworks