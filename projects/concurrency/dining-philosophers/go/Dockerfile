# EN: Build context is the mini-project folder. The demo is compiled at build time, so the
#     container needs no network.
# PT: O contexto de build é a pasta do mini-projeto. A demo é compilada no build, então o
#     contêiner não precisa de rede.
FROM golang:1.27.1-bookworm
WORKDIR /src
COPY go/ .
RUN go build -o /usr/local/bin/philosophers-go ./cmd/demo && go test -count=1 -run NONE ./...
CMD ["sh", "-c", "test -z \"$(gofmt -l .)\" && go vet ./... && go test -v -count=1 ./..."]
