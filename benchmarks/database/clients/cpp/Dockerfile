# EN: C++ database client of the benchmark. libpq comes from the Debian release of the pinned
#     base image (trixie), which fixes its version line. The exact version is printed at build
#     time and recorded in the results by the collector.
# PT: Cliente de banco em C++ do benchmark. A libpq vem da versão do Debian da imagem base
#     fixada (trixie), o que fixa a linha de versão dela. A versão exata é impressa no build e
#     registrada nos resultados pelo coletor.
# ES: Cliente de base de datos en C++ del benchmark. libpq viene de la versión de Debian de la
#     imagen base fijada (trixie), lo que fija su línea de versión. La versión exacta se imprime
#     en el build y la registra el recolector en los resultados.
FROM gcc:16.2.0-trixie
RUN apt-get update \
	&& apt-get install -y --no-install-recommends libpq-dev \
	&& rm -rf /var/lib/apt/lists/* \
	&& dpkg-query -W -f '${Version}\n' libpq-dev > /opt/libpq-version
WORKDIR /src
COPY main.cpp .
RUN mkdir -p /opt/client \
	&& g++ -std=c++23 -O2 -Wall -Wextra -Werror -pthread -I/usr/include/postgresql main.cpp -o /opt/client/main -lpq
USER 65534:65534
ENTRYPOINT ["/opt/client/main"]
