FROM python:3.14.8-slim-trixie
# EN: OPENBLAS_NUM_THREADS=1: NumPy hands its matrix products to OpenBLAS, which by default
#     starts one thread per core. The matrices here are tiny, so the threads only get in each
#     other's way, and a single thread also makes the sums run in the same order on every run.
# PT: OPENBLAS_NUM_THREADS=1: o NumPy entrega os produtos de matrizes ao OpenBLAS, que por padrão
#     abre uma thread por núcleo. As matrizes aqui são minúsculas, então as threads só se
#     atrapalham, e uma única thread ainda faz as somas rodarem na mesma ordem em toda execução.
ENV OPENBLAS_NUM_THREADS=1 PYTHONDONTWRITEBYTECODE=1 PIP_NO_CACHE_DIR=1 PIP_DISABLE_PIP_VERSION_CHECK=1
RUN pip install numpy==2.5.3 pytest==9.1.1 ruff==0.16.10
WORKDIR /app
COPY . .
CMD ["sh", "-c", "ruff check . && ruff format --check . && pytest -q"]
