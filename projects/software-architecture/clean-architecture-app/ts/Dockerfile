# EN: Dependencies are installed from the lockfile in their own layer, so editing the source
#     does not download them again and the versions are exactly the committed ones.
# PT: As dependências são instaladas a partir do lockfile em uma camada própria, então editar o
#     código não as baixa de novo e as versões são exatamente as versionadas.
FROM oven/bun:1.4.2
WORKDIR /app
COPY --chown=bun:bun package.json bun.lock ./
RUN chown bun:bun /app
USER bun
RUN bun install --frozen-lockfile
COPY --chown=bun:bun . .
# EN: The default command is the whole gate: types, the dependency rule, then the unit tests.
# PT: O comando padrão é o portão inteiro: tipos, a regra de dependência, depois os testes de unidade.
CMD ["sh", "-c", "bun run typecheck && bun run check:layers && bun run test"]
