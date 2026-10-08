# EN: One image runs the tests, the repeat script and the unstable service of the lab.
#     Dependencies come from the lockfile, in their own layer.
# PT: Uma imagem roda os testes, o script de repetição e o serviço instável do laboratório.
#     As dependências vêm do lockfile, em uma camada própria.
FROM oven/bun:1.4.2
WORKDIR /app
COPY --chown=bun:bun package.json bun.lock ./
RUN chown bun:bun /app
USER bun
RUN bun install --frozen-lockfile
COPY --chown=bun:bun . .
CMD ["sh", "-c", "bun run typecheck && bun run test"]
