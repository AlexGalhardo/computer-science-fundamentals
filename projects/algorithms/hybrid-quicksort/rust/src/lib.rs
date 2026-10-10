//! EN: A quicksort with two knobs: how the pivot is chosen, and below which size a range is
//!     handed to insertion sort. Same algorithm and same decisions as the C++ version in
//!     `cpp/quicksort.hpp`. The pivot rule decides whether sorted input is the best case or the
//!     O(n²) worst case. The threshold does not change the order of growth: it trims the
//!     constant factor, because most recursive calls handle tiny ranges.
//! PT: Um quicksort com dois botões: como o pivô é escolhido, e abaixo de qual tamanho um trecho
//!     é entregue ao insertion sort. Mesmo algoritmo e mesmas decisões da versão em C++ em
//!     `cpp/quicksort.hpp`. A regra do pivô decide se a entrada ordenada é o melhor caso ou o
//!     pior caso O(n²). O limiar não muda a ordem de crescimento: ele reduz o fator constante,
//!     porque a maioria das chamadas recursivas trata trechos minúsculos.
//! ES: Un quicksort con dos perillas: cómo se elige el pivote, y por debajo de qué tamaño un tramo
//!     se entrega al insertion sort. Mismo algoritmo y mismas decisiones que la versión en C++ en
//!     `cpp/quicksort.hpp`. La regla del pivote decide si la entrada ordenada es el mejor caso o el
//!     peor caso O(n²). El umbral no cambia el orden de crecimiento: reduce el factor constante,
//!     porque la mayoría de las llamadas recursivas tratan tramos minúsculos.

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Pivot {
    First,
    Random,
    MedianOfThree,
}

pub const PIVOTS: [(&str, Pivot); 3] = [
    ("first", Pivot::First),
    ("random", Pivot::Random),
    ("median3", Pivot::MedianOfThree),
];
pub const THRESHOLDS: [usize; 5] = [0, 5, 10, 20, 50];
pub const SHAPES: [&str; 3] = ["random", "sorted", "reversed"];

// EN: xorshift32, used for the random pivot and to build the random input. The seed is fixed,
//     so every run and both languages see the same numbers.
// PT: xorshift32, usado no pivô aleatório e para montar a entrada aleatória. A semente é fixa,
//     então toda execução e as duas linguagens veem os mesmos números.
// ES: xorshift32, usado en el pivote aleatorio y para construir la entrada aleatoria. La semilla
//     es fija, así que cada ejecución y los dos lenguajes ven los mismos números.
pub struct Xorshift(u32);

impl Xorshift {
    pub fn new(seed: u32) -> Self {
        Self(if seed == 0 { 1 } else { seed })
    }

    pub fn next_u32(&mut self) -> u32 {
        self.0 ^= self.0 << 13;
        self.0 ^= self.0 >> 17;
        self.0 ^= self.0 << 5;
        self.0
    }
}

// EN: Insertion sort on a[lo..=hi]. Quadratic in general, unbeatable on a handful of values.
// PT: Insertion sort em a[lo..=hi]. Quadrático no geral, imbatível em um punhado de valores.
// ES: Insertion sort en a[lo..=hi]. Cuadrático en general, imbatible con un puñado de valores.
fn insertion_sort(a: &mut [i32], lo: isize, hi: isize) {
    for i in lo + 1..=hi {
        let key = a[i as usize];
        let mut j = i - 1;
        while j >= lo && a[j as usize] > key {
            a[(j + 1) as usize] = a[j as usize];
            j -= 1;
        }
        a[(j + 1) as usize] = key;
    }
}

