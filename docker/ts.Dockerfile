# EN: Base image for TypeScript mini-projects. Bun is runtime, package manager and test runner.
# PT: Imagem base dos mini-projetos em TypeScript. O Bun é runtime, gerenciador de pacotes e executor de testes.
# ES: Imagen base de los mini-proyectos en TypeScript. Bun es runtime, gestor de paquetes y ejecutor de pruebas.
FROM oven/bun:1.4.2
WORKDIR /app
CMD ["bun", "--version"]
