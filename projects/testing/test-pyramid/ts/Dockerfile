# EN: One image runs the shop, the type check and the three suites that need no browser (unit,
#     integration, regression) plus the smoke suite. Dependencies come from the lockfile, in
#     their own layer, so editing the source does not download them again.
# PT: Uma imagem roda a loja, a checagem de tipos e as três suítes que não precisam de navegador
#     (unitária, integração, regressão), além da suíte de fumaça. As dependências vêm do
#     lockfile, em uma camada própria, então editar o código não as baixa de novo.
FROM oven/bun:1.4.2
WORKDIR /app
COPY --chown=bun:bun package.json bun.lock ./
RUN chown bun:bun /app
USER bun
RUN bun install --frozen-lockfile
COPY --chown=bun:bun . .
CMD ["bun", "test", "tests/unit"]
