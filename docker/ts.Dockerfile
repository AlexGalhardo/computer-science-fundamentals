# EN: Base image for TypeScript mini-projects. Bun is runtime, package manager and test runner.
# PT: Imagem base dos mini-projetos em TypeScript. O Bun é runtime, gerenciador de pacotes e executor de testes.
FROM oven/bun:1.4.2
WORKDIR /app
CMD ["bun", "--version"]
