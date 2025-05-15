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
