# EN: golangci-lint comes from its own pinned image, as in the repository's `docker/go.Dockerfile`.
#     The module has no dependency, so the binary is built while the image is built and the
#     container then runs with no network.
# PT: O golangci-lint vem da sua própria imagem fixada, como no `docker/go.Dockerfile` do
#     repositório. O módulo não tem dependências, então o binário é construído junto com a imagem
#     e o contêiner depois roda sem rede.
# ES: golangci-lint viene de su propia imagen fijada, como en el `docker/go.Dockerfile` del
#     repositorio. El módulo no tiene dependencias, así que el binario se construye junto con la
#     imagen y el contenedor luego corre sin red.
FROM golangci/golangci-lint:v2.14.0 AS lint
FROM golang:1.27.1-bookworm
COPY --from=lint /usr/bin/golangci-lint /usr/local/bin/golangci-lint
WORKDIR /app
COPY . .
RUN go build -o /usr/local/bin/regex-engine ./cmd/regex-engine
CMD ["sh", "-c", "test -z \"$(gofmt -l .)\" && go vet ./... && golangci-lint run ./... && go test ./..."]
