# EN: Go on a pinned image. gofmt ships with Go and golangci-lint comes from its own pinned image.
# PT: Go em uma imagem fixada. O gofmt vem com o Go e o golangci-lint vem da sua própria imagem fixada.
FROM golangci/golangci-lint:v2.14.0 AS lint
FROM golang:1.27.1-bookworm
COPY --from=lint /usr/bin/golangci-lint /usr/local/bin/golangci-lint
WORKDIR /app
COPY . .
RUN go build -o /usr/local/bin/lbt_demo ./cmd/demo \
	&& go test -count=1 -run XXX ./...
CMD ["sh", "-c", "test -z \"$(gofmt -l .)\" && go vet ./... && golangci-lint run ./... && go test -count=1 ./..."]
