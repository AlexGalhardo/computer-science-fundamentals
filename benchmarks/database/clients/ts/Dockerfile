# EN: Bun database client of the benchmark. Nothing to install: Bun.sql is built in.
# PT: Cliente de banco em Bun do benchmark. Nada a instalar: o Bun.sql é embutido.
# ES: Cliente de base de datos en Bun del benchmark. Nada que instalar: Bun.sql viene integrado.
FROM oven/bun:1.4.2
WORKDIR /opt/client
COPY main.ts .
USER 65534:65534
ENTRYPOINT ["bun", "main.ts"]
