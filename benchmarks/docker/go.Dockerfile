# EN: Builds the Go implementation of one workload as a static binary in /opt/bench.
# PT: Compila a implementação em Go de uma carga de trabalho como binário estático em /opt/bench.
# ES: Compila la implementación en Go de una carga de trabajo como binario estático en /opt/bench.
FROM golang:1.27.1-bookworm
WORKDIR /src
COPY go/ .
RUN CGO_ENABLED=0 go build -o /opt/bench/main .
