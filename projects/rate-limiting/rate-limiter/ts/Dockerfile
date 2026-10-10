# EN: The build context is the mini-project folder, not `ts/`, because the tests also read
#     `cases/` (the table shared with Go), `lua/` (the Redis scripts) and `results/`. The image
#     mirrors the folder, so the same relative paths work inside and outside Docker.
#     Dependencies are installed from the lockfile in their own layer: editing the source does
#     not download them again, and the versions are exactly the committed ones.
# PT: O contexto de build é a pasta do mini-projeto, não `ts/`, porque os testes também leem
#     `cases/` (a tabela compartilhada com o Go), `lua/` (os scripts do Redis) e `results/`. A
#     imagem espelha a pasta, então os mesmos caminhos relativos funcionam dentro e fora do Docker.
#     As dependências são instaladas a partir do lockfile em uma camada própria: editar o código
#     não as baixa de novo, e as versões são exatamente as versionadas.
# ES: El contexto de build es la carpeta del miniproyecto, no `ts/`, porque las pruebas también
#     leen `cases/` (la tabla compartida con Go), `lua/` (los scripts de Redis) y `results/`. La
#     imagen refleja la carpeta, así que las mismas rutas relativas funcionan dentro y fuera de Docker.
#     Las dependencias se instalan desde el lockfile en una capa propia: editar el código no las
#     descarga de nuevo, y las versiones son exactamente las versionadas.
FROM oven/bun:1.4.2
WORKDIR /app/ts
RUN chown -R bun:bun /app
USER bun
COPY --chown=bun:bun ts/package.json ts/bun.lock ./
RUN bun install --frozen-lockfile
COPY --chown=bun:bun cases /app/cases
COPY --chown=bun:bun lua /app/lua
COPY --chown=bun:bun results /app/results
COPY --chown=bun:bun ts .
CMD ["sh", "-c", "bun run typecheck && bun test tests/unit"]
