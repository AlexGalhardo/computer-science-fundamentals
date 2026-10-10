# EN: Dependencies are installed from the lockfile in their own layer, so editing the source
#     does not download them again and the versions are exactly the committed ones. The same
#     image runs the vulnerable app, the fixed app, the unit tests and the demo: only the
#     command and the environment change.
# PT: As dependências são instaladas a partir do lockfile em uma camada própria, então editar o
#     código não as baixa de novo e as versões são exatamente as versionadas. A mesma imagem
#     roda o app vulnerável, o app corrigido, os testes unitários e a demo: só mudam o comando
#     e o ambiente.
# ES: Las dependencias se instalan desde el lockfile en su propia capa, así que editar el
#     código no las descarga de nuevo y las versiones son exactamente las versionadas. La misma imagen
#     ejecuta la app vulnerable, la app corregida, las pruebas unitarias y la demo: solo cambian el comando
#     y el entorno.
FROM oven/bun:1.4.2
WORKDIR /app
COPY --chown=bun:bun package.json bun.lock ./
RUN chown bun:bun /app
USER bun
RUN bun install --frozen-lockfile
COPY --chown=bun:bun . .
CMD ["sh", "-c", "bun run typecheck && bun test"]
