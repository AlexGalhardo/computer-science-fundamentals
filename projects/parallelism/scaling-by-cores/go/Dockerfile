# EN: Test image of the Go implementation. gofmt and go vet ship with Go, golangci-lint comes
#     from its own pinned image.
# PT: Imagem de teste da implementação em Go. O gofmt e o go vet vêm com o Go, o golangci-lint
#     vem da sua própria imagem fixada.
# ES: Imagen de pruebas de la implementación en Go. gofmt y go vet vienen con Go, golangci-lint
#     viene de su propia imagen fijada.
FROM golangci/golangci-lint:v2.14.0 AS lint
FROM golang:1.27.1-bookworm
COPY --from=lint /usr/bin/golangci-lint /usr/local/bin/golangci-lint
WORKDIR /app
COPY . .
RUN go build -o scaling .
# EN: -race runs the tests under the race detector, which reports any unsynchronised access to
#     shared memory made by the parallel code.
# PT: -race roda os testes com o detector de corridas, que acusa qualquer acesso sem
#     sincronização à memória compartilhada feito pelo código paralelo.
# ES: -race ejecuta las pruebas con el detector de condiciones de carrera, que delata cualquier
#     acceso sin sincronización a la memoria compartida hecho por el código paralelo.
CMD ["sh", "-c", "test -z \"$(gofmt -l .)\" && go vet ./... && golangci-lint run ./... && go test -race ./..."]
