# EN: Test image of the C++ implementation: GCC with warnings as errors, plus clang-format.
# PT: Imagem de teste da implementação em C++: GCC com avisos tratados como erro, mais clang-format.
# ES: Imagen de pruebas de la implementación en C++: GCC con advertencias tratadas como error, más clang-format.
FROM gcc:16.2.0-trixie
RUN apt-get update \
	&& apt-get install -y --no-install-recommends clang-format \
	&& rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY . .
# EN: -ffp-contract=off forbids fusing a multiplication and an addition into one instruction,
#     so the floating-point results are the same on every CPU and equal to Rust and Go.
# PT: -ffp-contract=off proíbe fundir uma multiplicação e uma soma em uma única instrução,
#     então os resultados de ponto flutuante são os mesmos em qualquer CPU e iguais aos de Rust
#     e Go.
# ES: -ffp-contract=off prohíbe fusionar una multiplicación y una suma en una sola instrucción,
#     así que los resultados de punto flotante son los mismos en cualquier CPU e iguales a los de
#     Rust y Go.
RUN g++ -std=c++23 -Wall -Wextra -Werror -O2 -ffp-contract=off -pthread main.cpp -o scaling \
	&& g++ -std=c++23 -Wall -Wextra -Werror -O2 -ffp-contract=off -pthread test_scaling.cpp -o test_scaling
CMD ["sh", "-c", "clang-format --dry-run --Werror *.cpp *.hpp && ./test_scaling"]
