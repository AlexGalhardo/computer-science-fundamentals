# EN: Elixir HTTP server of the benchmark, built as an OTP release in production mode: a
#     self-contained folder with the compiled application and the Erlang runtime.
#     The slim image has no CA certificates, and Hex needs them to download packages.
# PT: Servidor HTTP em Elixir do benchmark, construído como release OTP em modo de produção:
#     uma pasta autocontida com a aplicação compilada e o runtime do Erlang.
#     A imagem slim não traz certificados de CA, e o Hex precisa deles para baixar pacotes.
# ES: Servidor HTTP en Elixir del benchmark, construido como release OTP en modo de producción:
#     una carpeta autocontenida con la aplicación compilada y el runtime de Erlang.
#     La imagen slim no trae certificados de CA, y Hex los necesita para descargar paquetes.
FROM elixir:1.20.4-otp-28-slim
RUN apt-get update \
	&& apt-get install -y --no-install-recommends ca-certificates \
	&& rm -rf /var/lib/apt/lists/*
ENV MIX_ENV=prod
WORKDIR /src
RUN mix local.hex --force && mix local.rebar --force
COPY mix.exs mix.lock ./
RUN mix deps.get --only prod --check-locked && mix deps.compile
COPY config config
COPY lib lib
RUN mix release --path /opt/server
ENV HOME=/tmp
USER 65534:65534
EXPOSE 8080
CMD ["/opt/server/bin/server", "start"]
