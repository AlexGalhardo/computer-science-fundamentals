FROM python:3.14.8-slim-trixie
ENV PYTHONDONTWRITEBYTECODE=1 PIP_NO_CACHE_DIR=1 PIP_DISABLE_PIP_VERSION_CHECK=1
RUN pip install --index-url https://download.pytorch.org/whl/cpu torch==2.14.1 && pip install numpy==2.5.3 pytest==9.1.1 ruff==0.16.10
WORKDIR /app
COPY . .
CMD ["sh", "-c", "ruff check . && ruff format --check . && pytest -q"]
