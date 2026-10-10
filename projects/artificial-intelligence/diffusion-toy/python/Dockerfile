FROM python:3.14.8-slim-trixie
# EN: The matrices here are tiny (64 x 64). Several threads would only fight each other for them,
#     so the linear algebra library is told to use one.
# PT: As matrizes aqui são minúsculas (64 x 64). Várias threads só disputariam entre si, então a
#     biblioteca de álgebra linear é instruída a usar uma.
# ES: Las matrices aquí son diminutas (64 x 64). Varios hilos solo se las disputarían entre sí, así
#     que se le indica a la biblioteca de álgebra lineal que use uno.
ENV PYTHONDONTWRITEBYTECODE=1 PIP_NO_CACHE_DIR=1 PIP_DISABLE_PIP_VERSION_CHECK=1 \
    OPENBLAS_NUM_THREADS=1
RUN pip install numpy==2.5.3 pytest==9.1.1 ruff==0.16.10
WORKDIR /app
COPY . .
CMD ["sh", "-c", "ruff check . && ruff format --check . && pytest -q"]
