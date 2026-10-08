# EN: The build context is the mini-project folder, not elixir/, because cases.json is
#     shared with the TypeScript implementation. There are no dependencies: the JSON decoder
#     and the test framework ship with Elixir, so nothing is downloaded and the container
#     runs with no network.
# PT: O contexto de build é a pasta do mini-projeto, e não elixir/, porque cases.json é
#     compartilhado com a implementação em TypeScript. Não há dependências: o decodificador
#     de JSON e o framework de testes vêm com o Elixir, então nada é baixado e o contêiner
#     roda sem rede.
FROM elixir:1.20.4-otp-28-slim
WORKDIR /app/elixir
COPY cases.json /app/
COPY elixir ./
RUN mix compile --warnings-as-errors
CMD ["sh", "-c", "mix format --check-formatted && mix test"]
