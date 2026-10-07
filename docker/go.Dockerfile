# EN: Base image for Go mini-projects. gofmt ships with Go, golangci-lint comes from its pinned image.
# PT: Imagem base dos mini-projetos em Go. O gofmt vem com o Go, o golangci-lint vem da sua imagem fixada.
FROM golangci/golangci-lint:v2.14.0 AS lint
FROM golang:1.27.1-bookworm
COPY --from=lint /usr/bin/golangci-lint /usr/local/bin/golangci-lint
WORKDIR /app
CMD ["go", "version"]
