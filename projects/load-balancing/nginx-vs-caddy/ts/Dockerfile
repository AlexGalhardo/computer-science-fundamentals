# EN: One image serves every job of the lab: back-end instance, unit tests, integration tests
#     and experiments. Dependencies are installed from the lockfile in their own layer, so the
#     versions are exactly the committed ones. Nothing runs as root.
# PT: Uma imagem serve para todos os trabalhos do laboratório: instância de back end, testes
#     unitários, testes de integração e experimentos. As dependências são instaladas a partir
#     do lockfile em uma camada própria, então as versões são exatamente as versionadas. Nada
#     roda como root.
# ES: Una imagen sirve para todos los trabajos del laboratorio: instancia de back end, pruebas
#     unitarias, pruebas de integración y experimentos. Las dependencias se instalan desde el
#     lockfile en una capa propia, así que las versiones son exactamente las confirmadas. Nada
#     corre como root.
FROM oven/bun:1.4.2
WORKDIR /app
COPY --chown=bun:bun package.json bun.lock ./
RUN chown bun:bun /app
USER bun
RUN bun install --frozen-lockfile
COPY --chown=bun:bun . .
EXPOSE 3000
CMD ["bun", "test", "tests"]
