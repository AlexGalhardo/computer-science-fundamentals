# EN: CPython runs the source directly, so the image only carries the files. Bytecode caching
#     is turned off: the read-only image could not store it anyway.
# PT: O CPython roda o fonte direto, então a imagem só carrega os arquivos. O cache de bytecode
#     fica desligado: a imagem somente leitura não conseguiria guardá-lo de qualquer forma.
FROM python:3.14.8-slim-trixie
ENV PYTHONDONTWRITEBYTECODE=1
COPY python/ /opt/bench/
