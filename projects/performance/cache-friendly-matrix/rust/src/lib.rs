// EN: Three ways to multiply two n x n matrices, the same as the C++ version. All three do
//     exactly the same n^3 multiplications and additions, so their Big O is the same. What
//     changes is the ORDER in which memory is visited.
//
//     A matrix is a flat slice stored row-major: element (i, j) lives at index i * n + j, so a
//     row is contiguous and a column is not. The processor fetches memory one cache line at a
//     time (64 bytes, which is 8 values of type f64). Walking along a row costs one cache miss
//     every 8 elements. Walking down a column jumps n * 8 bytes each step: every element is on a
//     different line.
// PT: Três formas de multiplicar duas matrizes n x n, as mesmas da versão em C++. As três fazem
//     exatamente as mesmas n^3 multiplicações e somas, então o Big O é o mesmo. O que muda é a
//     ORDEM em que a memória é visitada.
// ES: Tres formas de multiplicar dos matrices n x n, las mismas de la versión en C++. Las tres
//     hacen exactamente las mismas n^3 multiplicaciones y sumas, así que el Big O es el mismo. Lo
//     que cambia es el ORDEN en que se visita la memoria.
//
//     A matriz é um slice plano guardado por linhas (row-major): o elemento (i, j) fica no
//     índice i * n + j, então uma linha é contígua e uma coluna não. O processador busca a
//     memória uma linha de cache por vez (64 bytes, ou 8 valores do tipo f64). Andar ao longo de
//     uma linha custa uma falta de cache a cada 8 elementos. Descer uma coluna salta n * 8 bytes
//     a cada passo: cada elemento está em uma linha diferente.

pub const CACHE_LINE_BYTES: usize = 64;
pub const DEFAULT_BLOCK: usize = 64;

// EN: Deterministic input from a fixed seed (a linear congruential generator), identical to the
//     C++ one, so both languages multiply the same matrices and their checksums can be compared.
// PT: Entrada determinística a partir de uma semente fixa (um gerador congruente linear),
//     idêntica à do C++, para que as duas linguagens multipliquem as mesmas matrizes e os
//     checksums sejam comparáveis.
// ES: Entrada determinista a partir de una semilla fija (un generador congruencial lineal),
//     idéntica a la de C++, para que los dos lenguajes multipliquen las mismas matrices y los
//     checksums sean comparables.
pub fn make_matrix(n: usize, seed: u64) -> Vec<f64> {
    let mut state = seed;
    (0..n * n)
        .map(|_| {
            state = state
                .wrapping_mul(6_364_136_223_846_793_005)
                .wrapping_add(1_442_695_040_888_963_407);
            (state >> 40) as f64 / 16_777_216.0
        })
        .collect()
}

// EN: The textbook order, i-j-k: each element of the result is the dot product of a row of A
//     and a column of B. B is walked down a column: b[0][j], b[1][j], b[2][j]..., n * 8 bytes
//     apart, a new cache line on every step.
// PT: A ordem do livro-texto, i-j-k: cada elemento do resultado é o produto escalar de uma linha
//     de A por uma coluna de B. B é percorrida descendo uma coluna: b[0][j], b[1][j],
//     b[2][j]..., a n * 8 bytes um do outro, uma linha de cache nova a cada passo.
// ES: El orden del libro de texto, i-j-k: cada elemento del resultado es el producto escalar de una
//     fila de A por una columna de B. B se recorre bajando una columna: b[0][j], b[1][j],
//     b[2][j]..., a n * 8 bytes uno del otro, una línea de caché nueva en cada paso.
pub fn multiply_naive(a: &[f64], b: &[f64], n: usize) -> Vec<f64> {
    let mut c = vec![0.0; n * n];
    for i in 0..n {
        for j in 0..n {
            let mut sum = 0.0;
            for k in 0..n {
                sum += a[i * n + k] * b[k * n + j];
            }
            c[i * n + j] = sum;
        }
    }
    c
}

// EN: Loop interchange, i-k-j: the two inner loops are swapped and nothing else. The inner loop
//     now walks along row k of B and row i of C, both contiguous (spatial locality). Taking the
//     two rows as slices also lets the compiler drop the bounds checks and use vector
//     instructions.
// PT: Troca de laços, i-k-j: os dois laços internos são trocados e nada mais. O laço interno
//     agora anda ao longo da linha k de B e da linha i de C, ambas contíguas (localidade
//     espacial). Pegar as duas linhas como slices também deixa o compilador remover as
//     checagens de limite e usar instruções vetoriais.
// ES: Intercambio de bucles, i-k-j: se intercambian los dos bucles internos y nada más. El bucle
//     interno ahora recorre la fila k de B y la fila i de C, ambas contiguas (localidad espacial).
//     Tomar las dos filas como slices también permite al compilador eliminar las comprobaciones de
//     límites y usar instrucciones vectoriales.
pub fn multiply_interchanged(a: &[f64], b: &[f64], n: usize) -> Vec<f64> {
    let mut c = vec![0.0; n * n];
    for i in 0..n {
        for k in 0..n {
            let aik = a[i * n + k];
            let row_b = &b[k * n..(k + 1) * n];
            let row_c = &mut c[i * n..(i + 1) * n];
            for (cij, bkj) in row_c.iter_mut().zip(row_b) {
                *cij += aik * bkj;
            }
        }
    }
    c
}

