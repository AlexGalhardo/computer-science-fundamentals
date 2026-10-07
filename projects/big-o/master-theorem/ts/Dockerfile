# EN: The dependency (zod, pinned) is installed while the image is built, from the committed
#     lockfile. After that the container needs no network: tests and demo run with none.
# PT: A dependência (zod, fixada) é instalada na construção da imagem, a partir do lockfile
#     versionado. Depois disso o contêiner não precisa de rede: testes e demo rodam sem ela.
FROM oven/bun:1.4.2
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
CMD ["bun", "test"]
