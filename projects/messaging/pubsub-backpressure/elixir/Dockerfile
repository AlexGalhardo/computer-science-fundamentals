# EN: Elixir on a pinned image. GenStage is fetched from Hex while the image is built, at the
#     exact version of the committed `mix.lock` (`--check-locked` fails the build if the lock and
#     `mix.exs` disagree). After that the container needs no network: tests and demo run offline.
# PT: Elixir em uma imagem fixada. O GenStage é baixado do Hex durante o build da imagem, na
#     versão exata do `mix.lock` versionado (`--check-locked` falha o build se o lock e o
#     `mix.exs` discordarem). Depois disso o contêiner não precisa de rede: testes e demo rodam offline.
# ES: Elixir en una imagen fijada. GenStage se descarga de Hex mientras se construye la imagen, en
#     la versión exacta del `mix.lock` versionado (`--check-locked` hace fallar la construcción si
#     el lock y `mix.exs` discrepan). Después de eso el contenedor no necesita red: las pruebas y la
#     demo se ejecutan sin conexión.
# EN: The Alpine variant ships the CA certificates Hex needs for HTTPS; the slim Debian one does not.
# PT: A variante Alpine traz os certificados de CA que o Hex precisa para HTTPS; a Debian slim não.
# ES: La variante Alpine incluye los certificados CA que Hex necesita para HTTPS; la Debian slim no.
FROM elixir:1.20.4-otp-28-alpine
WORKDIR /app
COPY mix.exs mix.lock ./
RUN mix local.hex --force \
	&& mix deps.get --check-locked \
	&& MIX_ENV=test mix deps.compile \
	&& MIX_ENV=prod mix deps.compile
COPY . .
RUN MIX_ENV=test mix compile --warnings-as-errors && MIX_ENV=prod mix compile --warnings-as-errors
CMD ["sh", "-c", "mix format --check-formatted && mix test --trace"]