// EN: Blocking (tiling): the same i-k-j work, cut into blocks of `block` x `block` elements.
//     Inside one block the code touches a square piece of A, of B and of C, about
//     3 * block^2 * 8 bytes, over and over. When that fits in a cache level, the data is reused
//     while it is still there (temporal locality) instead of being fetched from main memory again.
// PT: Blocagem (tiling): o mesmo trabalho i-k-j, cortado em blocos de `block` x `block`
//     elementos. Dentro de um bloco o código toca um pedaço quadrado de A, de B e de C, cerca de
//     3 * block^2 * 8 bytes, repetidas vezes. Quando isso cabe em um nível de cache, o dado é
//     reutilizado enquanto ainda está lá (localidade temporal), em vez de ser buscado de novo
//     na memória principal.
// ES: Blocking (tiling): el mismo trabajo i-k-j, cortado en bloques de `block` x `block`
//     elementos. Dentro de un bloque el código toca un trozo cuadrado de A, de B y de C, unos
//     3 * block^2 * 8 bytes, una y otra vez. Cuando eso cabe en un nivel de caché, el dato se
//     reutiliza mientras todavía está allí (localidad temporal), en lugar de buscarse de nuevo
//     en la memoria principal.
pub fn multiply_blocked(a: &[f64], b: &[f64], n: usize, block: usize) -> Vec<f64> {
    assert!(block > 0, "block size must be at least 1");
    let mut c = vec![0.0; n * n];
    for ii in (0..n).step_by(block) {
        let i_end = (ii + block).min(n);
        for kk in (0..n).step_by(block) {
            let k_end = (kk + block).min(n);
            for jj in (0..n).step_by(block) {
                let j_end = (jj + block).min(n);
                for i in ii..i_end {
                    for k in kk..k_end {
                        let aik = a[i * n + k];
                        let row_b = &b[k * n + jj..k * n + j_end];
                        let row_c = &mut c[i * n + jj..i * n + j_end];
                        for (cij, bkj) in row_c.iter_mut().zip(row_b) {
                            *cij += aik * bkj;
                        }
                    }
                }
            }
        }
    }
    c
}

/// Bytes touched while one block is being multiplied: a square piece of each of the 3 matrices.
pub fn block_working_set_bytes(block: usize) -> usize {
    3 * block * block * size_of::<f64>()
}

/// Largest absolute difference between two matrices of the same size.
pub fn max_abs_diff(x: &[f64], y: &[f64]) -> f64 {
    assert_eq!(x.len(), y.len(), "matrices have different sizes");
    x.iter()
        .zip(y)
        .map(|(p, q)| (p - q).abs())
        .fold(0.0, f64::max)
}

// EN: A short digest of the result: the sum of all elements with three decimals. The three
//     variants, and the two languages, must print the same text.
// PT: Um resumo curto do resultado: a soma de todos os elementos com três casas decimais. As
//     três variantes, e as duas linguagens, precisam imprimir o mesmo texto.
// ES: Un resumen corto del resultado: la suma de todos los elementos con tres decimales. Las
//     tres variantes, y los dos lenguajes, deben imprimir el mismo texto.
pub fn checksum(values: &[f64]) -> String {
    let mut sum = 0.0;
    for value in values {
        sum += value;
    }
    format!("{sum:.3}")
}

// EN: Two kinds of test, as in C++. Correctness: the three variants give the same matrix within
//     a floating-point tolerance. Locality: the naive order must be clearly slower than the
//     interchanged one, checked as a ratio of times with a limit far below what is normally measured.
// PT: Dois tipos de teste, como no C++. Correção: as três variantes dão a mesma matriz dentro de
//     uma tolerância de ponto flutuante. Localidade: a ordem ingênua precisa ser claramente mais
//     lenta que a trocada, conferido como razão entre tempos com um limite muito abaixo do que
//     normalmente se mede.
// ES: Dos tipos de prueba, como en C++. Corrección: las tres variantes dan la misma matriz dentro
//     de una tolerancia de punto flotante. Localidad: el orden ingenuo debe ser claramente más
//     lento que el intercambiado, verificado como razón entre tiempos con un límite muy por debajo
//     de lo que normalmente se mide.
#[cfg(test)]
mod tests {
    use super::*;
    use std::time::Instant;

