# EN: Dependencies (only the type checker) come from the lockfile, in their own layer. There is
#     NO test library here, and `bun:test` is never imported: the tests are run by the framework
#     this project builds.
# PT: As dependências (só o verificador de tipos) vêm do lockfile, em uma camada própria. NÃO há
#     biblioteca de testes aqui, e o `bun:test` nunca é importado: os testes são rodados pelo
#     framework que este projeto constrói.
FROM oven/bun:1.4.2
WORKDIR /app
COPY --chown=bun:bun package.json bun.lock ./
RUN chown bun:bun /app
USER bun
RUN bun install --frozen-lockfile
COPY --chown=bun:bun . .
CMD ["sh", "-c", "bun run typecheck && bun run selftest"]
