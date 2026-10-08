# EN: Go on a pinned image, with golangci-lint copied from its own pinned image. Format, vet,
#     lint and tests run together. The build context is the project folder, because the tests
#     read fixtures/.
# PT: Go em uma imagem fixada, com o golangci-lint copiado da sua própria imagem fixada. Formato,
#     vet, lint e testes rodam juntos. O contexto de build é a pasta do projeto, porque os testes
#     leem fixtures/.
FROM golangci/golangci-lint:v2.14.0 AS lint
FROM golang:1.27.1-bookworm
COPY --from=lint /usr/bin/golangci-lint /usr/local/bin/golangci-lint
WORKDIR /app
COPY fixtures/ fixtures/
COPY go/ go/
WORKDIR /app/go
RUN go build -buildvcs=false -o /usr/local/bin/extsort . && go vet ./...
CMD ["sh", "-c", "test -z \"$(gofmt -l .)\" && go vet ./... && golangci-lint run ./... && go test -count=1 ./..."]
