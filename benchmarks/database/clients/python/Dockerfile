# EN: Python database client of the benchmark. Every package is pinned in requirements.txt.
# PT: Cliente de banco em Python do benchmark. Todo pacote está fixado no requirements.txt.
FROM python:3.14.8-slim-trixie
ENV PYTHONDONTWRITEBYTECODE=1 PIP_NO_CACHE_DIR=1 PIP_DISABLE_PIP_VERSION_CHECK=1
WORKDIR /opt/client
COPY requirements.txt .
RUN pip install --no-deps -r requirements.txt
COPY main.py .
USER 65534:65534
ENTRYPOINT ["python", "main.py"]
