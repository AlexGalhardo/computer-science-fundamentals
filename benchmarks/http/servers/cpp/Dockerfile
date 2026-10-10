# EN: C++ HTTP server of the benchmark. The two libraries are single header files, downloaded
#     at fixed release tags and included as system headers so their own warnings do not fail
#     the build.
# PT: Servidor HTTP em C++ do benchmark. As duas bibliotecas são arquivos de header único,
#     baixados em tags de release fixas e incluídos como headers de sistema para que os avisos
#     delas não quebrem o build.
# ES: Servidor HTTP en C++ del benchmark. Las dos bibliotecas son archivos de un solo header,
#     descargados en tags de release fijos e incluidos como headers de sistema para que sus
#     advertencias no rompan el build.
FROM gcc:16.2.0-trixie
ARG HTTPLIB_VERSION=v0.60.0
ARG NLOHMANN_JSON_VERSION=v3.12.0
ADD https://raw.githubusercontent.com/yhirose/cpp-httplib/${HTTPLIB_VERSION}/httplib.h /opt/include/httplib.h
ADD https://raw.githubusercontent.com/nlohmann/json/${NLOHMANN_JSON_VERSION}/single_include/nlohmann/json.hpp /opt/include/nlohmann/json.hpp
WORKDIR /src
COPY main.cpp .
RUN mkdir -p /opt/server \
	&& g++ -std=c++23 -O2 -Wall -Wextra -Werror -pthread -isystem /opt/include main.cpp -o /opt/server/main
USER 65534:65534
EXPOSE 8080
CMD ["/opt/server/main"]
