package mangomatch

import (
	"regexp"
	"strconv"
	"strings"
)

func Match(query map[string]interface{}, doc map[string]interface{}) bool {
	for key, value := range query {
		if strings.HasPrefix(key, "$") {
			switch key {
			case "$and":
				return evaluateAnd(value, doc)
			case "$or":
				return evaluateOr(value, doc)
			case "$nor":
				return !evaluateOr(value, doc)
			default:
				return false
			}
		} else {
			fieldValue, exists := getNestedValue(doc, key)
			if !exists {
				if mapValue, ok := value.(map[string]interface{}); ok {
					if existsVal, hasExists := mapValue["$exists"]; hasExists {
						return existsVal.(bool) == exists
					}
				}
				return false
			}

			if !matchValue(value, fieldValue) {
				return false
			}
		}
	}
	return len(query) > 0
}

func evaluateAnd(value interface{}, doc map[string]interface{}) bool {
	conditions, ok := value.([]interface{})
	if !ok {
		return false
	}

	for _, condition := range conditions {
		if condMap, ok := condition.(map[string]interface{}); ok {
			if !Match(condMap, doc) {
				return false
			}
		} else {
			return false
		}
	}
	return true
}

func evaluateOr(value interface{}, doc map[string]interface{}) bool {
	conditions, ok := value.([]interface{})
	if !ok {
		return false
	}

	for _, condition := range conditions {
		if condMap, ok := condition.(map[string]interface{}); ok {
			if Match(condMap, doc) {
				return true
			}
		}
	}
	return false
}

func matchValue(queryValue interface{}, docValue interface{}) bool {
	switch queryVal := queryValue.(type) {
	case map[string]interface{}:
		return evaluateOperators(queryVal, docValue)
	default:
		// Handle the case where docValue is an array
		if docArray, ok := docValue.([]interface{}); ok {
			for _, item := range docArray {
				if compareEqual(queryValue, item) {
					return true
				}
			}
			return false
		}
		return compareEqual(queryValue, docValue)
	}
}

func evaluateOperators(operators map[string]interface{}, docValue interface{}) bool {
	for op, val := range operators {
		switch op {
		case "$eq":
			if !compareEqual(val, docValue) {
				return false
			}
		case "$ne":
			if compareEqual(val, docValue) {
				return false
			}
		case "$gt":
			if !compareGreaterThan(val, docValue) {
				return false
			}
		case "$gte":
			if !compareGreaterThanEqual(val, docValue) {
				return false
			}
		case "$lt":
			if !compareLessThan(val, docValue) {
				return false
			}
		case "$lte":
			if !compareLessThanEqual(val, docValue) {
				return false
			}
		case "$in":
			if !evaluateIn(val, docValue) {
				return false
			}
		case "$nin":
			if evaluateIn(val, docValue) {
				return false
			}
		case "$exists":
			return val.(bool)
		case "$not":
			if subMap, ok := val.(map[string]interface{}); ok {
				return !evaluateOperators(subMap, docValue)
			}
			return false
		case "$regex":
			if !evaluateRegex(val, docValue) {
				return false
			}
		default:
			return false
		}
	}
	return true
}

func evaluateIn(queryValue interface{}, docValue interface{}) bool {
	values, ok := queryValue.([]interface{})
	if !ok {
		return false
	}

	// Handle the case where docValue is an array
	if docArray, ok := docValue.([]interface{}); ok {
		for _, item := range docArray {
			for _, val := range values {
				if compareEqual(val, item) {
					return true
				}
			}
		}
		return false
	}

	for _, val := range values {
		if compareEqual(val, docValue) {
			return true
		}
	}
	return false
}

func evaluateRegex(queryValue interface{}, docValue interface{}) bool {
	pattern, ok := queryValue.(string)
	if !ok {
		return false
	}

	// Handle the case where docValue is an array
	if docArray, ok := docValue.([]interface{}); ok {
		for _, item := range docArray {
			itemStr, isStr := item.(string)
			if isStr {
				re, err := regexp.Compile(pattern)
				if err != nil {
					return false
				}
				if re.MatchString(itemStr) {
					return true
				}
			}
		}
		return false
	}

	docStr, ok := docValue.(string)
	if !ok {
		return false
	}

	re, err := regexp.Compile(pattern)
	if err != nil {
		return false
	}

	return re.MatchString(docStr)
}

func compareEqual(a, b interface{}) bool {
	switch aVal := a.(type) {
	case int:
		if bVal, ok := b.(int); ok {
			return aVal == bVal
		}
		if bVal, ok := b.(float64); ok {
			return float64(aVal) == bVal
		}
	case float64:
		if bVal, ok := b.(float64); ok {
			return aVal == bVal
		}
		if bVal, ok := b.(int); ok {
			return aVal == float64(bVal)
		}
	case string:
		if bVal, ok := b.(string); ok {
			return aVal == bVal
		}
	case bool:
		if bVal, ok := b.(bool); ok {
			return aVal == bVal
		}
	}
	return false
}

func compareGreaterThan(a, b interface{}) bool {
	// Handle the case where b is an array
	if bArray, ok := b.([]interface{}); ok {
		for _, item := range bArray {
			if compareSimpleGreaterThan(a, item) {
				return true
			}
		}
		return false
	}
	return compareSimpleGreaterThan(a, b)
}

