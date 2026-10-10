# EN: No dependency to install: Bun is runtime and test runner, and the project uses nothing
#     else. The container therefore needs no network, neither to build nor to run.
# PT: Nenhuma dependência para instalar: o Bun é o runtime e o executor de testes, e o projeto
#     não usa mais nada. O contêiner, portanto, não precisa de rede, nem para construir nem
#     para rodar.
# ES: Ninguna dependencia que instalar: Bun es el runtime y el ejecutor de pruebas, y el proyecto
#     no usa nada más. Por lo tanto, el contenedor no necesita red, ni para construir ni para
#     ejecutar.
FROM oven/bun:1.4.2
WORKDIR /app
COPY . .
CMD ["bun", "test"]
