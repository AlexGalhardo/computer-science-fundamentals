FROM golang:1.27.1-bookworm
WORKDIR /app
COPY . .
# EN: The commands are built into the image, so the lab containers start at once and need no
#     network to compile. The project uses only the standard library.
# PT: Os comandos são compilados dentro da imagem, então os contêineres do laboratório sobem na
#     hora e não precisam de rede para compilar. O projeto usa apenas a biblioteca padrão.
RUN go build -o /usr/local/bin/ ./cmd/...
CMD ["sh", "-c", "test -z \"$(gofmt -l .)\" && go vet ./... && go test ./..."]