func compareSimpleGreaterThan(a, b interface{}) bool {
	switch aVal := a.(type) {
	case int:
		if bVal, ok := b.(int); ok {
			return bVal > aVal
		}
		if bVal, ok := b.(float64); ok {
			return bVal > float64(aVal)
		}
	case float64:
		if bVal, ok := b.(float64); ok {
			return bVal > aVal
		}
		if bVal, ok := b.(int); ok {
			return float64(bVal) > aVal
		}
	case string:
		if bVal, ok := b.(string); ok {
			return bVal > aVal
		}
	}
	return false
}

func compareGreaterThanEqual(a, b interface{}) bool {
	// Handle the case where b is an array
	if bArray, ok := b.([]interface{}); ok {
		for _, item := range bArray {
			if compareSimpleGreaterThanEqual(a, item) {
				return true
			}
		}
		return false
	}
	return compareSimpleGreaterThanEqual(a, b)
}

func compareSimpleGreaterThanEqual(a, b interface{}) bool {
	switch aVal := a.(type) {
	case int:
		if bVal, ok := b.(int); ok {
			return bVal >= aVal
		}
		if bVal, ok := b.(float64); ok {
			return bVal >= float64(aVal)
		}
	case float64:
		if bVal, ok := b.(float64); ok {
			return bVal >= aVal
		}
		if bVal, ok := b.(int); ok {
			return float64(bVal) >= aVal
		}
	case string:
		if bVal, ok := b.(string); ok {
			return bVal >= aVal
		}
	}
	return false
}

func compareLessThan(a, b interface{}) bool {
	// Handle the case where b is an array
	if bArray, ok := b.([]interface{}); ok {
		for _, item := range bArray {
			if compareSimpleLessThan(a, item) {
				return true
			}
		}
		return false
	}
	return compareSimpleLessThan(a, b)
}

func compareSimpleLessThan(a, b interface{}) bool {
	switch aVal := a.(type) {
	case int:
		if bVal, ok := b.(int); ok {
			return bVal < aVal
		}
		if bVal, ok := b.(float64); ok {
			return bVal < float64(aVal)
		}
	case float64:
		if bVal, ok := b.(float64); ok {
			return bVal < aVal
		}
		if bVal, ok := b.(int); ok {
			return float64(bVal) < aVal
		}
	case string:
		if bVal, ok := b.(string); ok {
			return bVal < aVal
		}
	}
	return false
}

func compareLessThanEqual(a, b interface{}) bool {
	// Handle the case where b is an array
	if bArray, ok := b.([]interface{}); ok {
		for _, item := range bArray {
			if compareSimpleLessThanEqual(a, item) {
				return true
			}
		}
		return false
	}
	return compareSimpleLessThanEqual(a, b)
}

func compareSimpleLessThanEqual(a, b interface{}) bool {
	switch aVal := a.(type) {
	case int:
		if bVal, ok := b.(int); ok {
			return bVal <= aVal
		}
		if bVal, ok := b.(float64); ok {
			return bVal <= float64(aVal)
		}
	case float64:
		if bVal, ok := b.(float64); ok {
			return bVal <= aVal
		}
		if bVal, ok := b.(int); ok {
			return float64(bVal) <= aVal
		}
	case string:
		if bVal, ok := b.(string); ok {
			return bVal <= aVal
		}
	}
	return false
}

func getNestedValue(doc map[string]interface{}, key string) (interface{}, bool) {
	parts := strings.Split(key, ".")

	// For the leaf part, we need special handling for array fields
	if len(parts) == 1 {
		val, exists := doc[parts[0]]
		return val, exists
	}

	var current interface{} = doc

	// For non-leaf parts
	for i, part := range parts {
		// Check if the part is an array index
		isArrayIndex := false
		arrayIndex := -1
		if idx, err := strconv.Atoi(part); err == nil {
			isArrayIndex = true
			arrayIndex = idx
		}

		if i == len(parts)-1 {
			// Last segment - handle arrays specially
			if currentMap, ok := current.(map[string]interface{}); ok {
				val, exists := currentMap[part]
				return val, exists
			}

			// Handle direct array access by index
			if isArrayIndex && arrayIndex >= 0 {
				if arr, ok := current.([]interface{}); ok && arrayIndex < len(arr) {
					return arr[arrayIndex], true
				}
			}

			// Handle array elements
			if currentArray, ok := current.([]interface{}); ok {
				for _, item := range currentArray {
					if itemMap, ok := item.(map[string]interface{}); ok {
						if val, exists := itemMap[part]; exists {
							return val, true
						}
					}
				}
			}

			return nil, false
		}

		if isArrayIndex && arrayIndex >= 0 {
			// Handle array access
			if arr, ok := current.([]interface{}); ok && arrayIndex < len(arr) {
				current = arr[arrayIndex]
				continue
			}
			return nil, false
		}

		if currentMap, ok := current.(map[string]interface{}); ok {
			current, ok = currentMap[part]
			if !ok {
				return nil, false
			}
		} else if currentArray, ok := current.([]interface{}); ok {
			// For array elements, try to find the next part in each item
			found := false
			for _, item := range currentArray {
				if itemMap, ok := item.(map[string]interface{}); ok {
					if val, exists := itemMap[part]; exists {
						current = val
						found = true
						break
					}
				}
			}
			if !found {
				return nil, false
			}
		} else {
			return nil, false
		}
	}

	return current, true
}