    fn best_ms(multiply: impl Fn() -> Vec<f64>) -> f64 {
        (0..3)
            .map(|_| {
                let start = Instant::now();
                let product = multiply();
                let elapsed = start.elapsed().as_secs_f64() * 1000.0;
                // The result is used, so the multiplication cannot be removed as dead code.
                assert!(!product.is_empty());
                elapsed
            })
            .fold(f64::INFINITY, f64::min)
    }

    #[test]
    fn known_product() {
        // [1 2] [5 6]   [19 22]
        // [3 4] [7 8] = [43 50]
        let a = [1.0, 2.0, 3.0, 4.0];
        let b = [5.0, 6.0, 7.0, 8.0];
        let expected = vec![19.0, 22.0, 43.0, 50.0];
        assert_eq!(multiply_naive(&a, &b, 2), expected);
        assert_eq!(multiply_interchanged(&a, &b, 2), expected);
        assert_eq!(multiply_blocked(&a, &b, 2, 1), expected);
        assert_eq!(multiply_blocked(&a, &b, 2, 64), expected);
    }

    #[test]
    fn identity() {
        let n = 37;
        let a = make_matrix(n, 7);
        let mut identity = vec![0.0; n * n];
        for i in 0..n {
            identity[i * n + i] = 1.0;
        }
        assert_eq!(multiply_naive(&a, &identity, n), a);
        assert_eq!(multiply_interchanged(&identity, &a, n), a);
        assert_eq!(multiply_blocked(&a, &identity, n, 8), a);
    }

    #[test]
    fn variants_agree() {
        for n in [1, 2, 3, 7, 16, 33, 64, 100] {
            let a = make_matrix(n, 1);
            let b = make_matrix(n, 2);
            let naive = multiply_naive(&a, &b, n);
            // Every element is a sum of n products of numbers below 1.
            let tolerance = 1e-9 * n as f64;
            let interchanged = multiply_interchanged(&a, &b, n);
            assert!(max_abs_diff(&naive, &interchanged) <= tolerance, "n={n}");
            assert_eq!(checksum(&naive), checksum(&interchanged), "n={n}");
            for block in [1, 2, 5, 16, 64, 1000] {
                let blocked = multiply_blocked(&a, &b, n, block);
                assert!(
                    max_abs_diff(&naive, &blocked) <= tolerance,
                    "n={n} block={block}"
                );
                assert_eq!(checksum(&naive), checksum(&blocked), "n={n} block={block}");
            }
        }
    }

    #[test]
    fn input_and_helpers() {
        let first = make_matrix(4, 1);
        assert_eq!(first, make_matrix(4, 1));
        assert_ne!(first, make_matrix(4, 2));
        assert!(first.iter().all(|value| (0.0..1.0).contains(value)));
        // Shared with the C++ tests: both languages must generate the same input.
        assert_eq!(checksum(&make_matrix(8, 1)), "31.864");
        assert_eq!(checksum(&[1.5, 2.25]), "3.750");
        assert_eq!(max_abs_diff(&[1.0, 2.0], &[1.0, 2.5]), 0.5);
        // 3 matrices x 64 x 64 values x 8 bytes = 98304 bytes = 96 KiB.
        assert_eq!(block_working_set_bytes(64), 98304);
        assert_eq!(CACHE_LINE_BYTES / size_of::<f64>(), 8);
    }

    #[test]
    #[should_panic(expected = "block size must be at least 1")]
    fn block_size_zero_is_rejected() {
        let a = make_matrix(4, 1);
        multiply_blocked(&a, &a, 4, 0);
    }

    #[test]
    fn locality() {
        // 512 x 512 values of 8 bytes is 2 MiB per matrix: a column walk of B leaves the L1
        // cache, and on most machines the L2 cache too.
        let n = 512;
        let a = make_matrix(n, 1);
        let b = make_matrix(n, 2);
        let naive = best_ms(|| multiply_naive(&a, &b, n));
        let interchanged = best_ms(|| multiply_interchanged(&a, &b, n));
        let blocked = best_ms(|| multiply_blocked(&a, &b, n, 64));
        println!(
            "n=512: naive {naive:.1} ms, interchanged {interchanged:.1} ms, blocked-64 {blocked:.1} ms"
        );
        assert!(naive > 1.5 * interchanged);
        assert!(naive > 1.5 * blocked);
    }
}
