# EN: One image serves every job: balancer, back end, report and tests. The commands are
#     compiled into the image, so the containers start at once and need no network to build.
#     The project uses only the standard library. Nothing runs as root: the user `lab` owns
#     the source, and the Go caches live in /tmp so that any uid can run the tests.
# PT: Uma imagem serve para todos os trabalhos: balanceador, back end, relatório e testes. Os
#     comandos são compilados dentro da imagem, então os contêineres sobem na hora e não
#     precisam de rede para compilar. O projeto usa apenas a biblioteca padrão. Nada roda como
#     root: o usuário `lab` é dono do código, e os caches do Go ficam em /tmp para que qualquer
#     uid consiga rodar os testes.
FROM golang:1.27.1-bookworm
RUN useradd --create-home --uid 1000 lab
WORKDIR /app
COPY --chown=lab:lab . .
RUN go build -o /usr/local/bin/ ./cmd/... && chown lab:lab /app
ENV GOCACHE=/tmp/go-cache
USER lab
CMD ["sh", "-c", "test -z \"$(gofmt -l .)\" && go vet ./... && go test -race -count=1 ./..."]
