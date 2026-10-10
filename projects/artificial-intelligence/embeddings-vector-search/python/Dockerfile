FROM python:3.14.8-slim-trixie
# EN: OPENBLAS_NUM_THREADS=1: the matrices here are small, and NumPy starting many threads for
#     each tiny product is slower than one thread. One thread also keeps the order of the sums
#     fixed, so the results do not depend on how many cores the machine has.
# PT: OPENBLAS_NUM_THREADS=1: as matrizes aqui são pequenas, e o NumPy abrir várias threads para
#     cada produto minúsculo é mais lento que uma thread. Uma thread também mantém fixa a ordem
#     das somas, então os resultados não dependem de quantos núcleos a máquina tem.
# ES: OPENBLAS_NUM_THREADS=1: las matrices aquí son pequeñas, y que NumPy abra varios hilos para
#     cada producto diminuto es más lento que un solo hilo. Un solo hilo también mantiene fijo el
#     orden de las sumas, así que los resultados no dependen de cuántos núcleos tenga la máquina.
ENV PYTHONDONTWRITEBYTECODE=1 PIP_NO_CACHE_DIR=1 PIP_DISABLE_PIP_VERSION_CHECK=1 OPENBLAS_NUM_THREADS=1
RUN pip install numpy==2.5.3 pytest==9.1.1 ruff==0.16.10
WORKDIR /app
COPY . .
CMD ["sh", "-c", "ruff check . && ruff format --check . && pytest -q"]
