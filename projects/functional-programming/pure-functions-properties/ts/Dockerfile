# EN: The build context is the mini-project folder, not ts/, because cases.json is shared
#     with the Elixir implementation. There are no dependencies: the test runner ships with
#     Bun, so nothing is downloaded and the container runs with no network.
# PT: O contexto de build é a pasta do mini-projeto, e não ts/, porque cases.json é
#     compartilhado com a implementação em Elixir. Não há dependências: o executor de testes
#     vem com o Bun, então nada é baixado e o contêiner roda sem rede.
FROM oven/bun:1.4.2
WORKDIR /app/ts
COPY cases.json /app/
COPY ts ./
CMD ["bun", "test"]
