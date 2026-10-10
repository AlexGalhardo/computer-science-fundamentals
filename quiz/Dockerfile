# EN: Three stages. `deps` installs pinned dependencies, `build` pre-renders every page into
#     static files, and the final stage is only a file server with those files. The build
#     context is the repository root, because the Bun lockfile lives there.
# PT: Três estágios. `deps` instala as dependências fixadas, `build` pré-renderiza todas as
#     páginas em arquivos estáticos, e o estágio final é só um servidor de arquivos com eles.
#     O contexto de build é a raiz do repositório, porque o lockfile do Bun fica lá.
# ES: Tres etapas. `deps` instala las dependencias fijadas, `build` pre-renderiza todas las
#     páginas en archivos estáticos, y la etapa final es solo un servidor de archivos con ellos.
#     El contexto de build es la raíz del repositorio, porque el lockfile de Bun está allí.
FROM oven/bun:1.4.2 AS deps
WORKDIR /repo
COPY package.json bun.lock ./
COPY quiz/package.json quiz/package.json
COPY tools/bench/package.json tools/bench/package.json
COPY tools/scaffold/package.json tools/scaffold/package.json
RUN bun install --frozen-lockfile

FROM deps AS build
# EN: QUIZ_CONTENT_DIR chooses the questions. The tests build with a small fixture.
# PT: QUIZ_CONTENT_DIR escolhe as questões. Os testes fazem o build com um fixture pequeno.
# ES: QUIZ_CONTENT_DIR elige las preguntas. Las pruebas hacen el build con un fixture pequeño.
ARG QUIZ_CONTENT_DIR=content
ENV QUIZ_CONTENT_DIR=${QUIZ_CONTENT_DIR} NEXT_TELEMETRY_DISABLED=1
COPY biome.json ./
COPY quiz quiz
WORKDIR /repo/quiz
RUN bun run typecheck && bun --bun run build

# EN: Unit tests run on the same sources as the build.
# PT: Os testes unitários rodam sobre as mesmas fontes do build.
# ES: Las pruebas unitarias corren sobre las mismas fuentes del build.
FROM build AS unit
CMD ["bun", "test", "tests/unit"]

FROM caddy:2.11.7-alpine AS serve
COPY quiz/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /repo/quiz/out /srv
EXPOSE 8080
