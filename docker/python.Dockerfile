# EN: Base image for Python mini-projects, with ruff (linter and formatter) and pytest pinned.
# PT: Imagem base dos mini-projetos em Python, com ruff (linter e formatador) e pytest fixados.
# ES: Imagen base de los mini-proyectos en Python, con ruff (linter y formateador) y pytest fijados.
FROM python:3.14.8-slim-trixie
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1 PIP_DISABLE_PIP_VERSION_CHECK=1
RUN pip install ruff==0.16.10 pytest==9.1.1
WORKDIR /app
CMD ["python", "--version"]
