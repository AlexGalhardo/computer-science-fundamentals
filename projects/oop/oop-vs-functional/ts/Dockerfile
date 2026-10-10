# EN: The build context is the mini-project folder, not ts/, because scenarios.txt is shared
#     with the other implementations and the comparison reads the Java and Elixir sources.
#     There are no dependencies: Bun runs TypeScript and the tests by itself, so nothing is
#     installed and the container runs with no network.
# PT: O contexto de build é a pasta do mini-projeto, e não ts/, porque scenarios.txt é
#     compartilhado com as outras implementações e a comparação lê os fontes de Java e Elixir.
#     Não há dependências: o Bun executa TypeScript e os testes sozinho, então nada é instalado
#     e o contêiner roda sem rede.
# ES: El contexto de build es la carpeta del miniproyecto, y no ts/, porque scenarios.txt se
#     comparte con las otras implementaciones y la comparación lee los fuentes de Java y Elixir.
#     No hay dependencias: Bun ejecuta TypeScript y las pruebas por sí solo, así que no se instala
#     nada y el contenedor corre sin red.
FROM oven/bun:1.4.2
WORKDIR /app/ts
COPY scenarios.txt /app/scenarios.txt
COPY results /app/results
COPY java/src/cart /app/java/src/cart
COPY elixir/lib/cart.ex /app/elixir/lib/cart.ex
COPY ts ./
CMD ["bun", "test"]
