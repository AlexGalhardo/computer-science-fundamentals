# EN: Only ruff (linter and formatter) is installed. There is NO test library in this image: the
#     tests are run by the framework this project builds, which uses only the standard library.
# PT: Só o ruff (linter e formatador) é instalado. NÃO há biblioteca de testes nesta imagem: os
#     testes são rodados pelo framework que este projeto constrói, que usa só a biblioteca padrão.
FROM python:3.14.8-slim-trixie
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1 PIP_DISABLE_PIP_VERSION_CHECK=1
RUN pip install ruff==0.16.10
WORKDIR /app
COPY . .
CMD ["sh", "-c", "ruff check . && ruff format --check . && python -m selftest.bootstrap && python -m mini_xunit selftest"]
