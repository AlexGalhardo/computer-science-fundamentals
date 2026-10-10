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
# ES: -O3 es el nivel que corresponde a un build release de Rust (opt-level 3), así que la
#     comparación es entre patrones de acceso a la memoria y no entre código optimizado y no
#     optimizado. En -O2 GCC no vectoriza el bucle interno de la variante con bucles intercambiados,
#     y los dos lenguajes dejarían de hacer el mismo trabajo. -ffp-contract=off prohíbe fusionar una
#     multiplicación y una suma en una sola instrucción, que redondea distinto: con él, las tres
#     variantes y la versión en Rust producen la misma matriz bit a bit en cualquier procesador.
FROM gcc:16.2.0-trixie
WORKDIR /app
COPY . .
RUN g++ -std=c++23 -Wall -Wextra -Werror -O3 -ffp-contract=off test_matrix.cpp -o test_matrix \
	&& g++ -std=c++23 -Wall -Wextra -Werror -O3 -ffp-contract=off main.cpp -o bench
CMD ["./test_matrix"]
