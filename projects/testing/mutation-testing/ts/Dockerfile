# EN: Dependencies (only the type checker) come from the lockfile, in their own layer. The
#     mutator and the tests use nothing but Bun itself.
# PT: As dependências (só o verificador de tipos) vêm do lockfile, em uma camada própria. O
#     mutador e os testes não usam nada além do próprio Bun.
FROM oven/bun:1.4.2
WORKDIR /app
COPY --chown=bun:bun package.json bun.lock ./
RUN chown bun:bun /app
USER bun
RUN bun install --frozen-lockfile
COPY --chown=bun:bun . .
CMD ["sh", "-c", "bun run typecheck && bun test"]
