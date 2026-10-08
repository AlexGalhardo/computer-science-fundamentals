FROM python:3.13.16-slim-trixie
ENV PYTHONDONTWRITEBYTECODE=1 PIP_NO_CACHE_DIR=1 PIP_DISABLE_PIP_VERSION_CHECK=1 TF_CPP_MIN_LOG_LEVEL=2
RUN pip install tensorflow==2.21.0 pytest==9.1.1 ruff==0.16.10
WORKDIR /app
COPY . .
CMD ["sh", "-c", "ruff check . && ruff format --check . && pytest -q"]
