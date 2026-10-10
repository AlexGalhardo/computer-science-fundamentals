# EN: Dependencies are installed from the lockfile in their own layer, so changing the source
#     does not download them again. The default command is the gate: typecheck, then tests.
# PT: As dependências são instaladas a partir do lockfile em uma camada própria, então mudar o
#     código não as baixa de novo. O comando padrão é o portão: checagem de tipos e depois testes.
# ES: Las dependencias se instalan desde el lockfile en una capa propia, así que cambiar el
#     código no las descarga de nuevo. El comando por defecto es la compuerta: verificación de
#     tipos y luego pruebas.
FROM oven/bun:1.4.2
WORKDIR /app
COPY --chown=bun:bun package.json bun.lock ./
RUN chown bun:bun /app
USER bun
RUN bun install --frozen-lockfile
COPY --chown=bun:bun . .
CMD ["sh", "-c", "bun run typecheck && bun test"]
