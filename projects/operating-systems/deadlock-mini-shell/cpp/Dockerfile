FROM gcc:16.2.0-trixie
# EN: clang-format is the only tool added, the same way docker/cpp.Dockerfile adds it.
# PT: O clang-format é a única ferramenta acrescentada, do mesmo modo que em docker/cpp.Dockerfile.
# ES: clang-format es la única herramienta añadida, del mismo modo que en docker/cpp.Dockerfile.
RUN apt-get update \
	&& apt-get install -y --no-install-recommends clang-format \
	&& rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY . .
RUN g++ -std=c++23 -Wall -Wextra -Werror -O2 msh.cpp -o msh \
	&& g++ -std=c++23 -Wall -Wextra -Werror -O2 test_parser.cpp -o test_parser
CMD ["sh", "-c", "clang-format --dry-run --Werror *.cpp *.hpp && ./test_parser && bash test_shell.sh"]
