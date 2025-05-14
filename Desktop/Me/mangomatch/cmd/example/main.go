package main

import (
	"encoding/json"
	"fmt"

	"github.com/The-iyed/mangomatch/pkg/mangomatch"
)

func main() {
	// Example document
	doc := map[string]interface{}{
		"name":   "John Doe",
		"age":    35,
		"status": "active",
		"tags":   []string{"premium", "verified"},
		"scores": []int{85, 92, 78},
		"address": map[string]interface{}{
			"city":    "New York",
			"zip":     "10001",
			"country": "USA",
		},
		"verified": true,
	}

	// Display the document we're querying against
	fmt.Println("Document:")
	prettyPrint(doc)
	fmt.Println()

	// Example queries
	queries := []map[string]interface{}{
		// Simple comparison
		{"age": map[string]interface{}{"$gt": 30}},

		// $in operator
		{"status": map[string]interface{}{"$in": []interface{}{"active", "pending"}}},

		// Logical $and operator
		{
			"$and": []interface{}{
				map[string]interface{}{"age": map[string]interface{}{"$gte": 18}},
				map[string]interface{}{"verified": true},
			},
		},

		// Nested field query
		{"address.city": "New York"},

				{"premium": map[string]interface{}{"$exists": false}},

		// $regex operator
		{"name": map[string]interface{}{"$regex": "^John"}},
	}


	for i, query := range queries {
		fmt.Printf("Query %d: ", i+1)
		prettyPrint(query)
		result := mangomatch.Match(query, doc)
		fmt.Printf("Result: %v\n\n", result)
	}
}


func prettyPrint(v interface{}) {
	b, _ := json.MarshalIndent(v, "", "  ")
	fmt.Println(string(b))
}
