FROM python:3.14.8-slim-trixie
ENV PYTHONDONTWRITEBYTECODE=1 PIP_NO_CACHE_DIR=1 PIP_DISABLE_PIP_VERSION_CHECK=1
RUN pip install pytest==9.1.1 ruff==0.16.10
WORKDIR /app
# EN: A test compares the Python output with the fixture written by the Rust version.
# PT: Um teste compara a saída do Python com o fixture escrito pela versão em Rust.
# ES: Una prueba compara la salida de Python con el fixture escrito por la versión en Rust.
COPY fixtures ./fixtures
COPY results ./results
COPY python ./python
WORKDIR /app/python
CMD ["sh", "-c", "ruff check . && ruff format --check . && pytest -q"]
