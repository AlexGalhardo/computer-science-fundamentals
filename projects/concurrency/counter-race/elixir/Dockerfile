# EN: Build context is the mini-project folder, so the same file serves docker compose and the
#     benchmark runner. The project has no dependency, so nothing is downloaded.
# PT: O contexto de build é a pasta do mini-projeto, então o mesmo arquivo serve ao docker
#     compose e ao runner de benchmark. O projeto não tem dependências, então nada é baixado.
FROM elixir:1.20.4-otp-28-slim
WORKDIR /src
COPY elixir/ .
RUN MIX_ENV=prod mix compile && MIX_ENV=test mix compile \
	&& printf '#!/bin/sh\ncd /src && MIX_ENV=prod exec mix run --no-compile -e "CounterRace.CLI.main(System.argv())" -- "$@"\n' > /usr/local/bin/counter-race-elixir \
	&& chmod +x /usr/local/bin/counter-race-elixir
CMD ["sh", "-c", "mix format --check-formatted && mix test --trace"]
