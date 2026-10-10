# EN: GCC on a pinned image, plus clang-format so the format check runs with the tests.
# PT: GCC em uma imagem fixada, mais o clang-format para a checagem de formato rodar com os testes.
# ES: GCC en una imagen fijada, más clang-format para que la revisión de formato corra con las pruebas.
FROM gcc:16.2.0-trixie
RUN apt-get update \
	&& apt-get install -y --no-install-recommends cmake clang-format \
	&& rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY . .
RUN g++ -std=c++23 -Wall -Wextra -Werror -O2 test_trees.cpp -o /usr/local/bin/test_trees \
	&& g++ -std=c++23 -Wall -Wextra -Werror -O2 demo.cpp -o /usr/local/bin/tree_demo
CMD ["sh", "-c", "clang-format --dry-run --Werror *.cpp *.hpp && test_trees"]
