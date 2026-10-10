# EN: The build context is the mini-project folder, not ts/, because cases.json is shared
#     with the Elixir implementation. There are no dependencies: the test runner ships with
#     Bun, so nothing is downloaded and the container runs with no network.
# PT: O contexto de build é a pasta do mini-projeto, e não ts/, porque cases.json é
#     compartilhado com a implementação em Elixir. Não há dependências: o executor de testes
#     vem com o Bun, então nada é baixado e o contêiner roda sem rede.
# ES: El contexto de build es la carpeta del mini-proyecto, y no ts/, porque cases.json es
#     compartido con la implementación en Elixir. No hay dependencias: el ejecutor de pruebas
#     viene con Bun, así que no se descarga nada y el contenedor corre sin red.
FROM oven/bun:1.4.2
WORKDIR /app/ts
COPY cases.json /app/
COPY ts ./
CMD ["bun", "test"]
