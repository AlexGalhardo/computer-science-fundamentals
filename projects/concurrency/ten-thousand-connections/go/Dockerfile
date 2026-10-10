# EN: One image serves two jobs: the default command runs the server, and the go-test service
#     of docker-compose overrides it to run formatter, vet and tests.
# PT: Uma imagem faz dois trabalhos: o comando padrão roda o servidor, e o serviço go-test do
#     docker-compose o troca para rodar formatador, vet e testes.
# ES: Una imagen hace dos trabajos: el comando por defecto ejecuta el servidor, y el servicio go-test
#     de docker-compose lo cambia para ejecutar formateador, vet y pruebas.
FROM golang:1.27.1-bookworm
WORKDIR /src
COPY go/ .
RUN go build -o /usr/local/bin/server-go ./cmd/server && go test -count=1 -run NONE ./...
EXPOSE 8080
CMD ["server-go"]
