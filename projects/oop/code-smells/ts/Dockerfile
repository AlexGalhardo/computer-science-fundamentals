# EN: The two development dependencies (TypeScript and the Bun types, both pinned) are installed
#     while the image is built, from the committed lockfile, so the container needs no network
#     afterwards. The build also runs the type checker: a type error, or a `@ts-expect-error`
#     line that starts to compile, fails the build.
# PT: As duas dependências de desenvolvimento (TypeScript e os tipos do Bun, ambas fixadas) são
#     instaladas na construção da imagem, a partir do lockfile versionado, então o contêiner não
#     precisa de rede depois. O build também roda o verificador de tipos: um erro de tipo, ou
#     uma linha `@ts-expect-error` que passe a compilar, falha o build.
FROM oven/bun:1.4.2
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run typecheck
CMD ["bun", "test"]
