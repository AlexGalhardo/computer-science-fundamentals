# EN: The build context is the mini-project folder, because programs/ and results/trace.txt are
#     shared with the Go version.
# PT: O contexto de build é a pasta do mini-projeto, porque programs/ e results/trace.txt são
#     compartilhados com a versão em Go.
FROM oven/bun:1.4.2
WORKDIR /app
COPY ts/ ./
COPY programs/ ./programs/
COPY results/trace.txt ./results/trace.txt
CMD ["bun", "test"]
