package sync

import "context"

type ISync interface {
	SyncDb(ctx context.Context) error
}
