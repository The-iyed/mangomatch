package mangomatch

import (
	"testing"
)

func TestComprehensive(t *testing.T) {
	// Create a comprehensive test document
	doc := createTestDocument()

	// Define 220 test cases
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
		// 121-130: $size operator tests
		{name: "$size exact match for array length", query: map[string]interface{}{"scores": map[string]interface{}{"$size": 4}}, want: true},
		{name: "$size no match for array length", query: map[string]interface{}{"scores": map[string]interface{}{"$size": 3}}, want: false},
		{name: "$size on empty array", query: map[string]interface{}{"favorites.empty": map[string]interface{}{"$size": 0}}, want: true},
		{name: "$size on nested array field", query: map[string]interface{}{"favorites.foods": map[string]interface{}{"$size": 3}}, want: true},
		{name: "$size on deep nested array field", query: map[string]interface{}{"work.projects.technologies": map[string]interface{}{"$size": 3}}, want: true},
		{name: "$size combined with $gt", query: map[string]interface{}{"$and": []interface{}{
			map[string]interface{}{"scores": map[string]interface{}{"$size": 4}},
			map[string]interface{}{"scores": map[string]interface{}{"$gt": 80}},
		}}, want: true},
		{name: "$size combined with $lt", query: map[string]interface{}{"$and": []interface{}{
			map[string]interface{}{"favorites.foods": map[string]interface{}{"$size": 3}},
			map[string]interface{}{"favorites.foods": map[string]interface{}{"$in": []interface{}{"pizza"}}},
		}}, want: true},
		{name: "$size with object field type mismatch", query: map[string]interface{}{"address": map[string]interface{}{"$size": 5}}, want: false},
		{name: "$size with primitive field type mismatch", query: map[string]interface{}{"age": map[string]interface{}{"$size": 2}}, want: false},
		{name: "$size with non-existent field", query: map[string]interface{}{"nonexistent": map[string]interface{}{"$size": 2}}, want: false},
		// 131-140: $all operator tests
		{name: "$all match all elements in array", query: map[string]interface{}{"tags": map[string]interface{}{"$all": []interface{}{"premium", "verified"}}}, want: true},
		{name: "$all no match missing element", query: map[string]interface{}{"tags": map[string]interface{}{"$all": []interface{}{"premium", "nonexistent"}}}, want: false},
		{name: "$all match single element", query: map[string]interface{}{"tags": map[string]interface{}{"$all": []interface{}{"developer"}}}, want: true},
		{name: "$all match entire array", query: map[string]interface{}{"tags": map[string]interface{}{"$all": []interface{}{"premium", "verified", "developer"}}}, want: true},
		{name: "$all match nested array", query: map[string]interface{}{"favorites.foods": map[string]interface{}{"$all": []interface{}{"pizza", "sushi"}}}, want: true},
		{name: "$all match deep nested array", query: map[string]interface{}{"work.projects.technologies": map[string]interface{}{"$all": []interface{}{"Go"}}}, want: true},
		{name: "$all with primitive field type mismatch", query: map[string]interface{}{"age": map[string]interface{}{"$all": []interface{}{35}}}, want: false},
		{name: "$all with object field type mismatch", query: map[string]interface{}{"address": map[string]interface{}{"$all": []interface{}{"New York"}}}, want: false},
		{name: "$all with empty array query", query: map[string]interface{}{"tags": map[string]interface{}{"$all": []interface{}{}}}, want: true},
		{name: "$all with non-existent field", query: map[string]interface{}{"nonexistent": map[string]interface{}{"$all": []interface{}{"value"}}}, want: false},
		// 141-150: $elemMatch operator tests
		{name: "$elemMatch with exact matching", query: map[string]interface{}{"work.projects": map[string]interface{}{"$elemMatch": map[string]interface{}{
			"name":   "Project A",
			"status": "completed",
		}}}, want: true},
		{name: "$elemMatch with no matching element", query: map[string]interface{}{"work.projects": map[string]interface{}{"$elemMatch": map[string]interface{}{
			"name":   "Project A",
			"status": "planning",
		}}}, want: false},
		{name: "$elemMatch with operator in criteria", query: map[string]interface{}{"work.projects": map[string]interface{}{"$elemMatch": map[string]interface{}{
			"rating": map[string]interface{}{"$gt": 4},
		}}}, want: true},
		{name: "$elemMatch with multiple operators", query: map[string]interface{}{"work.projects": map[string]interface{}{"$elemMatch": map[string]interface{}{
			"rating": map[string]interface{}{"$gte": 4, "$lt": 6},
		}}}, want: true},
		{name: "$elemMatch with array field", query: map[string]interface{}{"work.projects": map[string]interface{}{"$elemMatch": map[string]interface{}{
			"technologies": "Go",
		}}}, want: true},
		{name: "$elemMatch with nested array field", query: map[string]interface{}{"work.projects": map[string]interface{}{"$elemMatch": map[string]interface{}{
			"technologies": map[string]interface{}{"$in": []interface{}{"Go", "MongoDB"}},
		}}}, want: true},
		{name: "$elemMatch with primitive array", query: map[string]interface{}{"scores": map[string]interface{}{"$elemMatch": map[string]interface{}{
			"$gt": 90,
		}}}, want: true},
		{name: "$elemMatch with no match in primitive array", query: map[string]interface{}{"scores": map[string]interface{}{"$elemMatch": map[string]interface{}{
			"$gt": 100,
		}}}, want: false},
		{name: "$elemMatch with wrong field type", query: map[string]interface{}{"name": map[string]interface{}{"$elemMatch": map[string]interface{}{
			"$eq": "John",
		}}}, want: false},
		{name: "$elemMatch with non-existent field", query: map[string]interface{}{"nonexistent": map[string]interface{}{"$elemMatch": map[string]interface{}{
			"field": "value",
		}}}, want: false},
		// 151-160: $type operator tests
		{name: "$type string match", query: map[string]interface{}{"name": map[string]interface{}{"$type": "string"}}, want: true},
		{name: "$type string no match", query: map[string]interface{}{"age": map[string]interface{}{"$type": "string"}}, want: false},
		{name: "$type number match", query: map[string]interface{}{"age": map[string]interface{}{"$type": "number"}}, want: true},
		{name: "$type number no match", query: map[string]interface{}{"name": map[string]interface{}{"$type": "number"}}, want: false},
		{name: "$type boolean match", query: map[string]interface{}{"premium": map[string]interface{}{"$type": "boolean"}}, want: true},
		{name: "$type boolean no match", query: map[string]interface{}{"name": map[string]interface{}{"$type": "boolean"}}, want: false},
		{name: "$type object match", query: map[string]interface{}{"address": map[string]interface{}{"$type": "object"}}, want: true},
		{name: "$type object no match", query: map[string]interface{}{"name": map[string]interface{}{"$type": "object"}}, want: false},
		{name: "$type array match", query: map[string]interface{}{"scores": map[string]interface{}{"$type": "array"}}, want: true},
		{name: "$type array no match", query: map[string]interface{}{"name": map[string]interface{}{"$type": "array"}}, want: false},
		// 161-170: $mod operator tests
		{name: "$mod match divisible value", query: map[string]interface{}{"age": map[string]interface{}{"$mod": []interface{}{5, 0}}}, want: true},
		{name: "$mod match with remainder", query: map[string]interface{}{"age": map[string]interface{}{"$mod": []interface{}{3, 2}}}, want: true},
		{name: "$mod no match with wrong remainder", query: map[string]interface{}{"age": map[string]interface{}{"$mod": []interface{}{3, 1}}}, want: false},
		{name: "$mod match nested field", query: map[string]interface{}{"work.years": map[string]interface{}{"$mod": []interface{}{4, 0}}}, want: true},
		{name: "$mod no match nested field", query: map[string]interface{}{"work.years": map[string]interface{}{"$mod": []interface{}{5, 0}}}, want: false},
		{name: "$mod array element match", query: map[string]interface{}{"scores": map[string]interface{}{"$mod": []interface{}{2, 1}}}, want: true},
		{name: "$mod array element no match", query: map[string]interface{}{"scores": map[string]interface{}{"$mod": []interface{}{11, 10}}}, want: false},
		{name: "$mod with string field type mismatch", query: map[string]interface{}{"name": map[string]interface{}{"$mod": []interface{}{5, 0}}}, want: false},
		{name: "$mod with object field type mismatch", query: map[string]interface{}{"address": map[string]interface{}{"$mod": []interface{}{5, 0}}}, want: false},
		{name: "$mod with non-existent field", query: map[string]interface{}{"nonexistent": map[string]interface{}{"$mod": []interface{}{5, 0}}}, want: false},
		// 171-180: Combined new operators tests
		{name: "$size and $all combined", query: map[string]interface{}{"tags": map[string]interface{}{
			"$size": 3,
			"$all":  []interface{}{"premium", "verified"},
		}}, want: true},
		{name: "$type and $size combined", query: map[string]interface{}{"scores": map[string]interface{}{
			"$type": "array",
			"$size": 4,
		}}, want: true},
		{name: "$all and $elemMatch logical combination", query: map[string]interface{}{"$and": []interface{}{
			map[string]interface{}{"tags": map[string]interface{}{"$all": []interface{}{"premium"}}},
			map[string]interface{}{"work.projects": map[string]interface{}{"$elemMatch": map[string]interface{}{"rating": map[string]interface{}{"$gt": 4}}}},
		}}, want: true},
		{name: "$mod and $type combined in $or", query: map[string]interface{}{"$or": []interface{}{
			map[string]interface{}{"age": map[string]interface{}{"$mod": []interface{}{5, 0}}},
			map[string]interface{}{"name": map[string]interface{}{"$type": "string"}},
		}}, want: true},
		{name: "$size and $in combined", query: map[string]interface{}{"favorites.foods": map[string]interface{}{
			"$size": 3,
			"$in":   []interface{}{"pizza"},
		}}, want: true},
		{name: "$all and $size negative test", query: map[string]interface{}{"scores": map[string]interface{}{
			"$all":  []interface{}{100},
			"$size": 4,
		}}, want: false},
		{name: "$elemMatch and $type combined", query: map[string]interface{}{"$and": []interface{}{
			map[string]interface{}{"work.projects": map[string]interface{}{"$type": "array"}},
			map[string]interface{}{"work.projects": map[string]interface{}{"$elemMatch": map[string]interface{}{"status": "completed"}}},
		}}, want: true},
		{name: "$mod, $gt, and $lt combined", query: map[string]interface{}{"age": map[string]interface{}{
			"$mod": []interface{}{5, 0},
			"$gt":  30,
			"$lt":  40,
		}}, want: true},
		{name: "$type, $exists, and $ne combined", query: map[string]interface{}{"name": map[string]interface{}{
			"$type":   "string",
			"$exists": true,
			"$ne":     "Jane Doe",
		}}, want: true},
		{name: "All new operators combined as logical OR", query: map[string]interface{}{"$or": []interface{}{
			map[string]interface{}{"tags": map[string]interface{}{"$size": 3}},
			map[string]interface{}{"scores": map[string]interface{}{"$all": []interface{}{85, 92}}},
			map[string]interface{}{"work.projects": map[string]interface{}{"$elemMatch": map[string]interface{}{"rating": 5}}},
			map[string]interface{}{"age": map[string]interface{}{"$mod": []interface{}{5, 0}}},
			map[string]interface{}{"address": map[string]interface{}{"$type": "object"}},
		}}, want: true},
		// 181-190: Complex queries with new operators
		{name: "Complex query with $size and nested paths", query: map[string]interface{}{"$and": []interface{}{
			map[string]interface{}{"tags": map[string]interface{}{"$size": 3}},
			map[string]interface{}{"work.projects": map[string]interface{}{"$size": 3}},
			map[string]interface{}{"address.location.coordinates": map[string]interface{}{"$size": 2}},
		}}, want: true},
		{name: "Complex query with $all and array accessors", query: map[string]interface{}{"$and": []interface{}{
			map[string]interface{}{"tags": map[string]interface{}{"$all": []interface{}{"premium", "verified"}}},
			map[string]interface{}{"work.projects.0.technologies": map[string]interface{}{"$all": []interface{}{"Go"}}},
		}}, want: true},
		{name: "Complex query with $elemMatch and $regex", query: map[string]interface{}{"$and": []interface{}{
			map[string]interface{}{"work.projects": map[string]interface{}{"$elemMatch": map[string]interface{}{
				"name":   map[string]interface{}{"$regex": "^Project"},
				"status": "completed",
			}}},
			map[string]interface{}{"email": map[string]interface{}{"$regex": "example\\.com$"}},
		}}, want: true},
		{name: "Complex query with $type and negation", query: map[string]interface{}{"$and": []interface{}{
			map[string]interface{}{"address": map[string]interface{}{"$type": "object"}},
			map[string]interface{}{"address.location.coordinates": map[string]interface{}{"$not": map[string]interface{}{"$type": "string"}}},
		}}, want: true},
		{name: "Complex query with $mod and numerical comparisons", query: map[string]interface{}{"$and": []interface{}{
			map[string]interface{}{"age": map[string]interface{}{"$mod": []interface{}{5, 0}}},
			map[string]interface{}{"work.salary": map[string]interface{}{"$gte": 100000, "$lt": 150000}},
			map[string]interface{}{"work.years": map[string]interface{}{"$gt": 5}},
		}}, want: true},
		{name: "Complex query with $size, $all and logical operators", query: map[string]interface{}{"$or": []interface{}{
			map[string]interface{}{"$and": []interface{}{
				map[string]interface{}{"tags": map[string]interface{}{"$size": 3}},
				map[string]interface{}{"tags": map[string]interface{}{"$all": []interface{}{"premium"}}},
			}},
			map[string]interface{}{"$and": []interface{}{
				map[string]interface{}{"scores": map[string]interface{}{"$size": 4}},
				map[string]interface{}{"scores": map[string]interface{}{"$elemMatch": map[string]interface{}{"$gte": 90}}},
			}},
		}}, want: true},
		{name: "Complex query with $type and existence checks", query: map[string]interface{}{"$and": []interface{}{
			map[string]interface{}{"name": map[string]interface{}{"$type": "string", "$exists": true}},
			map[string]interface{}{"nonexistent": map[string]interface{}{"$exists": false}},
			map[string]interface{}{"address.city": map[string]interface{}{"$type": "string", "$eq": "New York"}},
		}}, want: true},
		{name: "Complex query with $elemMatch and $size", query: map[string]interface{}{"$and": []interface{}{
			map[string]interface{}{"work.projects": map[string]interface{}{"$size": 3}},
			map[string]interface{}{"work.projects": map[string]interface{}{"$elemMatch": map[string]interface{}{
				"technologies": map[string]interface{}{"$size": 3},
			}}},
		}}, want: true},
		{name: "Complex query with $all and $in combined", query: map[string]interface{}{"$and": []interface{}{
			map[string]interface{}{"tags": map[string]interface{}{"$all": []interface{}{"premium", "verified"}}},
			map[string]interface{}{"favorites.foods": map[string]interface{}{"$in": []interface{}{"pizza", "pasta"}}},
		}}, want: true},
		{name: "Complex query mixing all new operators", query: map[string]interface{}{"$and": []interface{}{
			map[string]interface{}{"tags": map[string]interface{}{"$size": 3, "$all": []interface{}{"premium"}}},
			map[string]interface{}{"work.projects": map[string]interface{}{"$elemMatch": map[string]interface{}{
				"technologies": map[string]interface{}{"$type": "array"},
				"rating":       map[string]interface{}{"$mod": []interface{}{5, 0}},
			}}},
		}}, want: true},
		// 191-200: Edge cases and boundary tests for new operators
		{name: "$size with zero value", query: map[string]interface{}{"favorites.empty": map[string]interface{}{"$size": 0}}, want: true},
		{name: "$all with single value matching array with multiple elements", query: map[string]interface{}{"tags": map[string]interface{}{"$all": []interface{}{"premium"}}}, want: true},
		{name: "$all with empty array criteria", query: map[string]interface{}{"tags": map[string]interface{}{"$all": []interface{}{}}}, want: true},
		{name: "$elemMatch with empty criteria", query: map[string]interface{}{"work.projects": map[string]interface{}{"$elemMatch": map[string]interface{}{}}}, want: true},
		{name: "$elemMatch with null value in criteria", query: map[string]interface{}{"work.projects": map[string]interface{}{"$elemMatch": map[string]interface{}{
			"nullField": nil,
		}}}, want: false},
		{name: "$type with array containing mixed types", query: map[string]interface{}{"mixed": map[string]interface{}{"$type": "array"}}, want: true},
		{name: "$mod with zero as divisor", query: map[string]interface{}{"age": map[string]interface{}{"$mod": []interface{}{0, 0}}}, want: false},
		{name: "$mod with negative divisor", query: map[string]interface{}{"age": map[string]interface{}{"$mod": []interface{}{-5, 0}}}, want: false},
		{name: "$mod with negative remainder", query: map[string]interface{}{"age": map[string]interface{}{"$mod": []interface{}{5, -5}}}, want: false},
		{name: "$size, $all, $elemMatch, $type, and $mod in one query", query: map[string]interface{}{"$and": []interface{}{
			map[string]interface{}{"tags": map[string]interface{}{"$size": 3, "$all": []interface{}{"premium"}}},
			map[string]interface{}{"scores": map[string]interface{}{"$type": "array", "$elemMatch": map[string]interface{}{"$mod": []interface{}{2, 0}}}},
		}}, want: true},
		// 201-210: Validation and error handling tests
		{name: "$size with non-numeric value", query: map[string]interface{}{"tags": map[string]interface{}{"$size": "3"}}, want: false},
		{name: "$size with negative value", query: map[string]interface{}{"tags": map[string]interface{}{"$size": -1}}, want: false},
		{name: "$all with non-array query value", query: map[string]interface{}{"tags": map[string]interface{}{"$all": "premium"}}, want: false},
		{name: "$elemMatch with non-object criteria", query: map[string]interface{}{"work.projects": map[string]interface{}{"$elemMatch": "Project A"}}, want: false},
		{name: "$type with invalid type string", query: map[string]interface{}{"name": map[string]interface{}{"$type": "invalidType"}}, want: false},
		{name: "$mod with non-array value", query: map[string]interface{}{"age": map[string]interface{}{"$mod": 5}}, want: false},
		{name: "$mod with incomplete array", query: map[string]interface{}{"age": map[string]interface{}{"$mod": []interface{}{5}}}, want: false},
		{name: "$mod with too many elements", query: map[string]interface{}{"age": map[string]interface{}{"$mod": []interface{}{5, 0, 1}}}, want: false},
		{name: "$mod with non-numeric divisor", query: map[string]interface{}{"age": map[string]interface{}{"$mod": []interface{}{"5", 0}}}, want: false},
		{name: "$mod with non-numeric remainder", query: map[string]interface{}{"age": map[string]interface{}{"$mod": []interface{}{5, "0"}}}, want: false},
		// 211-220: Document-specific tests with new operators
		{name: "$size on favorites.foods array", query: map[string]interface{}{"favorites.foods": map[string]interface{}{"$size": 3}}, want: true},
		{name: "$all on work.projects.technologies array", query: map[string]interface{}{"work.projects.0.technologies": map[string]interface{}{"$all": []interface{}{"Go", "MongoDB"}}}, want: true},
		{name: "$elemMatch on work.projects with specific technologies", query: map[string]interface{}{"work.projects": map[string]interface{}{"$elemMatch": map[string]interface{}{
			"technologies": map[string]interface{}{"$all": []interface{}{"Go", "MongoDB"}},
		}}}, want: true},
		{name: "$type check on each address field", query: map[string]interface{}{"$and": []interface{}{
			map[string]interface{}{"address.street": map[string]interface{}{"$type": "string"}},
			map[string]interface{}{"address.city": map[string]interface{}{"$type": "string"}},
			map[string]interface{}{"address.zip": map[string]interface{}{"$type": "string"}},
			map[string]interface{}{"address.location": map[string]interface{}{"$type": "object"}},
		}}, want: true},
		{name: "$mod on both age and work years", query: map[string]interface{}{"$and": []interface{}{
			map[string]interface{}{"age": map[string]interface{}{"$mod": []interface{}{5, 0}}},
			map[string]interface{}{"work.years": map[string]interface{}{"$mod": []interface{}{2, 0}}},
		}}, want: true},
		{name: "$size check on all arrays in document", query: map[string]interface{}{"$and": []interface{}{
			map[string]interface{}{"tags": map[string]interface{}{"$size": 3}},
			map[string]interface{}{"scores": map[string]interface{}{"$size": 4}},
			map[string]interface{}{"favorites.foods": map[string]interface{}{"$size": 3}},
			map[string]interface{}{"work.projects": map[string]interface{}{"$size": 3}},
		}}, want: true},
		{name: "$elemMatch with $size on nested array", query: map[string]interface{}{"work.projects": map[string]interface{}{"$elemMatch": map[string]interface{}{
			"technologies": map[string]interface{}{"$size": 3},
		}}}, want: true},
		{name: "$all with regex patterns", query: map[string]interface{}{"tags": map[string]interface{}{"$all": []interface{}{
			map[string]interface{}{"$regex": "^pre"},
			map[string]interface{}{"$regex": "^ver"},
		}}}, want: false}, // Note: We don't support regex in $all yet
		{name: "$type combined with $regex for string", query: map[string]interface{}{"$and": []interface{}{
			map[string]interface{}{"email": map[string]interface{}{"$type": "string"}},
			map[string]interface{}{"email": map[string]interface{}{"$regex": "example\\.com$"}},
		}}, want: true},
		{name: "Super complex query with all new operators", query: map[string]interface{}{
			"$and": []interface{}{
				map[string]interface{}{"name": map[string]interface{}{"$type": "string", "$regex": "^J"}},
				map[string]interface{}{"age": map[string]interface{}{"$mod": []interface{}{5, 0}}},
				map[string]interface{}{"tags": map[string]interface{}{"$size": 3, "$all": []interface{}{"premium"}}},
				map[string]interface{}{"work.projects": map[string]interface{}{"$elemMatch": map[string]interface{}{
					"technologies": map[string]interface{}{"$size": 3, "$all": []interface{}{"Go"}},
					"rating":       map[string]interface{}{"$gte": 4},
				}}},
				map[string]interface{}{"scores": map[string]interface{}{"$type": "array", "$elemMatch": map[string]interface{}{"$gt": 90}}},
			},
		}, want: true},
	}

	// Run all 220 test cases
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
		"mixed":   []interface{}{"string", 42, true, map[string]interface{}{"key": "value"}},
		"favorites": map[string]interface{}{
			"color":  "blue",
			"number": 7,
			"foods":  []interface{}{"pizza", "sushi", "pasta"},
			"empty":  []interface{}{},
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
