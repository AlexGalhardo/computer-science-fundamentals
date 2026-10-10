# EN: Playwright image with Chromium already installed, pinned to the same version as the
#     `@playwright/test` package. Bun is copied in to install the dependencies from the lockfile
#     and to run the scripts. The default command is the gate: typecheck, then the tests.
# PT: Imagem do Playwright com o Chromium já instalado, fixada na mesma versão do pacote
#     `@playwright/test`. O Bun é copiado para instalar as dependências a partir do lockfile e
#     rodar os scripts. O comando padrão é o portão: checagem de tipos e depois os testes.
# ES: Imagen de Playwright con Chromium ya instalado, fijada en la misma versión del paquete
#     `@playwright/test`. Bun se copia para instalar las dependencias desde el lockfile y
#     ejecutar los scripts. El comando por defecto es la compuerta: chequeo de tipos y luego
#     las pruebas.
FROM mcr.microsoft.com/playwright:v1.63.0-noble
COPY --from=oven/bun:1.4.2 /usr/local/bin/bun /usr/local/bin/bun
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
# EN: The measurement runs as the host user (see docker-compose.yml), which has no home folder
#     in this image. Chromium and Playwright need a writable one.
# PT: A medição roda como o usuário do host (veja docker-compose.yml), que não tem pasta home
#     nesta imagem. O Chromium e o Playwright precisam de uma com permissão de escrita.
# ES: La medición corre como el usuario del host (ver docker-compose.yml), que no tiene carpeta
#     home en esta imagen. Chromium y Playwright necesitan una con permiso de escritura.
ENV HOME=/tmp
RUN chmod -R a+rwX /app
CMD ["sh", "-c", "bun run typecheck && bun run test"]
