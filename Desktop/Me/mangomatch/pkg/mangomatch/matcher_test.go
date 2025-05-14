package mangomatch

import (
	"testing"
)

func TestComparisonOperators(t *testing.T) {
	tests := []struct {
		name  string
		query map[string]interface{}
		doc   map[string]interface{}
		want  bool
	}{
		{
			name:  "Equal match",
			query: map[string]interface{}{"age": 30},
			doc:   map[string]interface{}{"age": 30, "name": "John"},
			want:  true,
		},
		{
			name:  "Equal no match",
			query: map[string]interface{}{"age": 30},
			doc:   map[string]interface{}{"age": 31, "name": "John"},
			want:  false,
		},
		{
			name:  "$eq match",
			query: map[string]interface{}{"age": map[string]interface{}{"$eq": 30}},
			doc:   map[string]interface{}{"age": 30, "name": "John"},
			want:  true,
		},
		{
			name:  "$eq no match",
			query: map[string]interface{}{"age": map[string]interface{}{"$eq": 30}},
			doc:   map[string]interface{}{"age": 31, "name": "John"},
			want:  false,
		},
		{
			name:  "$ne match",
			query: map[string]interface{}{"age": map[string]interface{}{"$ne": 30}},
			doc:   map[string]interface{}{"age": 31, "name": "John"},
			want:  true,
		},
		{
			name:  "$ne no match",
			query: map[string]interface{}{"age": map[string]interface{}{"$ne": 30}},
			doc:   map[string]interface{}{"age": 30, "name": "John"},
			want:  false,
		},
		{
			name:  "$gt match",
			query: map[string]interface{}{"age": map[string]interface{}{"$gt": 30}},
			doc:   map[string]interface{}{"age": 35, "name": "John"},
			want:  true,
		},
		{
			name:  "$gt no match",
			query: map[string]interface{}{"age": map[string]interface{}{"$gt": 30}},
			doc:   map[string]interface{}{"age": 30, "name": "John"},
			want:  false,
		},
		{
			name:  "$gte match equal",
			query: map[string]interface{}{"age": map[string]interface{}{"$gte": 30}},
			doc:   map[string]interface{}{"age": 30, "name": "John"},
			want:  true,
		},
		{
			name:  "$gte match greater",
			query: map[string]interface{}{"age": map[string]interface{}{"$gte": 30}},
			doc:   map[string]interface{}{"age": 35, "name": "John"},
			want:  true,
		},
		{
			name:  "$gte no match",
			query: map[string]interface{}{"age": map[string]interface{}{"$gte": 30}},
			doc:   map[string]interface{}{"age": 25, "name": "John"},
			want:  false,
		},
		{
			name:  "$lt match",
			query: map[string]interface{}{"age": map[string]interface{}{"$lt": 30}},
			doc:   map[string]interface{}{"age": 25, "name": "John"},
			want:  true,
		},
		{
			name:  "$lt no match",
			query: map[string]interface{}{"age": map[string]interface{}{"$lt": 30}},
			doc:   map[string]interface{}{"age": 30, "name": "John"},
			want:  false,
		},
		{
			name:  "$lte match equal",
			query: map[string]interface{}{"age": map[string]interface{}{"$lte": 30}},
			doc:   map[string]interface{}{"age": 30, "name": "John"},
			want:  true,
		},
		{
			name:  "$lte match less",
			query: map[string]interface{}{"age": map[string]interface{}{"$lte": 30}},
			doc:   map[string]interface{}{"age": 25, "name": "John"},
			want:  true,
		},
		{
			name:  "$lte no match",
			query: map[string]interface{}{"age": map[string]interface{}{"$lte": 30}},
			doc:   map[string]interface{}{"age": 35, "name": "John"},
			want:  false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := Match(tt.query, tt.doc); got != tt.want {
				t.Errorf("Match() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestArrayOperators(t *testing.T) {
	tests := []struct {
		name  string
		query map[string]interface{}
		doc   map[string]interface{}
		want  bool
	}{
		{
			name:  "$in match",
			query: map[string]interface{}{"status": map[string]interface{}{"$in": []interface{}{"active", "pending"}}},
			doc:   map[string]interface{}{"status": "active", "name": "John"},
			want:  true,
		},
		{
			name:  "$in no match",
			query: map[string]interface{}{"status": map[string]interface{}{"$in": []interface{}{"active", "pending"}}},
			doc:   map[string]interface{}{"status": "inactive", "name": "John"},
			want:  false,
		},
		{
			name:  "$nin match",
			query: map[string]interface{}{"status": map[string]interface{}{"$nin": []interface{}{"active", "pending"}}},
			doc:   map[string]interface{}{"status": "inactive", "name": "John"},
			want:  true,
		},
		{
			name:  "$nin no match",
			query: map[string]interface{}{"status": map[string]interface{}{"$nin": []interface{}{"active", "pending"}}},
			doc:   map[string]interface{}{"status": "active", "name": "John"},
			want:  false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := Match(tt.query, tt.doc); got != tt.want {
				t.Errorf("Match() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestLogicalOperators(t *testing.T) {
	tests := []struct {
		name  string
		query map[string]interface{}
		doc   map[string]interface{}
		want  bool
	}{
		{
			name: "$and match",
			query: map[string]interface{}{
				"$and": []interface{}{
					map[string]interface{}{"age": map[string]interface{}{"$gte": 18}},
					map[string]interface{}{"verified": true},
				},
			},
			doc:  map[string]interface{}{"age": 25, "verified": true, "name": "John"},
			want: true,
		},
		{
			name: "$and no match",
			query: map[string]interface{}{
				"$and": []interface{}{
					map[string]interface{}{"age": map[string]interface{}{"$gte": 18}},
					map[string]interface{}{"verified": true},
				},
			},
			doc:  map[string]interface{}{"age": 25, "verified": false, "name": "John"},
			want: false,
		},
		{
			name: "$or match first condition",
			query: map[string]interface{}{
				"$or": []interface{}{
					map[string]interface{}{"age": map[string]interface{}{"$gte": 18}},
					map[string]interface{}{"verified": true},
				},
			},
			doc:  map[string]interface{}{"age": 25, "verified": false, "name": "John"},
			want: true,
		},
		{
			name: "$or match second condition",
			query: map[string]interface{}{
				"$or": []interface{}{
					map[string]interface{}{"age": map[string]interface{}{"$lt": 18}},
					map[string]interface{}{"verified": true},
				},
			},
			doc:  map[string]interface{}{"age": 25, "verified": true, "name": "John"},
			want: true,
		},
		{
			name: "$or no match",
			query: map[string]interface{}{
				"$or": []interface{}{
					map[string]interface{}{"age": map[string]interface{}{"$lt": 18}},
					map[string]interface{}{"verified": true},
				},
			},
			doc:  map[string]interface{}{"age": 25, "verified": false, "name": "John"},
			want: false,
		},
		{
			name: "$nor match",
			query: map[string]interface{}{
				"$nor": []interface{}{
					map[string]interface{}{"age": map[string]interface{}{"$lt": 18}},
					map[string]interface{}{"verified": true},
				},
			},
			doc:  map[string]interface{}{"age": 25, "verified": false, "name": "John"},
			want: true,
		},
		{
			name: "$nor no match",
			query: map[string]interface{}{
				"$nor": []interface{}{
					map[string]interface{}{"age": map[string]interface{}{"$lt": 18}},
					map[string]interface{}{"verified": true},
				},
			},
			doc:  map[string]interface{}{"age": 25, "verified": true, "name": "John"},
			want: false,
		},
		{
			name:  "$not match",
			query: map[string]interface{}{"age": map[string]interface{}{"$not": map[string]interface{}{"$lt": 18}}},
			doc:   map[string]interface{}{"age": 25, "name": "John"},
			want:  true,
		},
		{
			name:  "$not no match",
			query: map[string]interface{}{"age": map[string]interface{}{"$not": map[string]interface{}{"$lt": 30}}},
			doc:   map[string]interface{}{"age": 25, "name": "John"},
			want:  false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := Match(tt.query, tt.doc); got != tt.want {
				t.Errorf("Match() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestExistenceOperator(t *testing.T) {
	tests := []struct {
		name  string
		query map[string]interface{}
		doc   map[string]interface{}
		want  bool
	}{
		{
			name:  "$exists true match",
			query: map[string]interface{}{"age": map[string]interface{}{"$exists": true}},
			doc:   map[string]interface{}{"age": 25, "name": "John"},
			want:  true,
		},
		{
			name:  "$exists true no match",
			query: map[string]interface{}{"age": map[string]interface{}{"$exists": true}},
			doc:   map[string]interface{}{"name": "John"},
			want:  false,
		},
		{
			name:  "$exists false match",
			query: map[string]interface{}{"age": map[string]interface{}{"$exists": false}},
			doc:   map[string]interface{}{"name": "John"},
			want:  true,
		},
		{
			name:  "$exists false no match",
			query: map[string]interface{}{"age": map[string]interface{}{"$exists": false}},
			doc:   map[string]interface{}{"age": 25, "name": "John"},
			want:  false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := Match(tt.query, tt.doc); got != tt.want {
				t.Errorf("Match() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestRegexOperator(t *testing.T) {
	tests := []struct {
		name  string
		query map[string]interface{}
		doc   map[string]interface{}
		want  bool
	}{
		{
			name:  "$regex match",
			query: map[string]interface{}{"name": map[string]interface{}{"$regex": "^Jo"}},
			doc:   map[string]interface{}{"name": "John", "age": 25},
			want:  true,
		},
		{
			name:  "$regex no match",
			query: map[string]interface{}{"name": map[string]interface{}{"$regex": "^Jo"}},
			doc:   map[string]interface{}{"name": "Bob", "age": 25},
			want:  false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := Match(tt.query, tt.doc); got != tt.want {
				t.Errorf("Match() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestNestedDocuments(t *testing.T) {
	tests := []struct {
		name  string
		query map[string]interface{}
		doc   map[string]interface{}
		want  bool
	}{
		{
			name:  "Nested field match",
			query: map[string]interface{}{"address.city": "New York"},
			doc:   map[string]interface{}{"name": "John", "address": map[string]interface{}{"city": "New York", "zip": "10001"}},
			want:  true,
		},
		{
			name:  "Nested field no match",
			query: map[string]interface{}{"address.city": "Boston"},
			doc:   map[string]interface{}{"name": "John", "address": map[string]interface{}{"city": "New York", "zip": "10001"}},
			want:  false,
		},
		{
			name:  "Nested field with operator",
			query: map[string]interface{}{"address.zip": map[string]interface{}{"$regex": "^100"}},
			doc:   map[string]interface{}{"name": "John", "address": map[string]interface{}{"city": "New York", "zip": "10001"}},
			want:  true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := Match(tt.query, tt.doc); got != tt.want {
				t.Errorf("Match() = %v, want %v", got, tt.want)
			}
		})
	}
}
