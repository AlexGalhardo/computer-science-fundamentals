# EN: The build context is the mini-project folder, not elixir/, because machine.json and
#     diagram.md are shared with the TypeScript implementation. There are no dependencies, so
#     nothing is downloaded and the container runs with no network.
# PT: O contexto de build é a pasta do mini-projeto, e não elixir/, porque machine.json e
#     diagram.md são compartilhados com a implementação em TypeScript. Não há dependências,
#     então nada é baixado e o contêiner roda sem rede.
FROM elixir:1.20.4-otp-28-slim
WORKDIR /app/elixir
COPY machine.json diagram.md /app/
COPY elixir ./
RUN mix compile
CMD ["sh", "-c", "mix format --check-formatted && mix test"]
