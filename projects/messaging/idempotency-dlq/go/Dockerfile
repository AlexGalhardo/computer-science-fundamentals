# EN: Go on a pinned image. gofmt ships with Go and golangci-lint comes from its own pinned image.
#     The module uses only the standard library, so nothing is downloaded and the container runs
#     with no network. The tests run with the race detector: this side of the lesson is about
#     goroutines sharing state.
# PT: Go em uma imagem fixada. O gofmt vem com o Go e o golangci-lint vem da sua própria imagem fixada.
#     O módulo usa só a biblioteca padrão, então nada é baixado e o contêiner roda sem rede. Os
#     testes rodam com o detector de corrida: este lado da lição trata de goroutines dividindo estado.
# ES: Go en una imagen fijada. gofmt viene con Go y golangci-lint viene de su propia imagen fijada.
#     El módulo usa solo la biblioteca estándar, así que no se descarga nada y el contenedor se
#     ejecuta sin red. Las pruebas corren con el detector de carreras: este lado de la lección trata
#     de goroutines que comparten estado.
FROM golangci/golangci-lint:v2.14.0 AS lint
FROM golang:1.27.1-bookworm
COPY --from=lint /usr/bin/golangci-lint /usr/local/bin/golangci-lint
WORKDIR /app
COPY . .
RUN go build -o /usr/local/bin/idempotency_demo ./cmd/demo \
	&& go test -count=1 -run XXX ./...
CMD ["sh", "-c", "test -z \"$(gofmt -l .)\" && go vet ./... && golangci-lint run ./... && go test -race -count=1 ./..."]
