FROM python:3.14.8-slim-trixie
ENV PYTHONDONTWRITEBYTECODE=1 PIP_NO_CACHE_DIR=1 PIP_DISABLE_PIP_VERSION_CHECK=1
RUN pip install pytest==9.1.1 ruff==0.16.10
WORKDIR /app
# EN: A Python test checks that the committed SQLite fixture is still what SQLite answers.
# PT: Um teste em Python confere que o fixture do SQLite versionado ainda é o que o SQLite responde.
COPY fixtures ./fixtures
COPY python ./python
WORKDIR /app/python
CMD ["sh", "-c", "ruff check . && ruff format --check . && pytest -q"]
