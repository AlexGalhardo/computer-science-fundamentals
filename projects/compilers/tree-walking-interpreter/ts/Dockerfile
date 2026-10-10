# EN: The build context is the project folder, because the tests run the example programs in
#     `examples/`. There is no dependency to install: the interpreter uses only the language.
# PT: O contexto de build é a pasta do projeto, porque os testes executam os programas de exemplo
#     em `examples/`. Não há dependência a instalar: o interpretador usa apenas a linguagem.
# ES: El contexto de build es la carpeta del proyecto, porque las pruebas ejecutan los programas
#     de ejemplo en `examples/`. No hay dependencias que instalar: el intérprete usa solo el
#     lenguaje.
FROM oven/bun:1.4.2
WORKDIR /app
COPY examples ./examples
COPY ts ./ts
WORKDIR /app/ts
USER bun
CMD ["bun", "test"]
