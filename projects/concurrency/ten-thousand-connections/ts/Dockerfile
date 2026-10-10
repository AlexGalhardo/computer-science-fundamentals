# EN: One image serves three jobs: the default command runs the server, and docker-compose
#     overrides it to run the unit tests and the protocol suite. No dependency is installed.
# PT: Uma imagem faz três trabalhos: o comando padrão roda o servidor, e o docker-compose o
#     troca para rodar os testes unitários e a suíte de protocolo. Nenhuma dependência é instalada.
# ES: Una imagen hace tres trabajos: el comando por defecto ejecuta el servidor, y docker-compose lo
#     cambia para ejecutar las pruebas unitarias y la suite de protocolo. No se instala ninguna
#     dependencia.
FROM oven/bun:1.4.2
WORKDIR /src
COPY ts/ ./ts/
COPY protocol/ ./protocol/
COPY load/ ./load/
EXPOSE 8080
CMD ["bun", "run", "ts/src/server.ts"]
