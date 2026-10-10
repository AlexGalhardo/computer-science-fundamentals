# EN: Go database client of the benchmark. go.mod pins pgx and go.sum holds the checksum of
#     every module, so the build fails if a download differs from what was committed.
# PT: Cliente de banco em Go do benchmark. O go.mod fixa o pgx e o go.sum guarda o checksum de
#     cada módulo, então o build falha se um download for diferente do que foi versionado.
# ES: Cliente de base de datos en Go del benchmark. go.mod fija pgx y go.sum guarda el checksum de
#     cada módulo, así el build falla si una descarga es distinta de lo que se versionó.
FROM golang:1.27.1-bookworm
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY main.go .
RUN CGO_ENABLED=0 go build -mod=readonly -o /opt/client/main .
USER 65534:65534
ENTRYPOINT ["/opt/client/main"]
