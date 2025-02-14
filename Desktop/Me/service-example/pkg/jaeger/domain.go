package jaeger

import 	"github.com/opentracing/opentracing-go"

type TracerManager interface {
	GetTracer() opentracing.Tracer
	Close() error
}
