package mangomatch

import (
	"go.mongodb.org/mongo-driver/bson"
)

func ConvertBSON(value interface{}) interface{} {
	switch v := value.(type) {
	case bson.M:
		result := make(map[string]interface{})
		for key, val := range v {
			result[key] = ConvertBSON(val)
		}
		return result
	case bson.D:
		result := make(map[string]interface{})
		for _, elem := range v {
			result[elem.Key] = ConvertBSON(elem.Value)
		}
		return result
	case bson.A:
		arr := make([]interface{}, len(v))
		for i, item := range v {
			arr[i] = ConvertBSON(item)
		}
		return arr
	default:
		return v
	}
}

func MapBSON(value interface{}) interface{} {
	switch v := value.(type) {
	case map[string]interface{}:
		result := bson.M{}
		for key, val := range v {
			result[key] = MapBSON(val)
		}
		return result
	case []interface{}:
		result := bson.A{}
		for _, item := range v {
			result = append(result, MapBSON(item))
		}
		return result
	case map[interface{}]interface{}:
		result := bson.M{}
		for key, val := range v {
			if k, ok := key.(string); ok {
				result[k] = MapBSON(val)
			}
		}
		return result
	default:
		return v
	}
}

func MatchBSON(query, doc interface{}) bool {
	goQuery, ok := ConvertBSON(query).(map[string]interface{})
	if !ok {
		return false
	}

	goDoc, ok := ConvertBSON(doc).(map[string]interface{})
	if !ok {
		return false
	}

	return Match(goQuery, goDoc)
}

func StructToBsonMap(data interface{}) (map[string]interface{}, error) {
	bsonBytes, err := bson.Marshal(data)
	if err != nil {
		return nil, err
	}
	var out map[string]interface{}
	err = bson.Unmarshal(bsonBytes, &out)
	return out, err
}