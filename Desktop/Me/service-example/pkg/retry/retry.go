package retry

import (
	"errors"
	"time"
)

type Config struct {
	MaxRetries      int
	InitialDelay    time.Duration
	BackoffFactor   float64
	MaxDelay        time.Duration
	RetryableErrors []error
}

func DefaultConfig() Config {
	return Config{
		MaxRetries:    3,
		InitialDelay:  500 * time.Millisecond,
		BackoffFactor: 2.0,
		MaxDelay:      5 * time.Second,
	}
}

func Retry(config Config, operation func() error) error {
	delay := config.InitialDelay

	for i := 0; i < config.MaxRetries; i++ {
		err := operation()
		if err == nil {
			return nil
		}

		if !isRetryableError(err, config.RetryableErrors) {
			return err
		}

		time.Sleep(delay)
		delay = time.Duration(float64(delay) * config.BackoffFactor)
		if delay > config.MaxDelay {
			delay = config.MaxDelay
		}
	}
	return errors.New("maximum retries exceeded")
}

func isRetryableError(err error, retryableErrors []error) bool {
	if len(retryableErrors) == 0 {
		return true
	}
	for _, retryableErr := range retryableErrors {
		if errors.Is(err, retryableErr) {
			return true
		}
	}
	return false
}
