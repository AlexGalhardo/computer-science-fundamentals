# EN: The dependency (zod, pinned) is installed while the image is built, from the committed
#     lockfile. After that the container needs no network: tests and demo run with none.
# PT: A dependência (zod, fixada) é instalada na construção da imagem, a partir do lockfile
#     versionado. Depois disso o contêiner não precisa de rede: testes e demo rodam sem ela.
# ES: La dependencia (zod, fijada) se instala al construir la imagen, a partir del lockfile
#     versionado. Después de eso el contenedor no necesita red: las pruebas y la demo corren sin ella.
FROM oven/bun:1.4.2
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
CMD ["bun", "test"]
