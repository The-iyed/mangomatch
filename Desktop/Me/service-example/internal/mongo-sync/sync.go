package sync

import (
	"context"

	"www.github.com/The-iyed/service-example/pkg/logger"
)

type Sync struct {
	MasterDB      SyncElement
	SlaveDB       SyncElement
	Fields        []string
	Transforms    []string
	IcludeDefault bool
	Type          SyncType
	Logger        logger.Logger
}

func NewSync(logger logger.Logger,
	sync_type SyncType,
	master SyncElement,
	slave SyncElement,
	fields []string,
	transforms []string,
	include bool) *Sync {
	return &Sync{
		MasterDB:      master,
		SlaveDB:       slave,
		Type:          sync_type,
		Logger:        logger,
		Fields:        fields,
		Transforms:    transforms,
		IcludeDefault: include,
	}
}

func (s *Sync) SyncDb(ctx context.Context) error {
	s.Logger.Info("Starting the sync between %s and %s", s.MasterDB.DataBase, s.SlaveDB.DataBase)
	s.Logger.Info("Attemp to sync collection %s and %s", s.MasterDB.Collection, s.SlaveDB.Collection)
	s.Logger.Info("Operation will be %s", s.Type)

	master_result := s.MasterDB.GetData(ctx)
	slave_result := s.SlaveDB.GetData(ctx)

	if s.Type == MASTER_TO_SLAVE {
		if s.MasterDB.PrimaryField == "" {
			s.MasterDB.SetPrimaryField("_id")
		}

		if s.SlaveDB.PrimaryField == "" {
			s.SlaveDB.SetPrimaryField("_id")
		}

		addSlice := getElementsToAdd(s, master_result, slave_result)

		err := s.SlaveDB.AddElements(ctx, addSlice)
		if err != nil {
			s.Logger.Error("Error inserting documents into slave collection: %v", err)
			return err
		}
		s.Logger.Info("Inserted %s documents into slave collection ", len(addSlice))

		deleteIDs := getElementsToDelete(s.MasterDB.PrimaryField, master_result)
		s.Logger.Info("deleting ", deleteIDs)
		err = s.SlaveDB.DeleteElements(ctx, deleteIDs)
		if err != nil {
			s.Logger.Error("Error deleting documents from %s collection: %v", s.SlaveDB.Collection, err)
			return err
		}
		s.Logger.Info("Deleted %d documents from slave collection", len(deleteIDs))

	}

	return nil
}
