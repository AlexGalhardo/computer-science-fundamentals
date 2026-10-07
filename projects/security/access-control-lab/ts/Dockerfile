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
# EN: Tells the test suite it runs inside the lab container, where the "no outside access" test
#     is meaningful. On a developer machine that test is skipped.
# PT: Avisa a suíte de testes que ela roda dentro do contêiner do laboratório, onde o teste de
#     "sem acesso externo" faz sentido. Na máquina do desenvolvedor esse teste é pulado.
ENV LAB_IN_DOCKER=1
CMD ["sh", "-c", "bun run typecheck && bun test"]
