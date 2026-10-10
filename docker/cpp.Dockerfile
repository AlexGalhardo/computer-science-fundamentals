# EN: Base image for C++ mini-projects: GCC, CMake and clang-format.
# PT: Imagem base dos mini-projetos em C++: GCC, CMake e clang-format.
# ES: Imagen base de los mini-proyectos en C++: GCC, CMake y clang-format.
FROM gcc:16.2.0-trixie
RUN apt-get update \
	&& apt-get install -y --no-install-recommends cmake clang-format \
	&& rm -rf /var/lib/apt/lists/*
WORKDIR /app
CMD ["g++", "--version"]
