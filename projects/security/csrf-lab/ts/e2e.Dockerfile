# EN: Playwright image with the browsers already installed, pinned to the same version as the
#     `@playwright/test` package, so nothing is downloaded at test time. Bun is copied in to
#     install the dependencies from the same lockfile as the other image.
# PT: Imagem do Playwright com os navegadores já instalados, fixada na mesma versão do pacote
#     `@playwright/test`, então nada é baixado na hora do teste. O Bun é copiado para instalar
#     as dependências a partir do mesmo lockfile da outra imagem.
FROM mcr.microsoft.com/playwright:v1.63.0-noble
COPY --from=oven/bun:1.4.2 /usr/local/bin/bun /usr/local/bin/bun
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
CMD ["bun", "x", "playwright", "test"]
