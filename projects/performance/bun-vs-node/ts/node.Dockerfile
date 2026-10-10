# EN: The Node.js image, in two stages. Node runs JavaScript, so the TypeScript source is first
#     compiled into one CommonJS file (stage 1, with Bun as the build tool). Stage 2 is the
#     official Node.js LTS image with PM2 pinned, and it contains only the compiled file: the
#     same image runs `node` alone or `pm2-runtime` in cluster mode, depending on the command.
# PT: A imagem do Node.js, em dois estágios. O Node executa JavaScript, então o código TypeScript é
#     primeiro compilado em um único arquivo CommonJS (estágio 1, com o Bun como ferramenta de
#     build). O estágio 2 é a imagem oficial do Node.js LTS com o PM2 fixado, e contém só o arquivo
#     compilado: a mesma imagem roda `node` sozinho ou `pm2-runtime` em modo cluster, conforme o comando.
# ES: La imagen de Node.js, en dos etapas. Node ejecuta JavaScript, así que el código TypeScript se
#     compila primero a un único archivo CommonJS (etapa 1, con Bun como herramienta de build). La
#     etapa 2 es la imagen oficial de Node.js LTS con PM2 fijado, y contiene solo el archivo
#     compilado: la misma imagen ejecuta `node` solo o `pm2-runtime` en modo cluster, según el comando.
FROM oven/bun:1.4.2 AS build
WORKDIR /app/ts
COPY ts/package.json ts/bun.lock ./
RUN bun install --frozen-lockfile
COPY ts .
RUN bun run build:node

FROM node:24.21.0-bookworm-slim
RUN npm install --global pm2@7.0.4 && npm cache clean --force
WORKDIR /app
COPY --from=build /app/ts/dist/node-server.cjs dist/node-server.cjs
COPY ts/ecosystem.config.cjs ./
USER node
CMD ["node", "dist/node-server.cjs"]