// EN: `First` is the textbook rule and the trap: on sorted input the first value is the
//     minimum, so one side of every split is empty. `Random` makes the worst case depend on
//     luck instead of on the input. `MedianOfThree` takes the middle value among the first,
//     middle and last, which is the true median when the range is already sorted.
// PT: `First` é a regra de livro e a armadilha: em entrada ordenada o primeiro valor é o mínimo,
//     então um lado de toda divisão fica vazio. `Random` faz o pior caso depender da sorte e não
//     da entrada. `MedianOfThree` fica com o valor intermediário entre o primeiro, o do meio e
//     o último, que é a mediana real quando o trecho já está ordenado.
// ES: `First` es la regla de libro y la trampa: en entrada ordenada el primer valor es el mínimo,
//     así que un lado de cada división queda vacío. `Random` hace que el peor caso dependa de la
//     suerte y no de la entrada. `MedianOfThree` se queda con el valor intermedio entre el primero,
//     el del medio y el último, que es la mediana real cuando el tramo ya está ordenado.
fn choose_pivot(a: &[i32], lo: isize, hi: isize, pivot: Pivot, random: &mut Xorshift) -> i32 {
    match pivot {
        Pivot::First => a[lo as usize],
        Pivot::Random => a[(lo + (random.next_u32() % (hi - lo + 1) as u32) as isize) as usize],
        Pivot::MedianOfThree => {
            let (x, y, z) = (
                a[lo as usize],
                a[(lo + (hi - lo) / 2) as usize],
                a[hi as usize],
            );
            x.min(y).max(x.max(y).min(z))
        }
    }
}

fn sort_range(
    a: &mut [i32],
    mut lo: isize,
    mut hi: isize,
    pivot: Pivot,
    threshold: isize,
    random: &mut Xorshift,
) {
    while lo < hi {
        // EN: The hybrid step: a range of at most `threshold` values goes to insertion sort.
        //     With threshold 0 this never happens and the code is a plain quicksort.
        // PT: O passo híbrido: um trecho de no máximo `threshold` valores vai para o insertion
        //     sort. Com limiar 0 isso nunca acontece e o código é um quicksort puro.
        // ES: El paso híbrido: un tramo de como máximo `threshold` valores va al insertion
        //     sort. Con umbral 0 esto nunca ocurre y el código es un quicksort puro.
        if hi - lo < threshold {
            insertion_sort(a, lo, hi);
            return;
        }
        let value = choose_pivot(a, lo, hi, pivot, random);
        // EN: Hoare partition: two indexes walk towards each other and swap misplaced pairs.
        // PT: Partição de Hoare: dois índices andam um em direção ao outro e trocam os pares
        //     fora do lugar.
        // ES: Partición de Hoare: dos índices avanzan uno hacia el otro e intercambian los pares
        //     fuera de lugar.
        let (mut i, mut j) = (lo, hi);
        while i <= j {
            while a[i as usize] < value {
                i += 1;
            }
            while a[j as usize] > value {
                j -= 1;
            }
            if i <= j {
                a.swap(i as usize, j as usize);
                i += 1;
                j -= 1;
            }
        }
        // EN: Recurse on the smaller side and loop on the larger one. Even when the pivot is
        //     terrible and the time is quadratic, the stack stays O(log n) deep.
        // PT: Recursão no lado menor e laço no maior. Mesmo quando o pivô é péssimo e o tempo é
        //     quadrático, a pilha fica com profundidade O(log n).
        // ES: Recursión sobre el lado menor y bucle sobre el mayor. Incluso cuando el pivote es
        //     pésimo y el tiempo es cuadrático, la pila queda con profundidad O(log n).
        if j - lo < hi - i {
            sort_range(a, lo, j, pivot, threshold, random);
            lo = i;
        } else {
            sort_range(a, i, hi, pivot, threshold, random);
            hi = j;
        }
    }
}

pub fn hybrid_quicksort(a: &mut [i32], pivot: Pivot, threshold: usize) {
    let mut random = Xorshift::new(0x9E37_79B9);
    let hi = a.len() as isize - 1;
    sort_range(a, 0, hi, pivot, threshold as isize, &mut random);
}

// EN: The three input shapes, built in memory: the same n values in a different order.
// PT: Os três formatos de entrada, montados em memória: os mesmos n valores em outra ordem.
// ES: Las tres formas de entrada, construidas en memoria: los mismos n valores en otro orden.
pub fn make_input(shape: &str, n: usize) -> Vec<i32> {
    let mut random = Xorshift::new(20_260_101);
    let mut values: Vec<i32> = (0..n).map(|_| (random.next_u32() >> 1) as i32).collect();
    if shape != "random" {
        values.sort_unstable();
    }
    if shape == "reversed" {
        values.reverse();
    }
    values
}

