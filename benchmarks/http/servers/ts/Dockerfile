# EN: Bun HTTP server of the benchmark. No dependency to install: Bun.serve is built in.
# PT: Servidor HTTP em Bun do benchmark. Nenhuma dependência a instalar: o Bun.serve é embutido.
FROM oven/bun:1.4.2
WORKDIR /opt/server
COPY server.ts .
USER 65534:65534
EXPOSE 8080
CMD ["bun", "server.ts"]
