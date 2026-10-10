# EN: Two stages. The first one generates the page and its 200 images with Bun. The second one
#     is the pinned Caddy image plus two small tools: `tc` (traffic control, for netem) and
#     `ethtool` (to turn segmentation offload off). The build context is the project folder.
# PT: Dois estágios. O primeiro gera a página e suas 200 imagens com o Bun. O segundo é a imagem
#     fixada do Caddy mais duas ferramentas pequenas: `tc` (controle de tráfego, para o netem) e
#     `ethtool` (para desligar o segmentation offload). O contexto de build é a pasta do projeto.
# ES: Dos etapas. La primera genera la página y sus 200 imágenes con Bun. La segunda es la
#     imagen fijada de Caddy más dos herramientas pequeñas: `tc` (control de tráfico, para
#     netem) y `ethtool` (para desactivar el segmentation offload). El contexto de build es la
#     carpeta del proyecto.
FROM oven/bun:1.4.2 AS site
WORKDIR /build
COPY ts/src/site.ts ts/src/build-site.ts ./
RUN bun run build-site.ts /site

FROM caddy:2.11.7-alpine
RUN apk add --no-cache iproute2-tc ethtool
COPY caddy/Caddyfile /etc/caddy/Caddyfile
COPY caddy/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh
COPY --from=site /site /srv
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
