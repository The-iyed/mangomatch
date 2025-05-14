# MangoMatch 🔍

[![Go Reference](https://pkg.go.dev/badge/github.com/The-iyed/mangomatch.svg)](https://pkg.go.dev/github.com/The-iyed/mangomatch/pkg/mangomatch)
[![Go Report Card](https://goreportcard.com/badge/github.com/The-iyed/mangomatch)](https://goreportcard.com/report/github.com/The-iyed/mangomatch)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

MangoMatch is a lightweight, high-performance Go package that provides MongoDB-style query matching for in-memory Go objects. It allows you to use the familiar MongoDB query syntax to filter and search through Go maps and slices without a database.

## 🌟 Features

- **MongoDB-style Query Evaluation**: Evaluate MongoDB queries against in-memory Go objects
- **Zero Dependencies**: Uses only Go's standard library for maximum compatibility
- **Comprehensive Operator Support**:
  - **Comparison**: `$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`
  - **Array**: `$in`, `$nin`
  - **Logical**: `$and`, `$or`, `$nor`, `$not`
  - **Existence**: `$exists`
  - **Text**: `$regex`
- **Deeply Nested Document Support**: Query nested fields using dot notation
- **Array Field Support**: Match on array elements, including arrays of objects
- **Thoroughly Tested**: Comprehensive test suite with 30+ use cases

## 📦 Installation

```bash
go get github.com/The-iyed/mangomatch/pkg/mangomatch
```

## 🚀 Quick Start

```go
package main

import (
	"fmt"
	"github.com/The-iyed/mangomatch/pkg/mangomatch"
)

func main() {
	// Example document
	doc := map[string]interface{}{
		"name":    "John Doe",
		"age":     35,
		"status":  "active",
		"tags":    []interface{}{"premium", "verified"},
		"address": map[string]interface{}{
			"city":    "New York",
			"zip":     "10001",
			"country": "USA",
		},
		"verified": true,
	}

	// Simple comparison query
	query1 := map[string]interface{}{
		"age": map[string]interface{}{
			"$gt": 30,
		},
	}
	fmt.Println("Age > 30:", mangomatch.Match(query1, doc)) // true

	// Query with logical operators
	query2 := map[string]interface{}{
		"$and": []interface{}{
			map[string]interface{}{
				"age": map[string]interface{}{
					"$gte": 18,
				},
			},
			map[string]interface{}{
				"verified": true,
			},
		},
	}
	fmt.Println("Age >= 18 AND verified:", mangomatch.Match(query2, doc)) // true

	// Nested document query
	query3 := map[string]interface{}{
		"address.city": "New York",
	}
	fmt.Println("City is New York:", mangomatch.Match(query3, doc)) // true

	// Array element query
	query4 := map[string]interface{}{
		"tags": "premium",
	}
	fmt.Println("Has premium tag:", mangomatch.Match(query4, doc)) // true
}
```

## 📚 Usage Examples

### Basic Equality Match

```go
// Match documents where status is "active"
query := map[string]interface{}{"status": "active"}
```

### Comparison Operators

```go
// Match documents where age is greater than 30
query := map[string]interface{}{
	"age": map[string]interface{}{"$gt": 30},
}

// Match documents where age is between 25 and 40
query := map[string]interface{}{
	"age": map[string]interface{}{
		"$gte": 25,
		"$lte": 40,
	},
}
```

### Array Operators

```go
// Match documents where status is either "active" or "pending"
query := map[string]interface{}{
	"status": map[string]interface{}{
		"$in": []interface{}{"active", "pending"},
	},
}

// Match documents where status is not "inactive" or "suspended"
query := map[string]interface{}{
	"status": map[string]interface{}{
		"$nin": []interface{}{"inactive", "suspended"},
	},
}
```

### Logical Operators

```go
// Match documents where age >= 18 AND verified is true
query := map[string]interface{}{
	"$and": []interface{}{
		map[string]interface{}{"age": map[string]interface{}{"$gte": 18}},
		map[string]interface{}{"verified": true},
	},
}

// Match documents where age < 18 OR premium is true
query := map[string]interface{}{
	"$or": []interface{}{
		map[string]interface{}{"age": map[string]interface{}{"$lt": 18}},
		map[string]interface{}{"premium": true},
	},
}

// Match documents that DON'T match either condition
query := map[string]interface{}{
	"$nor": []interface{}{
		map[string]interface{}{"status": "inactive"},
		map[string]interface{}{"verified": false},
	},
}

// Match documents where age is NOT less than 18
query := map[string]interface{}{
	"age": map[string]interface{}{
		"$not": map[string]interface{}{"$lt": 18},
	},
}
```

### Existence Operators

```go
// Match documents where the email field exists
query := map[string]interface{}{
	"email": map[string]interface{}{"$exists": true},
}

// Match documents where the email field does not exist
query := map[string]interface{}{
	"email": map[string]interface{}{"$exists": false},
}
```

### Regex Operator

```go
// Match documents where email starts with "john"
query := map[string]interface{}{
	"email": map[string]interface{}{"$regex": "^john"},
}

// Match documents where email ends with "@example.com"
query := map[string]interface{}{
	"email": map[string]interface{}{"$regex": "@example\\.com$"},
}
```

### Nested Documents

```go
// Match documents where city is "New York"
query := map[string]interface{}{"address.city": "New York"}

// Match documents where location type is "Point"
query := map[string]interface{}{"address.location.type": "Point"}
```

### Array Elements

```go
// Match documents containing "premium" in the tags array
query := map[string]interface{}{"tags": "premium"}

// Match documents with a project named "Project A"
query := map[string]interface{}{"projects.name": "Project A"}
```

### Complex Queries

```go
// Complex query with multiple conditions
query := map[string]interface{}{
	"$and": []interface{}{
		map[string]interface{}{"name": map[string]interface{}{"$regex": "^John"}},
		map[string]interface{}{"age": map[string]interface{}{"$gte": 30, "$lte": 40}},
		map[string]interface{}{
			"$or": []interface{}{
				map[string]interface{}{"work.years": map[string]interface{}{"$gt": 5}},
				map[string]interface{}{"premium": true},
			},
		},
		map[string]interface{}{"address.city": "New York"},
	},
}
```

## 🧪 Testing

Run all tests using the provided test script:

```bash
./test.sh
```

This will execute both unit tests and comprehensive test cases, providing a summary of the results.

## 💡 Use Cases

- Filtering in-memory collections without querying a database
- Implementing caching layers with MongoDB-compatible queries
- Building lightweight search functionality
- Creating filters for data processing pipelines
- Implementing MongoDB-like functionality in serverless environments

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🧑‍💻 Author

- [Iyed Sebai](https://github.com/The-iyed) 