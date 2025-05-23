package mangomatch

import (
	"testing"

	"go.mongodb.org/mongo-driver/bson"
)

func TestConvertBSON(t *testing.T) {
	bsonDoc := bson.M{
		"name":   "John Doe",
		"age":    30,
		"active": true,
		"tags":   bson.A{"premium", "verified"},
		"address": bson.M{
			"city":    "New York",
			"country": "USA",
		},
	}

	converted := ConvertBSON(bsonDoc)

	goMap, ok := converted.(map[string]interface{})
	if !ok {
		t.Fatalf("Expected map[string]interface{}, got %T", converted)
	}

	if goMap["name"] != "John Doe" {
		t.Errorf("Expected name to be 'John Doe', got %v", goMap["name"])
	}

	ageVal := goMap["age"]
	switch ageVal.(type) {
	case int, int32, int64, float64:
	default:
		t.Errorf("Expected age to be a numeric type, got %T", ageVal)
	}

	if goMap["active"] != true {
		t.Errorf("Expected active to be true, got %v", goMap["active"])
	}

	tags, ok := goMap["tags"].([]interface{})
	if !ok {
		t.Fatalf("Expected tags to be []interface{}, got %T", goMap["tags"])
	}
	if len(tags) != 2 {
		t.Errorf("Expected tags to have 2 elements, got %d", len(tags))
	}

	address, ok := goMap["address"].(map[string]interface{})
	if !ok {
		t.Fatalf("Expected address to be map[string]interface{}, got %T", goMap["address"])
	}
	if address["city"] != "New York" {
		t.Errorf("Expected city to be 'New York', got %v", address["city"])
	}
}

func TestMapBSON(t *testing.T) {
	goMap := map[string]interface{}{
		"name":   "John Doe",
		"age":    30,
		"active": true,
		"tags":   []interface{}{"premium", "verified"},
		"address": map[string]interface{}{
			"city":    "New York",
			"country": "USA",
		},
		"counts": []interface{}{1, 2, 3},
	}

	converted := MapBSON(goMap)

	bsonDoc, ok := converted.(bson.M)
	if !ok {
		t.Fatalf("Expected bson.M, got %T", converted)
	}

	if bsonDoc["name"] != "John Doe" {
		t.Errorf("Expected name to be 'John Doe', got %v", bsonDoc["name"])
	}

	if bsonDoc["age"] != 30 {
		t.Errorf("Expected age to be 30, got %v", bsonDoc["age"])
	}

	if bsonDoc["active"] != true {
		t.Errorf("Expected active to be true, got %v", bsonDoc["active"])
	}

	tags, ok := bsonDoc["tags"].(bson.A)
	if !ok {
		t.Fatalf("Expected tags to be bson.A, got %T", bsonDoc["tags"])
	}

	if len(tags) != 2 {
		t.Errorf("Expected tags to have 2 elements, got %d", len(tags))
	}

	address, ok := bsonDoc["address"].(bson.M)
	if !ok {
		t.Fatalf("Expected address to be bson.M, got %T", bsonDoc["address"])
	}

	if address["city"] != "New York" {
		t.Errorf("Expected city to be 'New York', got %v", address["city"])
	}

	counts, ok := bsonDoc["counts"].(bson.A)
	if !ok {
		t.Fatalf("Expected counts to be bson.A, got %T", bsonDoc["counts"])
	}

	if len(counts) != 3 {
		t.Errorf("Expected counts to have 3 elements, got %d", len(counts))
	}
}

func TestMatchBSON(t *testing.T) {
	bsonDoc := bson.M{
		"name":   "John Doe",
		"age":    30,
		"active": true,
		"tags":   bson.A{"premium", "verified"},
		"address": bson.M{
			"city":    "New York",
			"country": "USA",
		},
	}

	testCases := []struct {
		name     string
		query    interface{}
		expected bool
	}{
		{
			name:     "Simple equality",
			query:    bson.M{"name": "John Doe"},
			expected: true,
		},
		{
			name:     "Comparison operator",
			query:    bson.M{"age": bson.M{"$gt": 25}},
			expected: true,
		},
		{
			name:     "Nested field",
			query:    bson.M{"address.city": "New York"},
			expected: true,
		},
		{
			name:     "Array element",
			query:    bson.M{"tags": "premium"},
			expected: true,
		},
		{
			name:     "Logical operator",
			query:    bson.M{"$and": bson.A{bson.M{"age": bson.M{"$gte": 30}}, bson.M{"active": true}}},
			expected: true,
		},
		{
			name:     "Non-matching query",
			query:    bson.M{"name": "Jane Doe"},
			expected: false,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result := MatchBSON(tc.query, bsonDoc)
			if result != tc.expected {
				t.Errorf("Expected %v, got %v for query %v", tc.expected, result, tc.query)
			}
		})
	}
}
