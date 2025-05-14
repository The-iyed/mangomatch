package main

import (
	"encoding/json"
	"fmt"

	"github.com/The-iyed/mangomatch/pkg/mangomatch"
)

func main() {
	// Test document
	doc := map[string]interface{}{
		"name":    "John Doe",
		"age":     35,
		"status":  "active",
		"email":   "john.doe@example.com",
		"premium": true,
		"scores":  []interface{}{85, 92, 78, 94},
		"tags":    []interface{}{"developer", "golang", "mongodb"},
		"favorites": map[string]interface{}{
			"color":  "blue",
			"number": 7,
			"foods":  []interface{}{"pizza", "sushi", "pasta"},
		},
		"address": map[string]interface{}{
			"city":    "New York",
			"state":   "NY",
			"zip":     "10001",
			"country": "USA",
			"location": map[string]interface{}{
				"type":        "Point",
				"coordinates": []interface{}{40.7128, -74.0060},
			},
		},
		"work": map[string]interface{}{
			"company":  "TechCorp",
			"position": "Senior Developer",
			"years":    8,
			"projects": []interface{}{
				map[string]interface{}{
					"name":   "Project A",
					"status": "completed",
					"rating": 5,
				},
				map[string]interface{}{
					"name":   "Project B",
					"status": "in-progress",
					"rating": 4,
				},
			},
		},
		"lastLogin": map[string]interface{}{
			"date":      "2023-05-01",
			"ipAddress": "192.168.1.1",
			"device":    "mobile",
		},
	}

	// Print the test document
	fmt.Println("Test Document:")
	prettyPrint(doc)
	fmt.Println("\n==========================================\n")

	// Define test cases
	testCases := []struct {
		name  string
		query map[string]interface{}
	}{
		// 1. Simple equality match
		{
			name:  "Simple equality match",
			query: map[string]interface{}{"name": "John Doe"},
		},
		// 2. Greater than operator
		{
			name:  "Greater than operator",
			query: map[string]interface{}{"age": map[string]interface{}{"$gt": 30}},
		},
		// 3. Less than operator
		{
			name:  "Less than operator",
			query: map[string]interface{}{"age": map[string]interface{}{"$lt": 40}},
		},
		// 4. $in operator with array
		{
			name:  "$in operator with array",
			query: map[string]interface{}{"status": map[string]interface{}{"$in": []interface{}{"active", "pending"}}},
		},
		// 5. $nin operator with array
		{
			name:  "$nin operator with array",
			query: map[string]interface{}{"status": map[string]interface{}{"$nin": []interface{}{"inactive", "suspended"}}},
		},
		// 6. Simple $and operator
		{
			name: "$and operator",
			query: map[string]interface{}{
				"$and": []interface{}{
					map[string]interface{}{"age": map[string]interface{}{"$gte": 30}},
					map[string]interface{}{"premium": true},
				},
			},
		},
		// 7. Simple $or operator
		{
			name: "$or operator",
			query: map[string]interface{}{
				"$or": []interface{}{
					map[string]interface{}{"age": map[string]interface{}{"$lt": 30}},
					map[string]interface{}{"premium": true},
				},
			},
		},
		// 8. $nor operator
		{
			name: "$nor operator",
			query: map[string]interface{}{
				"$nor": []interface{}{
					map[string]interface{}{"age": map[string]interface{}{"$lt": 30}},
					map[string]interface{}{"status": "inactive"},
				},
			},
		},
		// 9. $not operator
		{
			name:  "$not operator",
			query: map[string]interface{}{"age": map[string]interface{}{"$not": map[string]interface{}{"$lt": 30}}},
		},
		// 10. $exists operator (true)
		{
			name:  "$exists operator (true)",
			query: map[string]interface{}{"premium": map[string]interface{}{"$exists": true}},
		},
		// 11. $exists operator (false)
		{
			name:  "$exists operator (false)",
			query: map[string]interface{}{"missing_field": map[string]interface{}{"$exists": false}},
		},
		// 12. $regex operator
		{
			name:  "$regex operator",
			query: map[string]interface{}{"email": map[string]interface{}{"$regex": "^john"}},
		},
		// 13. Simple nested field query
		{
			name:  "Simple nested field query",
			query: map[string]interface{}{"address.city": "New York"},
		},
		// 14. Deep nested field query
		{
			name:  "Deep nested field query",
			query: map[string]interface{}{"address.location.type": "Point"},
		},
		// 15. Multiple conditions on same field
		{
			name: "Multiple conditions on same field",
			query: map[string]interface{}{
				"age": map[string]interface{}{
					"$gt": 30,
					"$lt": 40,
				},
			},
		},
		// 16. Combining $and with $or
		{
			name: "Combining $and with $or",
			query: map[string]interface{}{
				"$and": []interface{}{
					map[string]interface{}{
						"$or": []interface{}{
							map[string]interface{}{"age": map[string]interface{}{"$gt": 30}},
							map[string]interface{}{"premium": true},
						},
					},
					map[string]interface{}{"status": "active"},
				},
			},
		},
		// 17. Query on array element
		{
			name:  "Query on array element",
			query: map[string]interface{}{"scores": 92},
		},
		// 18. Complex nested array query
		{
			name:  "Complex nested array query",
			query: map[string]interface{}{"work.projects.name": "Project A"},
		},
		// 19. Query with $in on nested array
		{
			name:  "Query with $in on nested array",
			query: map[string]interface{}{"favorites.foods": map[string]interface{}{"$in": []interface{}{"pizza"}}},
		},
		// 20. Multiple field conditions with $and
		{
			name: "Multiple field conditions with $and",
			query: map[string]interface{}{
				"$and": []interface{}{
					map[string]interface{}{"age": map[string]interface{}{"$gte": 30}},
					map[string]interface{}{"status": "active"},
					map[string]interface{}{"address.country": "USA"},
				},
			},
		},
		// 21. Not equal operator
		{
			name:  "Not equal operator",
			query: map[string]interface{}{"status": map[string]interface{}{"$ne": "inactive"}},
		},
		// 22. Greater than or equal operator
		{
			name:  "Greater than or equal operator",
			query: map[string]interface{}{"work.years": map[string]interface{}{"$gte": 5}},
		},
		// 23. Less than or equal operator
		{
			name:  "Less than or equal operator",
			query: map[string]interface{}{"work.years": map[string]interface{}{"$lte": 10}},
		},
		// 24. Complex regex pattern
		{
			name:  "Complex regex pattern",
			query: map[string]interface{}{"email": map[string]interface{}{"$regex": ".*@example\\.com$"}},
		},
		// 25. Nested field with $in operator
		{
			name:  "Nested field with $in operator",
			query: map[string]interface{}{"address.state": map[string]interface{}{"$in": []interface{}{"NY", "CA"}}},
		},
		// 26. Multiple $or conditions
		{
			name: "Multiple $or conditions",
			query: map[string]interface{}{
				"$or": []interface{}{
					map[string]interface{}{"age": map[string]interface{}{"$lt": 30}},
					map[string]interface{}{"status": "inactive"},
					map[string]interface{}{"premium": true},
				},
			},
		},
		// 27. Combined $not with $in
		{
			name:  "Combined $not with $in",
			query: map[string]interface{}{"status": map[string]interface{}{"$not": map[string]interface{}{"$in": []interface{}{"inactive", "suspended"}}}},
		},
		// 28. Field comparison with nested objects
		{
			name:  "Field comparison with nested objects",
			query: map[string]interface{}{"work.projects.status": "completed"},
		},
		// 29. Deep nested $exists check
		{
			name:  "Deep nested $exists check",
			query: map[string]interface{}{"address.location.coordinates": map[string]interface{}{"$exists": true}},
		},
		// 30. Complex nested query with multiple operators
		{
			name: "Complex nested query with multiple operators",
			query: map[string]interface{}{
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
					map[string]interface{}{"favorites.color": map[string]interface{}{"$in": []interface{}{"blue", "green"}}},
				},
			},
		},
	}

	// Run tests
	for i, tc := range testCases {
		fmt.Printf("Test Case %d: %s\n", i+1, tc.name)
		fmt.Println("Query:")
		prettyPrint(tc.query)
		result := mangomatch.Match(tc.query, doc)
		fmt.Printf("Result: %v\n\n", result)
	}
}

// Helper function to pretty print maps
func prettyPrint(v interface{}) {
	b, _ := json.MarshalIndent(v, "", "  ")
	fmt.Println(string(b))
}
