# EN: GCC on a pinned image, plus clang-format so the format check runs with the tests. The
#     build context is the project folder, because a test compares the demo with results/demo.md.
# PT: GCC em uma imagem fixada, mais o clang-format para a checagem de formato rodar com os
#     testes. O contexto de build é a pasta do projeto, porque um teste compara a demo com results/demo.md.
FROM gcc:16.2.0-trixie
RUN apt-get update \
	&& apt-get install -y --no-install-recommends clang-format \
	&& rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY cpp/ cpp/
COPY results/demo.md results/demo.md
RUN g++ -std=c++23 -Wall -Wextra -Werror -O2 cpp/test_file_organisation.cpp -o /usr/local/bin/forg_test \
	&& g++ -std=c++23 -Wall -Wextra -Werror -O2 cpp/demo.cpp -o /usr/local/bin/forg_demo
CMD ["sh", "-c", "clang-format --dry-run --Werror cpp/*.cpp cpp/*.hpp && forg_test results/demo.md"]
