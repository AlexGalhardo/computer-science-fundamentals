# EN: Playwright image with Chromium already installed, pinned to the same version as the
#     `@playwright/test` package. Bun is copied in to install the dependencies and to run the
#     shop inside this same container when the bug matrix is produced. The image alone is about
#     two gigabytes: part of the cost of the top of the pyramid.
# PT: Imagem do Playwright com o Chromium já instalado, fixada na mesma versão do pacote
#     `@playwright/test`. O Bun é copiado para instalar as dependências e para rodar a loja
#     dentro deste mesmo contêiner quando a matriz de bugs é produzida. Só a imagem tem cerca de
#     dois gigabytes: parte do custo do topo da pirâmide.
# ES: Imagen de Playwright con Chromium ya instalado, fijada en la misma versión del paquete
#     `@playwright/test`. Bun se copia para instalar las dependencias y para ejecutar la tienda
#     dentro de este mismo contenedor cuando se produce la matriz de bugs. Solo la imagen pesa cerca de
#     dos gigabytes: parte del costo de la cima de la pirámide.
FROM mcr.microsoft.com/playwright:v1.63.0-noble
COPY --from=oven/bun:1.4.2 /usr/local/bin/bun /usr/local/bin/bun
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
CMD ["bun", "run", "e2e"]
