FROM golang:1.21 AS builder

WORKDIR /app

COPY go.mod go.sum ./

RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o /app/service ./cmd/main.go

RUN ls -la /app/service  

FROM alpine:latest

WORKDIR /app

COPY --from=builder /app/service /app/service  

RUN ls -la /app/service 

EXPOSE 5555 7070 5007

CMD ["/app/service"]
