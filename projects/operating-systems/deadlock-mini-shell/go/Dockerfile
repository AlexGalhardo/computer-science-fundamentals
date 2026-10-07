# EN: gofmt and go vet ship with Go. golangci-lint comes from its pinned image, the same way
#     docker/go.Dockerfile gets it.
# PT: O gofmt e o go vet vêm com o Go. O golangci-lint vem da sua imagem fixada, do mesmo modo
#     que em docker/go.Dockerfile.
FROM golangci/golangci-lint:v2.14.0 AS lint
FROM golang:1.27.1-bookworm
COPY --from=lint /usr/bin/golangci-lint /usr/local/bin/golangci-lint
WORKDIR /app
COPY . .
RUN go build -o /usr/local/bin/deadlock-demo ./cmd/demo
CMD ["sh", "-c", "test -z \"$(gofmt -l .)\" && go vet ./... && golangci-lint run ./... && go test ./..."]
