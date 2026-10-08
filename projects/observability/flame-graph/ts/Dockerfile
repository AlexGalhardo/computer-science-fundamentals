# EN: Dependencies are installed from the lockfile in their own layer, so editing the source
#     does not download them again and the versions are exactly the committed ones. The same
#     image runs the server, the load generator, the renderer and the tests. Everything is
#     readable by any user, because the steps that write results run as the host user.
# PT: As dependências são instaladas a partir do lockfile em uma camada própria, então editar o
#     código não as baixa de novo e as versões são exatamente as versionadas. A mesma imagem
#     roda o servidor, o gerador de carga, o renderizador e os testes. Tudo é legível por
#     qualquer usuário, porque as etapas que gravam resultados rodam como o usuário do host.
FROM oven/bun:1.4.2
ENV HOME=/tmp
WORKDIR /app
COPY --chown=bun:bun package.json bun.lock ./
RUN chown bun:bun /app
USER bun
RUN bun install --frozen-lockfile
COPY --chown=bun:bun . .
CMD ["sh", "-c", "bun run typecheck && bun test"]
