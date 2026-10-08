# EN: One image, three jobs: the default command is the gate (formatter, vet, tests), the
#     `go-server` service runs the HTTP server built here, and the `go-fold` step runs `fold`,
#     which needs `go tool pprof` and therefore the Go toolchain of this same image. The module
#     uses only the standard library, so the build downloads nothing.
#     The caches live under /tmp because some steps run as the host user, which has no home
#     folder in this image.
# PT: Uma imagem, três trabalhos: o comando padrão é o portão (formatador, vet, testes), o
#     serviço `go-server` roda o servidor HTTP construído aqui, e a etapa `go-fold` roda o
#     `fold`, que precisa do `go tool pprof` e portanto do toolchain do Go desta mesma imagem.
#     O módulo usa só a biblioteca padrão, então o build não baixa nada.
#     Os caches ficam em /tmp porque algumas etapas rodam como o usuário do host, que não tem
#     pasta home nesta imagem.
FROM golang:1.27.1-bookworm
ENV GOCACHE=/tmp/go-cache GOFLAGS=-buildvcs=false HOME=/tmp
WORKDIR /app
COPY . .
RUN go build -o /usr/local/bin/ ./cmd/... \
	&& go test -count=1 -run NONE ./... \
	&& (go tool pprof -h >/dev/null 2>&1 || true) \
	&& chmod -R a+rwX /tmp/go-cache
CMD ["sh", "-c", "test -z \"$(gofmt -l .)\" && go vet ./... && go test -count=1 ./..."]
