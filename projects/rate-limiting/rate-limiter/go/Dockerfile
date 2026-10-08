# EN: The build context is the mini-project folder, because the tests read `cases/` (the table
#     shared with TypeScript) and `results/` (the numbers of the TypeScript experiment). The
#     tests run with the race detector, which is what proves the mutexes are needed. golangci-lint
#     comes from its own pinned image, the same version as `docker/go.Dockerfile`.
# PT: O contexto de build é a pasta do mini-projeto, porque os testes leem `cases/` (a tabela
#     compartilhada com o TypeScript) e `results/` (os números do experimento em TypeScript). Os
#     testes rodam com o detector de corridas, que é o que prova que os mutexes são necessários.
#     O golangci-lint vem da sua própria imagem fixada, a mesma versão de `docker/go.Dockerfile`.
FROM golangci/golangci-lint:v2.14.0 AS lint
FROM golang:1.27.1-bookworm
COPY --from=lint /usr/bin/golangci-lint /usr/local/bin/golangci-lint
WORKDIR /app/go
COPY cases /app/cases
COPY results /app/results
COPY go .
CMD ["sh", "-c", "test -z \"$(gofmt -l .)\" && go vet ./... && golangci-lint run ./... && go test -race ./..."]
