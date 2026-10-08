# EN: Python HTTP server of the benchmark. Every package, direct or transitive, is pinned in
#     requirements.txt. `--log-level warning` turns the access log off: printing one line per
#     request would be measured as server work.
# PT: Servidor HTTP em Python do benchmark. Todo pacote, direto ou transitivo, está fixado no
#     requirements.txt. O `--log-level warning` desliga o log de acesso: imprimir uma linha
#     por requisição seria medido como trabalho do servidor.
FROM python:3.14.8-slim-trixie
ENV PYTHONDONTWRITEBYTECODE=1 PIP_NO_CACHE_DIR=1 PIP_DISABLE_PIP_VERSION_CHECK=1
WORKDIR /opt/server
COPY requirements.txt .
RUN pip install --no-deps -r requirements.txt
COPY server.py .
USER 65534:65534
EXPOSE 8080
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8080", "--log-level", "warning"]
