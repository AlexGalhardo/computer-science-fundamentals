# EN: golangci-lint comes from its own pinned image, as in the repository's `docker/go.Dockerfile`.
#     The module has no dependency (standard library only), so the binaries are built while the
#     image is built and the containers then need no network to compile.
# PT: O golangci-lint vem da sua própria imagem fixada, como no `docker/go.Dockerfile` do
#     repositório. O módulo não tem dependências (só a biblioteca padrão), então os binários são
#     construídos junto com a imagem e os contêineres depois não precisam de rede para compilar.
# ES: golangci-lint viene de su propia imagen fijada, como en el `docker/go.Dockerfile` del
#     repositorio. El módulo no tiene dependencias (solo la biblioteca estándar), así que los
#     binarios se construyen junto con la imagen y los contenedores después no necesitan red
#     para compilar.
FROM golangci/golangci-lint:v2.14.0 AS lint
FROM golang:1.27.1-bookworm
COPY --from=lint /usr/bin/golangci-lint /usr/local/bin/golangci-lint
WORKDIR /app
COPY . .
RUN go build -o /usr/local/bin/ ./cmd/...
CMD ["sh", "-c", "test -z \"$(gofmt -l .)\" && go vet ./... && golangci-lint run ./... && go test ./..."]
