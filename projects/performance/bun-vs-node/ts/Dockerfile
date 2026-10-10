# EN: The Bun image: it serves the API on Bun, runs the tests and writes the report.
#     Dependencies are installed from the lockfile in their own layer, so editing the source does
#     not download them again and the versions are exactly the committed ones.
#     The build context is the mini-project folder, because the tests import load/target.js.
# PT: A imagem do Bun: serve a API no Bun, roda os testes e grava o relatório.
#     As dependências são instaladas a partir do lockfile em uma camada própria, então editar o
#     código não as baixa de novo e as versões são exatamente as versionadas.
#     O contexto de build é a pasta do mini-projeto, porque os testes importam load/target.js.
# ES: La imagen de Bun: sirve la API en Bun, ejecuta las pruebas y escribe el reporte.
#     Las dependencias se instalan desde el lockfile en una capa propia, así que editar el código no
#     las vuelve a descargar y las versiones son exactamente las versionadas.
#     El contexto de build es la carpeta del miniproyecto, porque las pruebas importan load/target.js.
FROM oven/bun:1.4.2
WORKDIR /app/ts
COPY --chown=bun:bun ts/package.json ts/bun.lock ./
RUN chown -R bun:bun /app
USER bun
RUN bun install --frozen-lockfile
COPY --chown=bun:bun load /app/load
COPY --chown=bun:bun ts .
CMD ["sh", "-c", "bun run typecheck && bun run test"]
