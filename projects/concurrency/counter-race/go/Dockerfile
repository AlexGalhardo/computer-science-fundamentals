# EN: Build context is the mini-project folder, so the same file serves docker compose and the
#     benchmark runner. The race detector needs cgo and a C compiler, which this image has.
# PT: O contexto de build é a pasta do mini-projeto, então o mesmo arquivo serve ao docker
#     compose e ao runner de benchmark. O detector de corrida precisa de cgo e de um compilador
#     C, que esta imagem tem.
FROM golang:1.27.1-bookworm
WORKDIR /src
COPY go/ .
# EN: Compiled here, while the build still has the toolchain cache, so tests start fast and the
#     demo binary lives outside /app (the runner mounts the project over /app).
# PT: Compilado aqui, enquanto o build ainda tem o cache da toolchain, para os testes começarem
#     rápido e o binário da demo ficar fora de /app (o runner monta o projeto sobre /app).
RUN go build -o /usr/local/bin/counter-race-go ./cmd/demo && go build -race -o /dev/null ./cmd/demo
CMD ["sh", "-c", "test -z \"$(gofmt -l .)\" && go vet ./... && go test -v -count=1 ./..."]
