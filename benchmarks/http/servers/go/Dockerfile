# EN: Go HTTP server of the benchmark, built as a static binary on the pinned image.
# PT: Servidor HTTP em Go do benchmark, compilado como binário estático na imagem fixada.
FROM golang:1.27.1-bookworm
WORKDIR /src
COPY . .
RUN CGO_ENABLED=0 go build -o /opt/server/main .
USER 65534:65534
EXPOSE 8080
CMD ["/opt/server/main"]
