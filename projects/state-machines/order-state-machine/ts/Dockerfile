# EN: The build context is the mini-project folder, not ts/, because machine.json and
#     diagram.md are shared with the Elixir implementation. The dependency (zod, pinned) is
#     installed while the image is built, from the committed lockfile, so the container needs
#     no network afterwards.
# PT: O contexto de build é a pasta do mini-projeto, e não ts/, porque machine.json e
#     diagram.md são compartilhados com a implementação em Elixir. A dependência (zod, fixada)
#     é instalada na construção da imagem, a partir do lockfile versionado, então o contêiner
#     não precisa de rede depois.
FROM oven/bun:1.4.2
WORKDIR /app/ts
COPY ts/package.json ts/bun.lock ./
RUN bun install --frozen-lockfile
COPY machine.json diagram.md /app/
COPY ts ./
CMD ["bun", "test"]
