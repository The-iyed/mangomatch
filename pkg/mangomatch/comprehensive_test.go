package mangomatch

import (
	"testing"
)

func TestComprehensive(t *testing.T) {
	// Create a comprehensive test document
	doc := createTestDocument()

	// Define 120 test cases
	testCases := []struct {
		name  string
		query map[string]interface{}
		want  bool
	}{
		// 1-10: Basic equality tests
		{name: "String equality match", query: map[string]interface{}{"name": "John Doe"}, want: true},
		{name: "String equality no match", query: map[string]interface{}{"name": "Jane Doe"}, want: false},
		{name: "Number equality match", query: map[string]interface{}{"age": 35}, want: true},
		{name: "Number equality no match", query: map[string]interface{}{"age": 40}, want: false},
		{name: "Boolean equality true match", query: map[string]interface{}{"premium": true}, want: true},
		{name: "Boolean equality false no match", query: map[string]interface{}{"premium": false}, want: false},
		{name: "Nested field equality match", query: map[string]interface{}{"address.city": "New York"}, want: true},
		{name: "Nested field equality no match", query: map[string]interface{}{"address.city": "Boston"}, want: false},
		{name: "Deep nested field equality match", query: map[string]interface{}{"address.location.type": "Point"}, want: true},
		{name: "Deep nested field equality no match", query: map[string]interface{}{"address.location.type": "Polygon"}, want: false},

		// 11-20: $eq operator tests
		{name: "$eq string match", query: map[string]interface{}{"name": map[string]interface{}{"$eq": "John Doe"}}, want: true},
		{name: "$eq string no match", query: map[string]interface{}{"name": map[string]interface{}{"$eq": "Jane Doe"}}, want: false},
		{name: "$eq number match", query: map[string]interface{}{"age": map[string]interface{}{"$eq": 35}}, want: true},
		{name: "$eq number no match", query: map[string]interface{}{"age": map[string]interface{}{"$eq": 40}}, want: false},
		{name: "$eq boolean match", query: map[string]interface{}{"premium": map[string]interface{}{"$eq": true}}, want: true},
		{name: "$eq boolean no match", query: map[string]interface{}{"premium": map[string]interface{}{"$eq": false}}, want: false},
		{name: "$eq nested field match", query: map[string]interface{}{"address.city": map[string]interface{}{"$eq": "New York"}}, want: true},
		{name: "$eq nested field no match", query: map[string]interface{}{"address.city": map[string]interface{}{"$eq": "Boston"}}, want: false},
		{name: "$eq array element match", query: map[string]interface{}{"tags": "premium"}, want: true},
		{name: "$eq array element no match", query: map[string]interface{}{"tags": "basic"}, want: false},

		// 21-30: $ne operator tests
		{name: "$ne string match", query: map[string]interface{}{"name": map[string]interface{}{"$ne": "Jane Doe"}}, want: true},
		{name: "$ne string no match", query: map[string]interface{}{"name": map[string]interface{}{"$ne": "John Doe"}}, want: false},
		{name: "$ne number match", query: map[string]interface{}{"age": map[string]interface{}{"$ne": 40}}, want: true},
		{name: "$ne number no match", query: map[string]interface{}{"age": map[string]interface{}{"$ne": 35}}, want: false},
		{name: "$ne boolean match", query: map[string]interface{}{"premium": map[string]interface{}{"$ne": false}}, want: true},
		{name: "$ne boolean no match", query: map[string]interface{}{"premium": map[string]interface{}{"$ne": true}}, want: false},
		{name: "$ne nested field match", query: map[string]interface{}{"address.city": map[string]interface{}{"$ne": "Boston"}}, want: true},
		{name: "$ne nested field no match", query: map[string]interface{}{"address.city": map[string]interface{}{"$ne": "New York"}}, want: false},
		{name: "$ne array element match", query: map[string]interface{}{"tags": map[string]interface{}{"$ne": "basic"}}, want: true},
		{name: "$ne array element different match", query: map[string]interface{}{"status": map[string]interface{}{"$ne": "inactive"}}, want: true},

		// 31-40: $gt operator tests
		{name: "$gt number match", query: map[string]interface{}{"age": map[string]interface{}{"$gt": 30}}, want: true},
		{name: "$gt number equal no match", query: map[string]interface{}{"age": map[string]interface{}{"$gt": 35}}, want: false},
		{name: "$gt number no match", query: map[string]interface{}{"age": map[string]interface{}{"$gt": 40}}, want: false},
		{name: "$gt string match", query: map[string]interface{}{"name": map[string]interface{}{"$gt": "Jane"}}, want: true},
		{name: "$gt string no match", query: map[string]interface{}{"name": map[string]interface{}{"$gt": "Zack"}}, want: false},
		{name: "$gt first coordinate match", query: map[string]interface{}{"address.location.coordinates.0": map[string]interface{}{"$gt": 40}}, want: true},
		{name: "$gt second coordinate match", query: map[string]interface{}{"address.location.coordinates.1": map[string]interface{}{"$gt": -75}}, want: true},
		{name: "$gt array value match", query: map[string]interface{}{"scores": map[string]interface{}{"$gt": 90}}, want: true},
		{name: "$gt nested array match", query: map[string]interface{}{"work.projects.rating": map[string]interface{}{"$gt": 4}}, want: true},
		{name: "$gt nested array no match", query: map[string]interface{}{"work.projects.rating": map[string]interface{}{"$gt": 5}}, want: false},

		// 41-50: $gte operator tests
		{name: "$gte number greater match", query: map[string]interface{}{"age": map[string]interface{}{"$gte": 30}}, want: true},
		{name: "$gte number equal match", query: map[string]interface{}{"age": map[string]interface{}{"$gte": 35}}, want: true},
		{name: "$gte number no match", query: map[string]interface{}{"age": map[string]interface{}{"$gte": 40}}, want: false},
		{name: "$gte string greater match", query: map[string]interface{}{"name": map[string]interface{}{"$gte": "Jane"}}, want: true},
		{name: "$gte string equal match", query: map[string]interface{}{"name": map[string]interface{}{"$gte": "John Doe"}}, want: true},
		{name: "$gte string no match", query: map[string]interface{}{"name": map[string]interface{}{"$gte": "Zack"}}, want: false},
		{name: "$gte first coordinate match", query: map[string]interface{}{"address.location.coordinates.0": map[string]interface{}{"$gte": 40}}, want: true},
		{name: "$gte second coordinate match", query: map[string]interface{}{"address.location.coordinates.1": map[string]interface{}{"$gte": -74.006}}, want: true},
		{name: "$gte array value match", query: map[string]interface{}{"scores": map[string]interface{}{"$gte": 85}}, want: true},
		{name: "$gte nested array match", query: map[string]interface{}{"work.projects.rating": map[string]interface{}{"$gte": 5}}, want: true},

		// 51-60: $lt operator tests
		{name: "$lt number match", query: map[string]interface{}{"age": map[string]interface{}{"$lt": 40}}, want: true},
		{name: "$lt number equal no match", query: map[string]interface{}{"age": map[string]interface{}{"$lt": 35}}, want: false},
		{name: "$lt number no match", query: map[string]interface{}{"age": map[string]interface{}{"$lt": 30}}, want: false},
		{name: "$lt string match", query: map[string]interface{}{"name": map[string]interface{}{"$lt": "Zack"}}, want: true},
		{name: "$lt string no match", query: map[string]interface{}{"name": map[string]interface{}{"$lt": "Jane"}}, want: false},
		{name: "$lt first coordinate match", query: map[string]interface{}{"address.location.coordinates.0": map[string]interface{}{"$lt": 41}}, want: true},
		{name: "$lt second coordinate match", query: map[string]interface{}{"address.location.coordinates.1": map[string]interface{}{"$lt": -74}}, want: true},
		{name: "$lt array value match", query: map[string]interface{}{"scores": map[string]interface{}{"$lt": 100}}, want: true},
		{name: "$lt nested array match", query: map[string]interface{}{"work.projects.rating": map[string]interface{}{"$lt": 6}}, want: true},
		{name: "$lt nested array no match", query: map[string]interface{}{"work.projects.rating": map[string]interface{}{"$lt": 4}}, want: false},

		// 61-70: $lte operator tests
		{name: "$lte number less match", query: map[string]interface{}{"age": map[string]interface{}{"$lte": 40}}, want: true},
		{name: "$lte number equal match", query: map[string]interface{}{"age": map[string]interface{}{"$lte": 35}}, want: true},
		{name: "$lte number no match", query: map[string]interface{}{"age": map[string]interface{}{"$lte": 30}}, want: false},
		{name: "$lte string less match", query: map[string]interface{}{"name": map[string]interface{}{"$lte": "Zack"}}, want: true},
		{name: "$lte string equal match", query: map[string]interface{}{"name": map[string]interface{}{"$lte": "John Doe"}}, want: true},
		{name: "$lte string no match", query: map[string]interface{}{"name": map[string]interface{}{"$lte": "Jane"}}, want: false},
		{name: "$lte first coordinate match", query: map[string]interface{}{"address.location.coordinates.0": map[string]interface{}{"$lte": 41}}, want: true},
		{name: "$lte second coordinate match", query: map[string]interface{}{"address.location.coordinates.1": map[string]interface{}{"$lte": -74}}, want: true},
		{name: "$lte array value match", query: map[string]interface{}{"scores": map[string]interface{}{"$lte": 94}}, want: true},
		{name: "$lte nested array match", query: map[string]interface{}{"work.projects.rating": map[string]interface{}{"$lte": 5}}, want: true},

		// 71-80: $in operator tests
		{name: "$in string match", query: map[string]interface{}{"status": map[string]interface{}{"$in": []interface{}{"active", "pending"}}}, want: true},
		{name: "$in string no match", query: map[string]interface{}{"status": map[string]interface{}{"$in": []interface{}{"inactive", "pending"}}}, want: false},
		{name: "$in number match", query: map[string]interface{}{"age": map[string]interface{}{"$in": []interface{}{30, 35, 40}}}, want: true},
		{name: "$in number no match", query: map[string]interface{}{"age": map[string]interface{}{"$in": []interface{}{30, 40}}}, want: false},
		{name: "$in array element match", query: map[string]interface{}{"tags": map[string]interface{}{"$in": []interface{}{"premium"}}}, want: true},
		{name: "$in array element no match", query: map[string]interface{}{"tags": map[string]interface{}{"$in": []interface{}{"basic"}}}, want: false},
		{name: "$in nested field match", query: map[string]interface{}{"address.city": map[string]interface{}{"$in": []interface{}{"New York", "Boston"}}}, want: true},
		{name: "$in nested field no match", query: map[string]interface{}{"address.city": map[string]interface{}{"$in": []interface{}{"Boston", "Chicago"}}}, want: false},
		{name: "$in nested array field match", query: map[string]interface{}{"work.projects.name": map[string]interface{}{"$in": []interface{}{"Project A"}}}, want: true},
		{name: "$in deeply nested field match", query: map[string]interface{}{"work.projects.technologies": map[string]interface{}{"$in": []interface{}{"Go"}}}, want: true},

		// 81-90: $nin operator tests
		{name: "$nin string match", query: map[string]interface{}{"status": map[string]interface{}{"$nin": []interface{}{"inactive", "pending"}}}, want: true},
		{name: "$nin string no match", query: map[string]interface{}{"status": map[string]interface{}{"$nin": []interface{}{"active", "pending"}}}, want: false},
		{name: "$nin number match", query: map[string]interface{}{"age": map[string]interface{}{"$nin": []interface{}{30, 40}}}, want: true},
		{name: "$nin number no match", query: map[string]interface{}{"age": map[string]interface{}{"$nin": []interface{}{30, 35, 40}}}, want: false},
		{name: "$nin array element match", query: map[string]interface{}{"tags": map[string]interface{}{"$nin": []interface{}{"basic"}}}, want: true},
		{name: "$nin array element different match", query: map[string]interface{}{"status": map[string]interface{}{"$nin": []interface{}{"inactive"}}}, want: true},
		{name: "$nin nested field match", query: map[string]interface{}{"address.city": map[string]interface{}{"$nin": []interface{}{"Boston", "Chicago"}}}, want: true},
		{name: "$nin nested field no match", query: map[string]interface{}{"address.city": map[string]interface{}{"$nin": []interface{}{"New York", "Boston"}}}, want: false},
		{name: "$nin nested array field match", query: map[string]interface{}{"work.projects.name": map[string]interface{}{"$nin": []interface{}{"Project X"}}}, want: true},
		{name: "$nin deeply nested field match", query: map[string]interface{}{"work.projects.technologies": map[string]interface{}{"$nin": []interface{}{"Ruby"}}}, want: true},

		// 91-100: $and operator tests
		{name: "$and basic match", query: map[string]interface{}{"$and": []interface{}{
			map[string]interface{}{"age": 35},
			map[string]interface{}{"status": "active"},
		}}, want: true},
		{name: "$and basic no match", query: map[string]interface{}{"$and": []interface{}{
			map[string]interface{}{"age": 35},
			map[string]interface{}{"status": "inactive"},
		}}, want: false},
		{name: "$and with operators match", query: map[string]interface{}{"$and": []interface{}{
			map[string]interface{}{"age": map[string]interface{}{"$gte": 30}},
			map[string]interface{}{"age": map[string]interface{}{"$lte": 40}},
		}}, want: true},
		{name: "$and with operators no match", query: map[string]interface{}{"$and": []interface{}{
			map[string]interface{}{"age": map[string]interface{}{"$gte": 30}},
			map[string]interface{}{"age": map[string]interface{}{"$lt": 35}},
		}}, want: false},
		{name: "$and with nested fields match", query: map[string]interface{}{"$and": []interface{}{
			map[string]interface{}{"status": "active"},
			map[string]interface{}{"address.city": "New York"},
		}}, want: true},
		{name: "$and mixed conditions match", query: map[string]interface{}{"$and": []interface{}{
			map[string]interface{}{"age": map[string]interface{}{"$gte": 30}},
			map[string]interface{}{"tags": "premium"},
			map[string]interface{}{"address.country": "USA"},
		}}, want: true},
		{name: "$and mixed conditions no match", query: map[string]interface{}{"$and": []interface{}{
			map[string]interface{}{"age": map[string]interface{}{"$gte": 30}},
			map[string]interface{}{"tags": "premium"},
			map[string]interface{}{"address.country": "Canada"},
		}}, want: false},
		{name: "$and with array match", query: map[string]interface{}{"$and": []interface{}{
			map[string]interface{}{"scores": map[string]interface{}{"$gte": 90}},
			map[string]interface{}{"tags": map[string]interface{}{"$in": []interface{}{"premium"}}},
		}}, want: true},
		{name: "$and with complex nested", query: map[string]interface{}{"$and": []interface{}{
			map[string]interface{}{"work.projects.name": "Project A"},
			map[string]interface{}{"work.projects.status": "completed"},
		}}, want: true},
		{name: "$and with multiple complex conditions", query: map[string]interface{}{"$and": []interface{}{
			map[string]interface{}{"name": map[string]interface{}{"$regex": "^John"}},
			map[string]interface{}{"age": map[string]interface{}{"$gte": 30, "$lte": 40}},
			map[string]interface{}{"address.city": "New York"},
			map[string]interface{}{"work.projects.rating": map[string]interface{}{"$gte": 4}},
		}}, want: true},

		// 101-110: $or operator tests
		{name: "$or basic match first", query: map[string]interface{}{"$or": []interface{}{
			map[string]interface{}{"age": 35},
			map[string]interface{}{"status": "inactive"},
		}}, want: true},
		{name: "$or basic match second", query: map[string]interface{}{"$or": []interface{}{
			map[string]interface{}{"age": 40},
			map[string]interface{}{"status": "active"},
		}}, want: true},
		{name: "$or basic no match", query: map[string]interface{}{"$or": []interface{}{
			map[string]interface{}{"age": 40},
			map[string]interface{}{"status": "inactive"},
		}}, want: false},
		{name: "$or with operators match", query: map[string]interface{}{"$or": []interface{}{
			map[string]interface{}{"age": map[string]interface{}{"$lt": 30}},
			map[string]interface{}{"age": map[string]interface{}{"$gt": 30}},
		}}, want: true},
		{name: "$or with operators no match", query: map[string]interface{}{"$or": []interface{}{
			map[string]interface{}{"age": map[string]interface{}{"$lt": 30}},
			map[string]interface{}{"age": map[string]interface{}{"$gt": 40}},
		}}, want: false},
		{name: "$or with nested fields match", query: map[string]interface{}{"$or": []interface{}{
			map[string]interface{}{"address.city": "Boston"},
			map[string]interface{}{"address.country": "USA"},
		}}, want: true},
		{name: "$or mixed conditions match", query: map[string]interface{}{"$or": []interface{}{
			map[string]interface{}{"age": map[string]interface{}{"$lt": 30}},
			map[string]interface{}{"tags": "premium"},
			map[string]interface{}{"address.country": "Canada"},
		}}, want: true},
		{name: "$or mixed conditions no match", query: map[string]interface{}{"$or": []interface{}{
			map[string]interface{}{"age": map[string]interface{}{"$lt": 30}},
			map[string]interface{}{"tags": "basic"},
			map[string]interface{}{"address.country": "Canada"},
		}}, want: false},
		{name: "$or with array match", query: map[string]interface{}{"$or": []interface{}{
			map[string]interface{}{"scores": map[string]interface{}{"$lt": 70}},
			map[string]interface{}{"scores": map[string]interface{}{"$gt": 90}},
		}}, want: true},
		{name: "$or with complex conditions", query: map[string]interface{}{"$or": []interface{}{
			map[string]interface{}{"work.projects.status": "planning"},
			map[string]interface{}{"work.projects.rating": map[string]interface{}{"$gte": 4}},
		}}, want: true},

		// 111-120: Mixed and complex queries
		{name: "$nor basic match", query: map[string]interface{}{"$nor": []interface{}{
			map[string]interface{}{"age": 40},
			map[string]interface{}{"status": "inactive"},
		}}, want: true},
		{name: "$nor basic no match", query: map[string]interface{}{"$nor": []interface{}{
			map[string]interface{}{"age": 35},
			map[string]interface{}{"status": "inactive"},
		}}, want: false},
		{name: "$not operator match", query: map[string]interface{}{"age": map[string]interface{}{
			"$not": map[string]interface{}{"$lt": 30},
		}}, want: true},
		{name: "$not operator no match", query: map[string]interface{}{"age": map[string]interface{}{
			"$not": map[string]interface{}{"$gte": 30},
		}}, want: false},
		{name: "$exists true match", query: map[string]interface{}{"premium": map[string]interface{}{"$exists": true}}, want: true},
		{name: "$exists false match", query: map[string]interface{}{"missing_field": map[string]interface{}{"$exists": false}}, want: true},
		{name: "$exists true no match", query: map[string]interface{}{"missing_field": map[string]interface{}{"$exists": true}}, want: false},
		{name: "$exists false no match", query: map[string]interface{}{"premium": map[string]interface{}{"$exists": false}}, want: false},
		{name: "$regex match", query: map[string]interface{}{"email": map[string]interface{}{"$regex": "^john\\.doe"}}, want: true},
		{name: "Super complex query", query: map[string]interface{}{
			"$and": []interface{}{
				map[string]interface{}{"name": map[string]interface{}{"$regex": "^J"}},
				map[string]interface{}{"$or": []interface{}{
					map[string]interface{}{"age": map[string]interface{}{"$gte": 30, "$lte": 40}},
					map[string]interface{}{"premium": true},
				}},
				map[string]interface{}{"$nor": []interface{}{
					map[string]interface{}{"status": "inactive"},
					map[string]interface{}{"address.country": map[string]interface{}{"$ne": "USA"}},
				}},
				map[string]interface{}{"tags": map[string]interface{}{"$in": []interface{}{"premium", "verified"}}},
				map[string]interface{}{"work.projects": map[string]interface{}{"$exists": true}},
			},
		}, want: true},
	}

	// Run all 120 test cases
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			if got := Match(tc.query, doc); got != tc.want {
				t.Errorf("Match() = %v, want %v", got, tc.want)
			}
		})
	}
}

func createTestDocument() map[string]interface{} {
	return map[string]interface{}{
		"name":    "John Doe",
		"age":     35,
		"status":  "active",
		"email":   "john.doe@example.com",
		"premium": true,
		"scores":  []interface{}{85, 92, 78, 94},
		"tags":    []interface{}{"premium", "verified", "developer"},
		"favorites": map[string]interface{}{
			"color":  "blue",
			"number": 7,
			"foods":  []interface{}{"pizza", "sushi", "pasta"},
		},
		"address": map[string]interface{}{
			"street":  "123 Main St",
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
			"salary":   120000,
			"projects": []interface{}{
				map[string]interface{}{
					"name":         "Project A",
					"status":       "completed",
					"rating":       5,
					"technologies": []interface{}{"Go", "MongoDB", "Docker"},
				},
				map[string]interface{}{
					"name":         "Project B",
					"status":       "in-progress",
					"rating":       4,
					"technologies": []interface{}{"JavaScript", "React", "Node.js"},
				},
				map[string]interface{}{
					"name":         "Project C",
					"status":       "planning",
					"rating":       0,
					"technologies": []interface{}{"Flutter", "Firebase"},
				},
			},
		},
	}
}
