# MangoMatch 🔍

<p align="center">
  <img src="./assets/mangomatch-logo.png" alt="MangoMatch Logo" width="300">
</p>

[![Go Reference](https://pkg.go.dev/badge/github.com/The-iyed/mangomatch.svg)](https://pkg.go.dev/github.com/The-iyed/mangomatch/pkg/mangomatch)
[![Go Report Card](https://goreportcard.com/badge/github.com/The-iyed/mangomatch)](https://goreportcard.com/report/github.com/The-iyed/mangomatch)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Coverage Status](https://coveralls.io/repos/github/The-iyed/mangomatch/badge.svg?branch=main)](https://coveralls.io/github/The-iyed/mangomatch?branch=main)
[![GitHub Stars](https://img.shields.io/github/stars/The-iyed/mangomatch.svg)](https://github.com/The-iyed/mangomatch/stargazers)
[![Go Version](https://img.shields.io/github/go-mod/go-version/The-iyed/mangomatch.svg)](https://github.com/The-iyed/mangomatch/blob/main/go.mod)

MangoMatch is a lightweight, high-performance Go package that provides MongoDB-style query matching for in-memory Go objects. It allows you to use the familiar MongoDB query syntax to filter and search through Go maps and slices without a database.

## 📑 Table of Contents

- [Features](#-features)
- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [Data Types & Use Cases](#-data-types--use-cases)
  - [Data Format Support](#data-format-support)
  - [Quick Reference](#quick-reference)
  - [Working with Maps](#working-with-maps)
  - [Working with Structs](#working-with-structs)
  - [Working with BSON](#working-with-bson)
  - [Multiple Data Sources](#multiple-data-sources)
- [Usage Examples](#-usage-examples)
- [Using with BSON and MongoDB](#-using-with-bson-and-mongodb)
- [Core Functions](#-core-functions)
  - [Match](#match)
  - [ConvertBSON](#convertbson)
  - [MatchBSON](#matchbson)
  - [StructToBsonMap](#structtobsonmap)
  - [MapBSON](#mapbson)
- [Complete API Reference](#-complete-api-reference)
- [Data Flow Diagram](#-data-flow-diagram)
- [Complete BSON Integration Example](#-complete-bson-integration-example)
- [Performance](#-performance)
- [Comparison with Alternatives](#-comparison-with-alternatives)
- [Testing](#-testing)
- [Use Cases](#-use-cases)
- [Integration Scenarios](#-integration-scenarios)
  - [API Filtering](#api-filtering)
  - [Database Caching](#database-caching)
  - [Event Processing](#event-processing)
  - [GraphQL Resolvers](#graphql-resolvers)
- [FAQ](#-frequently-asked-questions)
- [Contributing](#-contributing)
- [Roadmap](#-roadmap)
- [License](#-license)
- [Author](#-author)
- [Acknowledgments](#-acknowledgments)

## 🌟 Features

- **MongoDB-style Query Evaluation**: Evaluate MongoDB queries against in-memory Go objects
- **Zero Dependencies**: Uses only Go's standard library for maximum compatibility (MongoDB driver is optional)
- **High Performance**: Optimized for speed and low memory usage
- **Type Safety**: Proper type handling across different Go types
- **Native BSON Support**: Direct compatibility with MongoDB's BSON documents using the optional MongoDB driver
- **Struct Support**: Built-in functions to convert Go structs to compatible maps
- **Comprehensive Operator Support**:
  - **Comparison**: `$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`
  - **Array**: `$in`, `$nin`, `$all`, `$size`, `$elemMatch`
  - **Logical**: `$and`, `$or`, `$nor`, `$not`
  - **Existence**: `$exists`
  - **Text**: `$regex`
  - **Element**: `$type`
  - **Evaluation**: `$mod`
- **Deeply Nested Document Support**: Query nested fields using dot notation
- **Array Field Support**: Match on array elements, including arrays of objects
- **Extensively Tested**: Comprehensive test suite with 220+ test cases ensuring reliability and correctness

## 📦 Installation

```bash
go get github.com/The-iyed/mangomatch/pkg/mangomatch
```

Make sure you have Go installed (Go 1.18+ recommended). MangoMatch has no external dependencies.

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

## 📊 Data Types & Use Cases

MangoMatch is designed to work with different data types and scenarios. Here's how to use it in various contexts:

### Data Format Support

| Data Format | Support | Conversion Required |
|-------------|---------|---------------------|
| Go Maps (`map[string]interface{}`) | ✅ Direct | None - Native support |
| Go Structs | ✅ Supported | Convert to map via `StructToBsonMap` or JSON marshal/unmarshal |
| BSON Documents (`bson.M`, `bson.D`) | ✅ Supported | Use `ConvertBSON` or `MatchBSON` |
| JSON String | ✅ Supported | Unmarshal to `map[string]interface{}` |
| MongoDB Results | ✅ Supported | Direct with `MatchBSON` or convert with `ConvertBSON` |
| Custom Types | ✅ Supported | Implement conversion to `map[string]interface{}` |

### Quick Reference

```go
// Basic matching with maps
result := mangomatch.Match(query, document)

// Working with BSON
result := mangomatch.MatchBSON(bsonQuery, bsonDocument)

// Converting BSON to maps
goMap := mangomatch.ConvertBSON(bsonDoc).(map[string]interface{})

// Converting maps to BSON
bsonDoc := mangomatch.MapBSON(goMap)

// Converting structs to maps (requires MongoDB driver)
structMap, err := mangomatch.StructToBsonMap(myStruct)
```

### Working with Maps

The most straightforward way to use MangoMatch is with Go maps:

```go
package main

import (
	"fmt"
	"github.com/The-iyed/mangomatch/pkg/mangomatch"
)

func main() {
	// Data as a map
	user := map[string]interface{}{
		"name": "Jane Smith",
		"age":  28,
		"skills": []interface{}{
			"Go", "Python", "JavaScript",
		},
		"contact": map[string]interface{}{
			"email": "jane@example.com",
			"phone": "555-1234",
		},
	}

	// Query
	query := map[string]interface{}{
		"age": map[string]interface{}{
			"$gt": 25,
		},
		"skills": "Go",
	}

	// Match
	if mangomatch.Match(query, user) {
		fmt.Println("User matches the criteria")
	}
}
```

### Working with Structs

MangoMatch can also work with Go structs after converting them to maps:

```go
package main

import (
	"fmt"
	"github.com/The-iyed/mangomatch/pkg/mangomatch"
)

// User represents a user in the system
type User struct {
	Name    string   `json:"name"`
	Age     int      `json:"age"`
	Skills  []string `json:"skills"`
	Contact Contact  `json:"contact"`
}

// Contact information
type Contact struct {
	Email string `json:"email"`
	Phone string `json:"phone"`
}

func main() {
	// Create a struct
	user := User{
		Name: "Jane Smith",
		Age:  28,
		Skills: []string{
			"Go", "Python", "JavaScript",
		},
		Contact: Contact{
			Email: "jane@example.com",
			Phone: "555-1234",
		},
	}

	// Query
	query := map[string]interface{}{
		"age": map[string]interface{}{
			"$gt": 25,
		},
		"skills": "Go",
	}

	// Convert struct to map using StructToBsonMap
	// Note: This requires the MongoDB driver
	userMap, err := mangomatch.StructToBsonMap(user)
	if err != nil {
		fmt.Println("Error:", err)
		return
	}

	// Match
	if mangomatch.Match(query, userMap) {
		fmt.Println("User matches the criteria")
	}
}
```

The `StructToBsonMap` function uses MongoDB's BSON marshaling to properly convert Go structs to maps, preserving all field tags and handling special types correctly:

```go
// StructToBsonMap converts a Go struct to a map[string]interface{} 
// using MongoDB's BSON marshaling
func StructToBsonMap(data interface{}) (map[string]interface{}, error) {
	bsonBytes, err := bson.Marshal(data)
	if err != nil {
		return nil, err
	}
	var out map[string]interface{}
	err = bson.Unmarshal(bsonBytes, &out)
	return out, err
}
```

Alternatively, you can use encoding/json to convert structs to maps:

```go
package main

import (
	"encoding/json"
	"fmt"
	"github.com/The-iyed/mangomatch/pkg/mangomatch"
)

// User represents a user in the system
type User struct {
	Name    string   `json:"name"`
	Age     int      `json:"age"`
	Skills  []string `json:"skills"`
	Contact Contact  `json:"contact"`
}

// Contact information
type Contact struct {
	Email string `json:"email"`
	Phone string `json:"phone"`
}

func main() {
	// Create a struct
	user := User{
		Name: "Jane Smith",
		Age:  28,
		Skills: []string{
			"Go", "Python", "JavaScript",
		},
		Contact: Contact{
			Email: "jane@example.com",
			Phone: "555-1234",
		},
	}

	// Convert struct to map using JSON marshaling
	jsonBytes, _ := json.Marshal(user)
	var userMap map[string]interface{}
	json.Unmarshal(jsonBytes, &userMap)

	// Query
	query := map[string]interface{}{
		"age": map[string]interface{}{
			"$gt": 25,
		},
		"skills": "Go",
	}

	// Match
	if mangomatch.Match(query, userMap) {
		fmt.Println("User matches the criteria")
	}
}
```

### Working with BSON

MangoMatch provides built-in support for MongoDB BSON documents:

```go
package main

import (
	"fmt"
	"github.com/The-iyed/mangomatch/pkg/mangomatch"
	"go.mongodb.org/mongo-driver/bson"
)

func main() {
	// Data as BSON
	bsonUser := bson.M{
		"name": "Jane Smith",
		"age":  28,
		"skills": bson.A{"premium", "verified"},
		"contact": bson.M{
			"email": "jane@example.com",
			"phone": "555-1234",
		},
	}

	// Query as BSON
	bsonQuery := bson.M{
		"age": bson.M{"$gt": 25},
		"skills": "premium",
	}

	// Method 1: Use MatchBSON for direct matching
	result1 := mangomatch.MatchBSON(bsonQuery, bsonUser)
	fmt.Println("BSON direct match:", result1)

	// Method 2: Convert to Go types first
	goQuery := mangomatch.ConvertBSON(bsonQuery).(map[string]interface{})
	goData := mangomatch.ConvertBSON(bsonUser).(map[string]interface{})
	result2 := mangomatch.Match(goQuery, goData)
	fmt.Println("Converted match:", result2)

	// Method 3: Convert Go types to BSON
	goMap := map[string]interface{}{
		"age": map[string]interface{}{
			"$gt": 25,
		},
		"skills": "premium",
	}
	bsonFromGo := mangomatch.MapBSON(goMap)
	fmt.Printf("Go map converted to BSON type: %T\n", bsonFromGo)
}
```

### Multiple Data Sources

You can combine data from different sources and filter it with MangoMatch:

```go
package main

import (
	"encoding/json"
	"fmt"
	"github.com/The-iyed/mangomatch/pkg/mangomatch"
	"go.mongodb.org/mongo-driver/bson"
)

type User struct {
	ID     string   `json:"id"`
	Name   string   `json:"name"`
	Age    int      `json:"age"`
	Skills []string `json:"skills"`
}

func main() {
	// Data from different sources
	jsonData := `{"id":"user1","name":"John Doe","age":32,"skills":["Go","Java"]}`
	bsonData := bson.M{"id": "user2", "name": "Jane Smith", "age": 28, "skills": bson.A{"Go", "Python"}}
	structData := User{ID: "user3", Name: "Bob Johnson", Age: 35, Skills: []string{"C++", "Go"}}

	// Convert all to map[string]interface{}
	var jsonMap map[string]interface{}
	json.Unmarshal([]byte(jsonData), &jsonMap)

	bsonMap := mangomatch.ConvertBSON(bsonData).(map[string]interface{})

	structBytes, _ := json.Marshal(structData)
	var structMap map[string]interface{}
	json.Unmarshal(structBytes, &structMap)

	// Combine into a single slice
	allUsers := []map[string]interface{}{jsonMap, bsonMap, structMap}

	// Query for Go programmers over 30
	query := map[string]interface{}{
		"age": map[string]interface{}{"$gt": 30},
		"skills": "Go",
	}

	// Filter users
	var matchedUsers []map[string]interface{}
	for _, user := range allUsers {
		if mangomatch.Match(query, user) {
			matchedUsers = append(matchedUsers, user)
		}
	}

	// Print results
	fmt.Printf("Found %d matching users:\n", len(matchedUsers))
	for _, user := range matchedUsers {
		fmt.Printf("- %s (age: %v)\n", user["name"], user["age"])
	}
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

// Match documents where tags array contains all specified elements
query := map[string]interface{}{
	"tags": map[string]interface{}{
		"$all": []interface{}{"premium", "verified"},
	},
}

// Match documents where tags array has exactly 3 elements
query := map[string]interface{}{
	"tags": map[string]interface{}{
		"$size": 3,
	},
}

// Match documents where at least one element in the projects array matches all the criteria
query := map[string]interface{}{
	"projects": map[string]interface{}{
		"$elemMatch": map[string]interface{}{
			"status": "completed",
			"rating": map[string]interface{}{"$gte": 4},
		},
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

### Type Operator

```go
// Match documents where name is a string
query := map[string]interface{}{
	"name": map[string]interface{}{"$type": "string"},
}

// Match documents where age is a number
query := map[string]interface{}{
	"age": map[string]interface{}{"$type": "number"},
}

// Match documents where address is an object
query := map[string]interface{}{
	"address": map[string]interface{}{"$type": "object"},
}

// Match documents where tags is an array
query := map[string]interface{}{
	"tags": map[string]interface{}{"$type": "array"},
}

// Match documents where premium is a boolean
query := map[string]interface{}{
	"premium": map[string]interface{}{"$type": "boolean"},
}
```

### Modulo Operator

```go
// Match documents where age mod 5 equals 0 (age is divisible by 5)
query := map[string]interface{}{
	"age": map[string]interface{}{"$mod": []interface{}{5, 0}},
}

// Match documents where years mod 2 equals 1 (years is odd)
query := map[string]interface{}{
	"years": map[string]interface{}{"$mod": []interface{}{2, 1}},
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
// Complex query with multiple conditions and operators
query := map[string]interface{}{
	"$and": []interface{}{
		map[string]interface{}{"name": map[string]interface{}{"$regex": "^John", "$type": "string"}},
		map[string]interface{}{"age": map[string]interface{}{"$gte": 30, "$lte": 40, "$mod": []interface{}{5, 0}}},
		map[string]interface{}{
			"$or": []interface{}{
				map[string]interface{}{"work.years": map[string]interface{}{"$gt": 5}},
				map[string]interface{}{"premium": true},
			},
		},
		map[string]interface{}{"tags": map[string]interface{}{"$size": 3, "$all": []interface{}{"premium"}}},
		map[string]interface{}{"projects": map[string]interface{}{"$elemMatch": map[string]interface{}{
			"technologies": map[string]interface{}{"$all": []interface{}{"Go"}},
			"rating": map[string]interface{}{"$gte": 4},
		}}},
	},
}
```

### Practical Examples

#### User Filtering System

```go
// Filter active premium users over age 30
query := map[string]interface{}{
    "$and": []interface{}{
        map[string]interface{}{"status": "active"},
        map[string]interface{}{"subscription": "premium"},
        map[string]interface{}{"age": map[string]interface{}{"$gt": 30}},
    },
}

// Apply the filter to a list of users
filteredUsers := []map[string]interface{}{}
for _, user := range users {
    if mangomatch.Match(query, user) {
        filteredUsers = append(filteredUsers, user)
    }
}
```

#### Real-time Data Processing

```go
// Process only events with specific characteristics
eventFilter := map[string]interface{}{
    "$and": []interface{}{
        map[string]interface{}{"type": "transaction"},
        map[string]interface{}{"amount": map[string]interface{}{"$gte": 1000}},
        map[string]interface{}{"timestamp": map[string]interface{}{"$gt": time.Now().Add(-24 * time.Hour).Unix()}},
    },
}

// Process incoming events
for event := range eventStream {
    if mangomatch.Match(eventFilter, event) {
        // Process high-value recent transactions
        processHighValueTransaction(event)
    }
}
```

## 🔄 Using with BSON and MongoDB

MangoMatch works seamlessly with BSON documents retrieved from MongoDB. You can use it to perform additional filtering on data retrieved from MongoDB or to prepare and test queries before sending them to the database.

### Using the Built-in BSON Conversion Functions

MangoMatch provides two dedicated functions for working with BSON documents:

1. `ConvertBSON` - Converts BSON types to standard Go types
2. `MatchBSON` - A convenience function that directly matches BSON documents

```go
package main

import (
	"context"
	"fmt"
	"github.com/The-iyed/mangomatch/pkg/mangomatch"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func main() {
	// Create BSON documents and queries
	bsonDoc := bson.M{
		"name": "John Doe",
		"age": 35,
		"status": "active",
		"tags": bson.A{"premium", "verified"},
	}
	
	bsonQuery := bson.M{
		"age": bson.M{"$gt": 30},
		"tags": "premium",
	}
	
	// Method 1: Use ConvertBSON to convert BSON to Go types
	query := mangomatch.ConvertBSON(bsonQuery).(map[string]interface{})
	doc := mangomatch.ConvertBSON(bsonDoc).(map[string]interface{})
	result1 := mangomatch.Match(query, doc)
	
	// Method 2: Use MatchBSON for direct matching of BSON documents
	result2 := mangomatch.MatchBSON(bsonQuery, bsonDoc)
	
	fmt.Printf("Match result: %v\n", result1) // true
	fmt.Printf("MatchBSON result: %v\n", result2) // true
}
```

### Working with BSON Documents from MongoDB

```go
// Connect to MongoDB
client, err := mongo.Connect(context.Background(), options.Client().ApplyURI("mongodb://localhost:27017"))
if err != nil {
	panic(err)
}
defer client.Disconnect(context.Background())

// Get a collection
collection := client.Database("testdb").Collection("users")

// Retrieve documents from MongoDB (with minimal filtering)
cursor, err := collection.Find(context.Background(), bson.M{"active": true})
if err != nil {
	panic(err)
}
defer cursor.Close(context.Background())

// Complex filter that will be applied in-memory
complexFilter := map[string]interface{}{
	"$and": []interface{}{
		map[string]interface{}{
			"age": map[string]interface{}{"$gte": 25, "$lte": 40},
		},
		map[string]interface{}{
			"$or": []interface{}{
				map[string]interface{}{"subscription": "premium"},
				map[string]interface{}{"referrals": map[string]interface{}{"$gt": 5}},
			},
		},
	},
}

// Process documents with MangoMatch
var matchedUsers []bson.M
for cursor.Next(context.Background()) {
	var user bson.M
	if err := cursor.Decode(&user); err != nil {
		continue
	}
	
	// Apply complex filtering with MangoMatch
	if mangomatch.Match(complexFilter, user) {
		matchedUsers = append(matchedUsers, user)
	}
}

fmt.Printf("Found %d users matching complex criteria\n", len(matchedUsers))
```

### Converting Between BSON and Map

```go
// Converting BSON document to map[string]interface{}
func bsonToMap(doc bson.M) map[string]interface{} {
	// BSON documents (bson.M) are already map[string]interface{}, so no conversion needed
	return doc
}

// Converting map to BSON document for MongoDB queries
func mapToBSON(m map[string]interface{}) bson.M {
	// Convert your MangoMatch query to BSON
	bsonDoc := bson.M{}
	for k, v := range m {
		bsonDoc[k] = convertToBSONValue(v)
	}
	return bsonDoc
}

func convertToBSONValue(v interface{}) interface{} {
	switch val := v.(type) {
	case map[string]interface{}:
		return mapToBSON(val)
	case []interface{}:
		bsonArr := make([]interface{}, len(val))
		for i, arrVal := range val {
			bsonArr[i] = convertToBSONValue(arrVal)
		}
		return bsonArr
	default:
		return val
	}
}
```

### Benefits of Using MangoMatch with MongoDB

1. **Reduced Database Load**: Perform basic filtering in MongoDB and complex filtering with MangoMatch in your application
2. **Query Testing**: Test and debug queries locally before running them on the database
3. **Extended Functionality**: Use MangoMatch operators that might not be available in your MongoDB version
4. **Offline Processing**: Filter cached data when the database is not available
5. **Consistent Query Logic**: Use the same query syntax across both database and in-memory operations

### Performance Considerations

When working with MongoDB and MangoMatch together:

1. Use MongoDB queries for initial filtering on indexed fields
2. Use MangoMatch for complex secondary filtering that would be inefficient in the database
3. For large datasets, paginate MongoDB results before applying MangoMatch filters
4. Consider caching frequently accessed data for repeated MangoMatch operations

## 🚄 Performance

MangoMatch is designed with performance in mind, making it suitable for high-throughput applications.

### Benchmarks

The following benchmarks were run on a standard MacBook Pro (M1, 2021):

| Operation | Documents | Complexity | Execution Time |
|-----------|-----------|------------|---------------|
| Simple Query | 1,000 | Low | 0.15 ms |
| Complex Query | 1,000 | High | 0.65 ms |
| Simple Query | 100,000 | Low | 12.5 ms |
| Complex Query | 100,000 | High | 54.3 ms |

### Memory Usage

MangoMatch is optimized for low memory overhead:
- Zero allocations for simple equality matches
- Minimal allocations for complex queries
- No caching or state maintained between matches

## 🔄 Comparison with Alternatives

| Feature | MangoMatch | MongoDB | JSON Query Libs | Custom Filtering |
|---------|------------|---------|-----------------|------------------|
| MongoDB Query Syntax | ✅ Full | ✅ Full | ⚠️ Partial | ❌ No |
| Performance | ⚡ Fast | 🐢 Requires DB | ⚡ Varies | ⚡ Fast |
| Dependencies | 0️⃣ None | 🔌 DB Connection | ⚠️ Some | 0️⃣ None |
| Learning Curve | 📊 Low (if familiar with MongoDB) | 📚 Medium | 📈 Medium | 📉 High |
| Maintenance | 🛠️ Simple | 🏗️ Complex | 🔧 Medium | 🔨 Custom |

## 🧪 Testing

MangoMatch is thoroughly tested with over 220 test cases covering all operators and edge cases to ensure reliability and correctness.

Our test suite includes:
- Unit tests for all operators and features
- Comprehensive tests with 221 different query patterns
- Edge case tests for nested documents and array fields
- Validation tests for input handling
- Complex query tests combining multiple operators

Run all tests using the provided test script:

```bash
./test.sh
```

This will execute the full test suite and provide a summary of the results.

## 💡 Use Cases

- **In-memory Filtering**: Filter collections without querying a database
- **Caching Layers**: Implement caching with MongoDB-compatible queries
- **Search Functionality**: Build lightweight search features
- **Data Processing**: Create filters for data processing pipelines
- **Serverless Applications**: Implement MongoDB-like functionality without a database
- **Edge Computing**: Run complex queries on edge devices with limited resources
- **Real-time Systems**: Filter high-volume event streams with complex conditions

## 🔌 Integration Scenarios

### API Filtering

MangoMatch can be used to implement advanced filtering in REST APIs:

```go
func GetUsers(w http.ResponseWriter, r *http.Request) {
    // Parse filter from query string
    filterStr := r.URL.Query().Get("filter")
    var filter map[string]interface{}
    
    if filterStr != "" {
        // Parse the JSON filter
        err := json.Unmarshal([]byte(filterStr), &filter)
        if err != nil {
            http.Error(w, "Invalid filter format", http.StatusBadRequest)
            return
        }
    }
    
    // Get users from database or cache
    users := getUsersFromSource()
    
    // Apply filter
    var result []map[string]interface{}
    for _, user := range users {
        if filter == nil || mangomatch.Match(filter, user) {
            result = append(result, user)
        }
    }
    
    // Return filtered results
    json.NewEncoder(w).Encode(result)
}
```

### Database Caching

Use MangoMatch to query cached MongoDB data:

```go
func GetCachedData(query map[string]interface{}) ([]interface{}, error) {
    // Check if we have cached data
    cachedData, found := cache.Get("users")
    if !found {
        // Query database if not in cache
        client, err := mongo.Connect(context.Background(), options.Client().ApplyURI(mongoURI))
        if err != nil {
            return nil, err
        }
        defer client.Disconnect(context.Background())
        
        collection := client.Database("myapp").Collection("users")
        cursor, err := collection.Find(context.Background(), bson.M{})
        if err != nil {
            return nil, err
        }
        
        var users []map[string]interface{}
        if err = cursor.All(context.Background(), &users); err != nil {
            return nil, err
        }
        
        // Store in cache
        cache.Set("users", users, time.Minute*15)
        cachedData = users
    }
    
    // Cast to the right type
    docs := cachedData.([]map[string]interface{})
    
    // Apply MangoMatch filtering
    var results []interface{}
    for _, doc := range docs {
        if mangomatch.Match(query, doc) {
            results = append(results, doc)
        }
    }
    
    return results, nil
}
```

### Event Processing

Filter events in real-time data streams:

```go
func ProcessEvents(ctx context.Context, stream <-chan map[string]interface{}, filter map[string]interface{}) {
    for {
        select {
        case event := <-stream:
            // Apply filter to incoming events
            if mangomatch.Match(filter, event) {
                // Process matching events
                processEvent(event)
            }
        case <-ctx.Done():
            return
        }
    }
}
```

### GraphQL Resolvers

Implement complex filtering in GraphQL resolvers:

```go
func (r *queryResolver) FilteredUsers(ctx context.Context, filter string) ([]*User, error) {
    // Parse the filter
    var filterMap map[string]interface{}
    if err := json.Unmarshal([]byte(filter), &filterMap); err != nil {
        return nil, err
    }
    
    // Get all users
    allUsers := r.UsersStore.GetAll()
    
    // Apply filter
    var result []*User
    for _, user := range allUsers {
        // Convert struct to map
        userMap, err := mangomatch.StructToBsonMap(user)
        if err != nil {
            continue
        }
        
        // Apply filter
        if mangomatch.Match(filterMap, userMap) {
            result = append(result, user)
        }
    }
    
    return result, nil
}
```

## 🔄 Core Functions

MangoMatch provides the following core functions:

### Match

Evaluates a MongoDB-style query against a document (map[string]interface{}).

```go
func Match(query map[string]interface{}, document map[string]interface{}) bool
```

### ConvertBSON

Converts BSON types to compatible Go types.

```go
func ConvertBSON(val interface{}) interface{}
```

### MatchBSON

Matches a query against a BSON document (combines ConvertBSON and Match).

```go
func MatchBSON(query map[string]interface{}, document interface{}) bool
```

### StructToBsonMap

Converts Go structs to maps using BSON marshaling.

```go
func StructToBsonMap(data interface{}) (map[string]interface{}, error)
```

### MapBSON

Converts Go maps and other types to BSON types for MongoDB operations.

```go
func MapBSON(val interface{}) interface{}
```

## 🔍 Complete API Reference

| Function | Purpose | Input | Output |
|----------|---------|-------|--------|
| `Match` | Evaluate MongoDB-style query | `query map[string]interface{}`, `document map[string]interface{}` | `bool` |
| `ConvertBSON` | Convert BSON to Go types | `val interface{}` | `interface{}` |
| `MatchBSON` | Match against BSON document | `query map[string]interface{}`, `document interface{}` | `bool` |
| `StructToBsonMap` | Convert struct to map | `data interface{}` | `map[string]interface{}`, `error` |
| `MapBSON` | Convert Go to BSON types | `val interface{}` | `interface{}` |

## 📊 Data Flow Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│   MongoDB       │     │   MangoMatch    │     │   Application   │
│   Database      │────▶│   Functions     │────▶│   Logic         │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       ▲                       │
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                │
                  ┌─────────────────────────┐
                  │                         │
                  │   In-Memory Document    │
                  │   Collection            │
                  │                         │
                  └─────────────────────────┘
```

## 🔄 Complete BSON Integration Example

This example demonstrates all BSON-related functions working together:

```go
package main

import (
	"context"
	"fmt"
	"log"
	
	"github.com/The-iyed/mangomatch/pkg/mangomatch"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type User struct {
	Name     string   `bson:"name"`
	Age      int      `bson:"age"`
	Premium  bool     `bson:"premium"`
	Skills   []string `bson:"skills"`
	Address  Address  `bson:"address"`
}

type Address struct {
	City    string `bson:"city"`
	Country string `bson:"country"`
}

func main() {
	// 1. Connect to MongoDB
	client, err := mongo.Connect(context.Background(), options.Client().ApplyURI("mongodb://localhost:27017"))
	if err != nil {
		log.Fatal(err)
	}
	defer client.Disconnect(context.Background())
	
	collection := client.Database("testdb").Collection("users")
	
	// 2. Create a Go struct
	user := User{
		Name:    "John Doe",
		Age:     32,
		Premium: true,
		Skills:  []string{"Go", "MongoDB", "Docker"},
		Address: Address{
			City:    "San Francisco",
			Country: "USA",
		},
	}
	
	// 3. Convert struct to BSON document for MongoDB insertion
	bsonDoc := mangomatch.MapBSON(user)
	
	// 4. Insert into MongoDB
	_, err = collection.InsertOne(context.Background(), bsonDoc)
	if err != nil {
		log.Fatal(err)
	}
	
	// 5. Create a query as a Go map
	query := map[string]interface{}{
		"age": map[string]interface{}{"$gt": 30},
		"skills": "Go",
		"premium": true,
	}
	
	// 6. Convert query to BSON for MongoDB
	bsonQuery := mangomatch.MapBSON(query)
	
	// 7. Execute MongoDB query
	cursor, err := collection.Find(context.Background(), bsonQuery)
	if err != nil {
		log.Fatal(err)
	}
	defer cursor.Close(context.Background())
	
	// 8. Process results
	var results []bson.M
	if err = cursor.All(context.Background(), &results); err != nil {
		log.Fatal(err)
	}
	
	// 9. Convert BSON results to Go maps for MangoMatch processing
	for _, result := range results {
		// Convert BSON to Go types
		goDoc := mangomatch.ConvertBSON(result)
		
		// Use MangoMatch for additional in-memory filtering
		additionalQuery := map[string]interface{}{
			"address.city": "San Francisco",
		}
		
		// Direct matching with the converted document
		if mangomatch.Match(additionalQuery, goDoc.(map[string]interface{})) {
			fmt.Println("Match found with ConvertBSON and Match")
		}
		
		// Or use the convenience MatchBSON function
		if mangomatch.MatchBSON(additionalQuery, result) {
			fmt.Println("Match found with MatchBSON")
		}
		
		// Convert struct to map using StructToBsonMap
		newUser := User{
			Name: "Jane Smith",
			Age:  28,
			Skills: []string{"Go", "AWS"},
			Address: Address{
				City:    "New York",
				Country: "USA",
			},
		}
		
		userMap, err := mangomatch.StructToBsonMap(newUser)
		if err != nil {
			log.Fatal(err)
		}
		
		fmt.Printf("Converted struct: %+v\n", userMap)
	}
}
```

## 🔄 Frequently Asked Questions

### Is MangoMatch a database?
No, MangoMatch is not a database. It's a query matching library that allows you to use MongoDB-style queries against in-memory Go data structures.

### Can I use MangoMatch with MongoDB?
Yes! MangoMatch can be used alongside MongoDB to perform additional filtering on data retrieved from MongoDB, or to prepare queries before sending them to the database.

### Does MangoMatch support all MongoDB operators?
MangoMatch supports most common MongoDB query operators. Some advanced operators like geospatial queries are not yet supported.

### Is MangoMatch type-safe?
Yes, MangoMatch handles Go types appropriately during comparison operations, following the same type conversion rules as MongoDB.

### How does MangoMatch handle large datasets?
MangoMatch is designed to be memory-efficient, but for very large datasets, consider implementing pagination or streaming to process data in manageable chunks.

### Can I contribute new operators?
Absolutely! Contributions are welcome. Please check the contributing guidelines before submitting a pull request.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

We use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.

## 🗺️ Roadmap

- [ ] Add support for geospatial query operators
- [ ] Implement projection functionality
- [ ] Add support for array update operators
- [ ] Create builder API for constructing queries programmatically
- [ ] Add support for aggregation pipeline operations
- [ ] Improve performance for large datasets

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🧑‍💻 Author

- [Iyed Sebai](https://github.com/The-iyed) 

## 🙏 Acknowledgments

- Inspired by the elegant query system of MongoDB
- Thanks to all the contributors who have helped improve this project
- Special thanks to the Go community for their amazing support 