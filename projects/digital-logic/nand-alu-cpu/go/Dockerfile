# EN: The build context is the mini-project folder, because programs/ and results/trace.txt are
#     shared with the TypeScript version. gofmt and go vet ship with Go. golangci-lint comes
#     from its pinned image, the same way docker/go.Dockerfile gets it.
# PT: O contexto de build é a pasta do mini-projeto, porque programs/ e results/trace.txt são
#     compartilhados com a versão em TypeScript. O gofmt e o go vet vêm com o Go. O golangci-lint
#     vem da sua imagem fixada, do mesmo modo que em docker/go.Dockerfile.
FROM golangci/golangci-lint:v2.14.0 AS lint
FROM golang:1.27.1-bookworm
COPY --from=lint /usr/bin/golangci-lint /usr/local/bin/golangci-lint
WORKDIR /app
COPY go/ ./
COPY programs/ ./programs/
COPY results/trace.txt ./results/trace.txt
RUN go build -o /usr/local/bin/nand-cpu-demo ./cmd/demo
CMD ["sh", "-c", "test -z \"$(gofmt -l .)\" && go vet ./... && golangci-lint run ./... && go test ./..."]
