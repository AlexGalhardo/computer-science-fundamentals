# EN: One image, two jobs: the default command is the gate (formatter, vet, tests), and the
#     `inventory` service of docker-compose runs the binary built here. Modules are downloaded
#     in their own layer from go.mod and go.sum, so the tests run later with no network.
# PT: Uma imagem, dois trabalhos: o comando padrão é o portão (formatador, vet, testes), e o
#     serviço `inventory` do docker-compose roda o binário construído aqui. Os módulos são
#     baixados em uma camada própria a partir de go.mod e go.sum, então os testes rodam depois
#     sem rede.
# ES: Una imagen, dos trabajos: el comando por defecto es la compuerta (formateador, vet, pruebas), y el
#     servicio `inventory` de docker-compose ejecuta el binario construido aquí. Los módulos se
#     descargan en una capa propia a partir de go.mod y go.sum, así que las pruebas corren después
#     sin red.
FROM golang:1.27.1-bookworm
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o /usr/local/bin/inventory ./cmd/inventory && go test -count=1 -run NONE ./...
CMD ["sh", "-c", "test -z \"$(gofmt -l .)\" && go vet ./... && go test -count=1 ./..."]