// EN: Same order-sensitive digest as the other mini-projects: h = (h * 31 + v) mod 1,000,000,007.
// PT: Mesmo resumo sensível à ordem dos outros mini-projetos: h = (h * 31 + v) mod 1.000.000.007.
// ES: El mismo resumen sensible al orden de los otros mini-proyectos:
//     h = (h * 31 + v) mod 1.000.000.007.
pub fn checksum(values: &[i32]) -> String {
    let mut digest: i64 = 0;
    for &value in values {
        digest = (digest * 31 + i64::from(value)) % 1_000_000_007;
    }
    digest.to_string()
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::Instant;

    #[test]
    fn every_strategy_and_threshold_sorts_every_shape() {
        for (name, pivot) in PIVOTS {
            for threshold in THRESHOLDS {
                for shape in SHAPES {
                    for n in [0, 1, 2, 3, 17, 1000] {
                        let mut values = make_input(shape, n);
                        let mut expected = values.clone();
                        expected.sort_unstable();
                        hybrid_quicksort(&mut values, pivot, threshold);
                        assert_eq!(values, expected, "{name} k={threshold} {shape} n={n}");
                    }
                }
                let mut duplicated = vec![5, 3, 5, 1, 3, 3, 0, i32::MAX, 5, 0, i32::MAX, 3, 3, 3];
                let mut expected = duplicated.clone();
                expected.sort_unstable();
                hybrid_quicksort(&mut duplicated, pivot, threshold);
                assert_eq!(duplicated, expected, "{name} k={threshold} duplicated");
            }
        }
    }

    fn time_ms(input: &[i32], pivot: Pivot) -> f64 {
        (0..3)
            .map(|_| {
                let mut copy = input.to_vec();
                let start = Instant::now();
                hybrid_quicksort(&mut copy, pivot, 0);
                start.elapsed().as_secs_f64() * 1000.0
            })
            .fold(f64::INFINITY, f64::min)
    }

    // EN: When n grows 4 times, an O(n²) algorithm takes about 16 times longer and an
    //     O(n log n) one about 4.5 times. The limit 8 sits between the two. Ratios of times
    //     depend on the algorithm far more than on the machine.
    // PT: Quando n cresce 4 vezes, um algoritmo O(n²) leva cerca de 16 vezes mais tempo e um
    //     O(n log n) cerca de 4,5 vezes. O limite 8 fica entre os dois. Razões entre tempos
    //     dependem muito mais do algoritmo que da máquina.
    // ES: Cuando n crece 4 veces, un algoritmo O(n²) tarda cerca de 16 veces más y un
    //     O(n log n) cerca de 4.5 veces. El límite 8 queda entre los dos. Las razones entre tiempos
    //     dependen mucho más del algoritmo que de la máquina.
    #[test]
    fn first_pivot_is_quadratic_on_sorted_input() {
        let small = make_input("sorted", 10_000);
        let large = make_input("sorted", 40_000);
        let first_ratio = time_ms(&large, Pivot::First) / time_ms(&small, Pivot::First);
        // EN: Median of three is so fast that 40,000 values take too little time to measure
        //     reliably. Its growth is measured on inputs 50 times larger.
        // PT: A mediana de três é tão rápida que 40.000 valores levam tempo de menos para medir
        //     com confiança. O crescimento dela é medido em entradas 50 vezes maiores.
        // ES: La mediana de tres es tan rápida que 40,000 valores tardan muy poco para medir
        //     con confianza. Su crecimiento se mide en entradas 50 veces mayores.
        let median_ratio = time_ms(&make_input("sorted", 2_000_000), Pivot::MedianOfThree)
            / time_ms(&make_input("sorted", 500_000), Pivot::MedianOfThree);
        assert!(first_ratio > 8.0, "first pivot grew only x{first_ratio}");
        assert!(median_ratio < 8.0, "median of three grew x{median_ratio}");
        assert!(time_ms(&large, Pivot::First) > 20.0 * time_ms(&large, Pivot::MedianOfThree));
    }

    #[test]
    fn checksum_and_generator_match_the_cpp_version() {
        assert_eq!(checksum(&[1, 2, 3]), "1026");
        assert_eq!(make_input("sorted", 5), {
            let mut values = make_input("random", 5);
            values.sort_unstable();
            values
        });
    }
}
