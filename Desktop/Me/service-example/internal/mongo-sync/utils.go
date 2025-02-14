package sync

import (
	"fmt"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"www.github.com/The-iyed/service-example/pkg/helper"
)

func getElementsToAdd(s *Sync, master []primitive.M, slave []primitive.M) []interface{} {
	masterMap := make(map[interface{}]bson.M)
	slaveMap := make(map[interface{}]bson.M)

	for _, doc := range master {
		if val, exists := doc[s.MasterDB.PrimaryField]; exists {
			masterMap[toString(val)] = doc
		}
	}

	for _, doc := range slave {
		if val, exists := doc[s.SlaveDB.PrimaryField]; exists {
			slaveMap[toString(val)] = doc
		}
	}

	var addSlice []bson.M

	for key, doc := range masterMap {
		if _, exists := slaveMap[key]; !exists {
			addSlice = append(addSlice, doc)
		}
	}

	result := helper.TransformObjects(addSlice, s.Fields, s.Transforms, s.IcludeDefault, s.Logger)

	return result
}

func getElementsToDelete(p1 string, master []primitive.M) []string {
	var deleteIDs []string

	for _, doc := range master {
		if val, exist := doc[p1]; exist && val != nil {
			idStr := toString(val)
			if idStr != "" {
				deleteIDs = append(deleteIDs, idStr)
			}
		}
	}

	return deleteIDs
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
