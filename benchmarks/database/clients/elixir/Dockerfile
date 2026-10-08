# EN: Elixir database client of the benchmark, compiled in production mode. The slim image has
#     no CA certificates, and Hex needs them to download packages.
# PT: Cliente de banco em Elixir do benchmark, compilado em modo de produção. A imagem slim não
#     traz certificados de CA, e o Hex precisa deles para baixar pacotes.
FROM elixir:1.20.4-otp-28-slim
RUN apt-get update \
	&& apt-get install -y --no-install-recommends ca-certificates \
	&& rm -rf /var/lib/apt/lists/*
ENV MIX_ENV=prod
WORKDIR /opt/client
RUN mix local.hex --force && mix local.rebar --force
COPY mix.exs mix.lock ./
RUN mix deps.get --only prod --check-locked && mix deps.compile
COPY lib lib
RUN mix compile
ENTRYPOINT ["mix", "run", "--no-compile", "--no-deps-check", "-e", "Client.main(System.argv())", "--"]
