# Retry Mechanism for Go Microservices

This project includes a built-in retry mechanism that allows you to execute operations multiple times with configurable delay, retry limits, and exponential backoff.

---

## Features

- **Configurable maximum retries**
- **Initial delay and exponential backoff support**
- **Customizable maximum delay between retries**
- **Retry only on specific errors if needed**
- **Simple integration with any function that returns an error**

---

## How to Use the Retry Mechanism

### Example Usage

You can use the retry mechanism to execute any operation that might fail and retry it with a specific configuration.

---

## Configuration Options

The retry mechanism is fully customizable. Here are the available configuration options:

| Option          | Description                        | Default Value |
| --------------- | ---------------------------------- | ------------- |
| `MaxRetries`    | Maximum number of retries          | `3`           |
| `InitialDelay`  | Delay before the first retry       | `500ms`       |
| `BackoffFactor` | Multiplier for exponential backoff | `2.0`         |
| `MaxDelay`      | Maximum delay between retries      | `5s`          |

---

## Advanced Usage

### Custom Retryable Errors

You can specify which errors should trigger a retry by adding them to the `RetryableErrors` list.

### Exponential Backoff with Custom Max Delay

You can modify the backoff factor and set a custom maximum delay to control how quickly retries are performed.
