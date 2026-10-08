# EN: Dependencies are installed from the lockfile in their own layer, so editing the source does
#     not download them again and the versions are exactly the committed ones.
#     The build context is the mini-project folder, because the tests and the report import the
#     load profiles from k6/.
# PT: As dependências são instaladas a partir do lockfile em uma camada própria, então editar o
#     código não as baixa de novo e as versões são exatamente as versionadas.
#     O contexto de build é a pasta do mini-projeto, porque os testes e o relatório importam os
#     perfis de carga de k6/.
FROM oven/bun:1.4.2
WORKDIR /app/ts
COPY --chown=bun:bun ts/package.json ts/bun.lock ./
RUN chown -R bun:bun /app
USER bun
RUN bun install --frozen-lockfile
COPY --chown=bun:bun k6 /app/k6
COPY --chown=bun:bun ts .
CMD ["sh", "-c", "bun run typecheck && bun test"]
