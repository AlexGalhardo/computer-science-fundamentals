# EN: Dependencies are installed from the lockfile in their own layer. Then the Prisma client is
#     generated from the schema: it is code produced by a tool, so it is built into the image
#     instead of being committed.
# PT: As dependências são instaladas a partir do lockfile em uma camada própria. Depois o cliente
#     do Prisma é gerado a partir do schema: é código produzido por uma ferramenta, então é
#     construído dentro da imagem em vez de versionado.
# ES: Las dependencias se instalan desde el lockfile en su propia capa. Después el cliente de Prisma
#     se genera a partir del schema: es código producido por una herramienta, así que se construye
#     dentro de la imagen en lugar de versionarse.
FROM oven/bun:1.4.2
WORKDIR /app
COPY --chown=bun:bun package.json bun.lock ./
RUN chown bun:bun /app
USER bun
RUN bun install --frozen-lockfile
COPY --chown=bun:bun . .
RUN bun run generate
CMD ["sh", "-c", "bun run typecheck && bun test"]
