# EN: Go on a pinned image. gofmt ships with Go and golangci-lint comes from its own pinned image.
# PT: Go em uma imagem fixada. O gofmt vem com o Go e o golangci-lint vem da sua própria imagem fixada.
# ES: Go en una imagen fijada. gofmt viene con Go y golangci-lint viene de su propia imagen fijada.
FROM golangci/golangci-lint:v2.14.0 AS lint
FROM golang:1.27.1-bookworm
COPY --from=lint /usr/bin/golangci-lint /usr/local/bin/golangci-lint
WORKDIR /app
COPY . .
RUN go build -o /usr/local/bin/graphcli ./cmd/graphcli \
	&& go build -o /usr/local/bin/graph_bench ./cmd/bench \
	&& go test -count=1 -run XXX ./...
CMD ["sh", "-c", "test -z \"$(gofmt -l .)\" && go vet ./... && golangci-lint run ./... && go test -count=1 ./..."]
