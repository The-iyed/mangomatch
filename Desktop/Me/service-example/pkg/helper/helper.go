package helper

import (
	"fmt"
	"strconv"
	"strings"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"www.github.com/The-iyed/service-example/pkg/logger"
)

func TransformObjects(objects []bson.M, fields []string, transforms []string, takeRest bool, logger logger.Logger) []interface{} {
	fieldMap := make(map[string]string)
	typeMap := make(map[string]string)

	for _, field := range transforms {
		parts := strings.Split(field, ";")
		if len(parts) == 2 {
			typeMap[toString(parts[0])] = toString(parts[1])
		}
	}

	for _, field := range fields {
		parts := strings.Split(field, ";")
		if len(parts) == 2 {
			fieldMap[toString(parts[0])] = toString(parts[1])
		}
	}

	var transformedObjects []interface{}
	for _, obj := range objects {

		newObj := bson.M{}

		for oldKey, newKey := range fieldMap {
			if val, exists := obj[oldKey]; exists {
				if new_type, ok := typeMap[newKey]; ok {
					if transformed_val, err := toType(new_type, val); err == nil {
						newObj[newKey] = transformed_val
					} else {
						newObj[newKey] = val
					}
				} else {
					newObj[newKey] = val

				}
			}
		}
		if takeRest {
			for key, val := range obj {
				if _, transformed := fieldMap[key]; !transformed {
					if new_type, ok := typeMap[key]; ok {
						if transformed_val, err := toType(new_type, val); err == nil {
							newObj[key] = transformed_val
						} else {
							newObj[key] = val
						}
					} else {
						newObj[key] = val
					}
				}
			}
		}

		transformedObjects = append(transformedObjects, newObj)
	}

	return transformedObjects
}
func toString(value interface{}) string {
	switch v := value.(type) {
	case string:
		return v
	case primitive.ObjectID:
		return v.Hex()
	default:
		return fmt.Sprintf("%v", v)
	}
}

func toType(newType string, value interface{}) (interface{}, error) {
	switch newType {
	case "string":
		switch v := value.(type) {
		case string:
			return v, nil
		case primitive.ObjectID:
			return v.Hex(), nil
		default:
			return fmt.Sprintf("%v", value), nil
		}
	case "number":
		switch v := value.(type) {
		case int, int32, int64, float32, float64:
			return v, nil
		case string:
			number, err := strconv.Atoi(v)
			if err != nil {
				return nil, fmt.Errorf("failed to convert %v to number: %v", v, err)
			}
			return number, nil
		default:
			return nil, fmt.Errorf("unsupported type for number conversion: %T", v)
		}
	case "boolean":
		switch v := value.(type) {
		case bool:
			return v, nil
		case string:
			boolVal, err := strconv.ParseBool(v)
			if err != nil {
				return nil, fmt.Errorf("failed to convert %v to boolean: %v", v, err)
			}
			return boolVal, nil
		case int:
			return v != 0, nil
		default:
			return nil, fmt.Errorf("unsupported type for boolean conversion: %T", v)
		}
	case "objectid":
		switch v := value.(type) {
		case string:
			objectID, err := primitive.ObjectIDFromHex(v)
			if err != nil {
				return nil, fmt.Errorf("failed to convert %v to ObjectID: %v", v, err)
			}
			return objectID, nil
		default:
			return nil, fmt.Errorf("unsupported type for ObjectID conversion: %T", v)
		}
	default:
		return nil, fmt.Errorf("unsupported target type: %s", newType)
	}
}
