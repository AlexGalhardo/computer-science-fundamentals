# EN: The build context is the mini-project folder, not elixir/, because scenarios.txt is shared
#     with the other implementations. There are no dependencies, so nothing is downloaded and
#     the container runs with no network.
# PT: O contexto de build é a pasta do mini-projeto, e não elixir/, porque scenarios.txt é
#     compartilhado com as outras implementações. Não há dependências, então nada é baixado e o
#     contêiner roda sem rede.
FROM elixir:1.20.4-otp-28-slim
WORKDIR /app/elixir
COPY scenarios.txt /app/scenarios.txt
COPY elixir ./
RUN mix compile --warnings-as-errors
CMD ["sh", "-c", "mix format --check-formatted && mix test"]
