FROM golang:1.27.1-bookworm
WORKDIR /app
COPY . .
CMD ["sh", "-c", "test -z \"$(gofmt -l .)\" && go vet ./... && go test ./..."]
