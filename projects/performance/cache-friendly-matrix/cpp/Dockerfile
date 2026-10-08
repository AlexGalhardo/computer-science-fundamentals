# EN: -O3 is the level that matches a Rust release build (opt-level 3), so the comparison is
#     between memory access patterns and not between optimised and unoptimised code. At -O2, GCC
#     does not vectorise the inner loop of the interchanged variant, and the two languages would
#     no longer be doing the same work. -ffp-contract=off forbids merging a multiply and an add
#     into one fused instruction, which rounds differently: with it, the three variants and the
#     Rust version produce bit-for-bit the same matrix on every processor.
# PT: -O3 é o nível que corresponde a um build de release do Rust (opt-level 3), então a
#     comparação é entre padrões de acesso à memória e não entre código otimizado e não
#     otimizado. Em -O2 o GCC não vetoriza o laço interno da variante com laços trocados, e as
#     duas linguagens deixariam de fazer o mesmo trabalho. -ffp-contract=off proíbe fundir uma
#     multiplicação e uma soma em uma única instrução, que arredonda diferente: com ele, as três
#     variantes e a versão em Rust produzem a mesma matriz bit a bit em qualquer processador.
FROM gcc:16.2.0-trixie
WORKDIR /app
COPY . .
RUN g++ -std=c++23 -Wall -Wextra -Werror -O3 -ffp-contract=off test_matrix.cpp -o test_matrix \
	&& g++ -std=c++23 -Wall -Wextra -Werror -O3 -ffp-contract=off main.cpp -o bench
CMD ["./test_matrix"]
