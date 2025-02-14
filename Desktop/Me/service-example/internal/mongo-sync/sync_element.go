package sync

import (
	"context"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"www.github.com/The-iyed/service-example/pkg/logger"
)

const (
	BIDERCTIONAL    SyncType = "BIDERCTIONAL"
	MASTER_TO_SLAVE SyncType = "MASTER_TO_SLAVE"
	batchSize                = 1000
)

type SyncType string

type SyncElement struct {
	Filter       bson.M
	Options      *options.FindOptions
	Logger       logger.Logger
	Client       *mongo.Client
	DataBase     string
	Collection   string
	PrimaryField string
}

func (se *SyncElement) SetPrimaryField(primary_field string) {
	se.PrimaryField = primary_field
}

func (se *SyncElement) GetCollection() *mongo.Collection {
	return se.Client.Database(se.DataBase).Collection(se.Collection)
}

func (se *SyncElement) GetData(ctx context.Context) []bson.M {
	collection := se.Client.Database(se.DataBase).Collection(se.Collection)

	if se.Filter == nil {
		se.Filter = bson.M{}
	}

	cursor, err := collection.Find(ctx, se.Filter, se.Options)
	if err != nil {
		se.Logger.Error("Error while getting data from %s in %s collection: %v", se.DataBase, se.Collection, err)
		return []bson.M{}
	}
	defer func() {
		if err := cursor.Close(ctx); err != nil {
			se.Logger.Error("Error closing cursor for %s collection: %v", se.Collection, err)
		}
	}()

	var result []bson.M
	if err := cursor.All(ctx, &result); err != nil {
		se.Logger.Error("Error decoding %s data: %v", se.DataBase, err)
		return []bson.M{}
	}

	return result
}

func (se *SyncElement) DeleteElements(ctx context.Context, elements []string) error {
	if se.PrimaryField == "" {
		se.SetPrimaryField("_id")
	}

	if len(elements) == 0 {
		se.Logger.Info("No elements to delete in collection %s", se.Collection)
		return nil
	}

	for i := 0; i < len(elements); i += batchSize {
		end := i + batchSize
		if end > len(elements) {
			end = len(elements)
		}

		filter := bson.M{se.PrimaryField: bson.M{"$in": elements[i:end]}}
		_, err := se.GetCollection().DeleteMany(ctx, filter)
		if err != nil {
			se.Logger.Error("Error deleting batch of documents from %s: %v", se.Collection, err)
			return err
		}
		se.Logger.Info("Deleted batch of %d documents from collection %s", end-i, se.Collection)
	}

	return nil
}

func (se *SyncElement) AddElements(ctx context.Context, elements []interface{}) error {
	if len(elements) == 0 {
		se.Logger.Info("No elements to add in collection %s", se.Collection)
		return nil
	}

	for i := 0; i < len(elements); i += batchSize {
		end := i + batchSize
		if end > len(elements) {
			end = len(elements)
		}

		_, err := se.GetCollection().InsertMany(ctx, elements[i:end])
		if err != nil {
			se.Logger.Error("Error adding batch of documents to %s: %v", se.Collection, err)
			return err
		}
		se.Logger.Info("Added batch of %d documents to collection %s", end-i, se.Collection)
	}

	return nil
}
