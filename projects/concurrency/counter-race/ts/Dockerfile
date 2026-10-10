# EN: Build context is the mini-project folder, so the same file serves docker compose and the
#     benchmark runner. No dependency is installed: Bun runs TypeScript and the tests by itself.
# PT: O contexto de build é a pasta do mini-projeto, então o mesmo arquivo serve ao docker
#     compose e ao runner de benchmark. Nenhuma dependência é instalada: o Bun roda TypeScript
#     e os testes sozinho.
# ES: El contexto de build es la carpeta del mini-proyecto, así que el mismo archivo sirve a docker
#     compose y al runner de benchmark. No se instala ninguna dependencia: Bun ejecuta TypeScript
#     y las pruebas por sí solo.
FROM oven/bun:1.4.2
WORKDIR /src
COPY ts/ .
RUN printf '#!/bin/sh\nexec bun run /src/src/demo.ts "$@"\n' > /usr/local/bin/counter-race-ts \
	&& chmod +x /usr/local/bin/counter-race-ts
CMD ["bun", "test"]
