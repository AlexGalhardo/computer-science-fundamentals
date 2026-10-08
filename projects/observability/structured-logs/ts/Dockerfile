# EN: Dependencies are installed from the lockfile in their own layer, so editing the source
#     does not download them again and the versions are exactly the committed ones. The same
#     image runs the three services, the tests and the demo.
# PT: As dependências são instaladas a partir do lockfile em uma camada própria, então editar o
#     código não as baixa de novo e as versões são exatamente as versionadas. A mesma imagem
#     roda os três serviços, os testes e a demo.
FROM oven/bun:1.4.2
WORKDIR /app
COPY --chown=bun:bun package.json bun.lock ./
RUN chown bun:bun /app
USER bun
RUN bun install --frozen-lockfile
COPY --chown=bun:bun . .
CMD ["sh", "-c", "bun run typecheck && bun run test"]
