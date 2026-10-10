# EN: Playwright image with the browsers already installed, pinned to the same version as the
#     `@playwright/test` package. Bun is copied in only to install the dependencies from the
#     lockfile. Only Chromium is used (see playwright.config.ts).
# PT: Imagem do Playwright com os navegadores já instalados, fixada na mesma versão do pacote
#     `@playwright/test`. O Bun é copiado só para instalar as dependências a partir do lockfile.
#     Apenas o Chromium é usado (veja playwright.config.ts).
# ES: Imagen de Playwright con los navegadores ya instalados, fijada en la misma versión del paquete
#     `@playwright/test`. Bun se copia solo para instalar las dependencias desde el lockfile.
#     Solo se usa Chromium (ve playwright.config.ts).
FROM mcr.microsoft.com/playwright:v1.63.0-noble
COPY --from=oven/bun:1.4.2 /usr/local/bin/bun /usr/local/bin/bun
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
CMD ["bun", "x", "playwright", "test"]
