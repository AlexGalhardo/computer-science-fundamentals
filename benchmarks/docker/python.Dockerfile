# EN: CPython runs the source directly, so the image only carries the files. Bytecode caching
#     is turned off: the read-only image could not store it anyway.
# PT: O CPython roda o fonte direto, então a imagem só carrega os arquivos. O cache de bytecode
#     fica desligado: a imagem somente leitura não conseguiria guardá-lo de qualquer forma.
# ES: CPython ejecuta el código fuente directo, así la imagen solo carga los archivos. La caché de
#     bytecode queda desactivada: la imagen de solo lectura no podría guardarla de todos modos.
FROM python:3.14.8-slim-trixie
ENV PYTHONDONTWRITEBYTECODE=1
COPY python/ /opt/bench/
