# EN: The build context is the project folder, because the tests also import the load-target
#     rule that k6 uses (load/target.js). Dependencies are installed from the lockfile in
#     their own layer. The same image runs the shop, the webhook receiver, the tests and the demo.
# PT: O contexto de build é a pasta do projeto, porque os testes também importam a regra de
#     alvo de carga que o k6 usa (load/target.js). As dependências são instaladas a partir do
#     lockfile em uma camada própria. A mesma imagem roda a loja, o webhook receiver, os testes
#     e a demo.
FROM oven/bun:1.4.2
WORKDIR /app/ts
RUN chown -R bun:bun /app
USER bun
COPY --chown=bun:bun ts/package.json ts/bun.lock ./
RUN bun install --frozen-lockfile
COPY --chown=bun:bun ts/ ./
COPY --chown=bun:bun load/target.js /app/load/target.js
CMD ["sh", "-c", "bun run typecheck && bun run test"]
