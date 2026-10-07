# EN: Playwright image with the browsers already installed, pinned to the same version as the
#     `@playwright/test` package. Bun is copied in to install the workspace dependencies.
# PT: Imagem do Playwright com os navegadores já instalados, fixada na mesma versão do pacote
#     `@playwright/test`. O Bun é copiado para instalar as dependências do workspace.
FROM mcr.microsoft.com/playwright:v1.64.0-noble
COPY --from=oven/bun:1.4.2 /usr/local/bin/bun /usr/local/bin/bun
WORKDIR /repo
COPY package.json bun.lock ./
COPY quiz/package.json quiz/package.json
COPY tools/bench/package.json tools/bench/package.json
COPY tools/scaffold/package.json tools/scaffold/package.json
RUN bun install --frozen-lockfile
COPY quiz quiz
WORKDIR /repo/quiz
CMD ["bun", "x", "playwright", "test"]
