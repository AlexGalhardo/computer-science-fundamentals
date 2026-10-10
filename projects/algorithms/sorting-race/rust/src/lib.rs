//! EN: The six sorting algorithms of the race, in Rust. Same algorithms and same decisions as
//!     the TypeScript reference in `ts/src/`, where each one is explained in detail. What
//!     changes here: no garbage collector and no runtime, and every index access is bounds
//!     checked, which is the price of memory safety and costs little in these loops.
//! PT: Os seis algoritmos de ordenação da corrida, em Rust. Mesmos algoritmos e mesmas decisões
//!     da referência em TypeScript em `ts/src/`, onde cada um é explicado em detalhe. O que
//!     muda aqui: não há coletor de lixo nem runtime, e todo acesso por índice tem verificação
//!     de limites, que é o preço da segurança de memória e custa pouco nesses laços.
//! ES: Los seis algoritmos de ordenación de la carrera, en Rust. Mismos algoritmos y mismas
//!     decisiones que la referencia en TypeScript en `ts/src/`, donde cada uno se explica en
//!     detalle. Lo que cambia aquí: no hay recolector de basura ni runtime, y todo acceso por
//!     índice tiene verificación de límites, que es el precio de la seguridad de memoria y
//!     cuesta poco en esos bucles.

/// A sort receives the input and returns a new sorted vector, leaving the input untouched.
pub type SortFn = fn(&[i32]) -> Vec<i32>;

pub const SORTS: [(&str, SortFn); 6] = [
    ("bubble", bubble_sort),
    ("insertion", insertion_sort),
    ("merge", merge_sort),
    ("quick", quick_sort),
    ("heap", heap_sort),
    ("radix", radix_sort),
];

// EN: Swap out-of-order neighbours. Stop when a pass makes no swap.
// PT: Troca vizinhos fora de ordem. Para quando uma passada não faz trocas.
// ES: Intercambia vecinos desordenados. Se detiene cuando una pasada no hace intercambios.
pub fn bubble_sort(values: &[i32]) -> Vec<i32> {
    let mut a = values.to_vec();
    for end in (1..a.len()).rev() {
        let mut swapped = false;
        for i in 0..end {
            if a[i] > a[i + 1] {
                a.swap(i, i + 1);
                swapped = true;
            }
        }
        if !swapped {
            break;
        }
    }
    a
}

// EN: Insert each value into the sorted prefix, shifting the larger values right.
// PT: Insere cada valor no prefixo ordenado, deslocando os maiores para a direita.
// ES: Inserta cada valor en el prefijo ordenado, desplazando los mayores hacia la derecha.
pub fn insertion_sort(values: &[i32]) -> Vec<i32> {
    let mut a = values.to_vec();
    for i in 1..a.len() {
        let key = a[i];
        let mut j = i;
        while j > 0 && a[j - 1] > key {
            a[j] = a[j - 1];
            j -= 1;
        }
        a[j] = key;
    }
    a
}

// EN: Split in half, sort each half, merge. One buffer is reused by every merge.
// PT: Divide ao meio, ordena cada metade, intercala. Um buffer é reusado em toda intercalação.
// ES: Divide a la mitad, ordena cada mitad, mezcla. Un búfer se reutiliza en cada mezcla.
pub fn merge_sort(values: &[i32]) -> Vec<i32> {
    let mut a = values.to_vec();
    let mut buffer = vec![0; a.len()];
    merge_range(&mut a, &mut buffer);
    a
}

fn merge_range(a: &mut [i32], buffer: &mut [i32]) {
    let n = a.len();
    if n < 2 {
        return;
    }
    let mid = n / 2;
    {
        let (left, right) = a.split_at_mut(mid);
        let (buffer_left, buffer_right) = buffer.split_at_mut(mid);
        merge_range(left, buffer_left);
        merge_range(right, buffer_right);
    }
    let (mut i, mut j) = (0, mid);
    for slot in buffer.iter_mut() {
        // EN: `<=` takes the left value on a tie, which keeps the sort stable.
        // PT: `<=` pega o valor da esquerda no empate, o que mantém a ordenação estável.
        // ES: `<=` toma el valor de la izquierda en el empate, lo que mantiene la ordenación
        //     estable.
        if j >= n || (i < mid && a[i] <= a[j]) {
            *slot = a[i];
            i += 1;
        } else {
            *slot = a[j];
            j += 1;
        }
    }
    a.copy_from_slice(buffer);
}

// EN: Hoare partition around the median of three. Recursing on the smaller side and looping on
//     the larger one keeps the stack at O(log n).
// PT: Partição de Hoare em torno da mediana de três. Fazer a recursão no lado menor e o laço no
//     maior mantém a pilha em O(log n).
// ES: Partición de Hoare alrededor de la mediana de tres. Hacer la recursión sobre el lado menor
//     y el bucle sobre el mayor mantiene la pila en O(log n).
pub fn quick_sort(values: &[i32]) -> Vec<i32> {
    let mut a = values.to_vec();
    if a.len() > 1 {
        let last = a.len() as isize - 1;
        quick_range(&mut a, 0, last);
    }
    a
}

fn median_of_three(x: i32, y: i32, z: i32) -> i32 {
    x.min(y).max(x.max(y).min(z))
}

fn quick_range(a: &mut [i32], mut lo: isize, mut hi: isize) {
    while lo < hi {
        let pivot = median_of_three(
            a[lo as usize],
            a[(lo + (hi - lo) / 2) as usize],
            a[hi as usize],
        );
        let (mut i, mut j) = (lo, hi);
        while i <= j {
            while a[i as usize] < pivot {
                i += 1;
            }
            while a[j as usize] > pivot {
                j -= 1;
            }
            if i <= j {
                a.swap(i as usize, j as usize);
                i += 1;
                j -= 1;
            }
        }
        if j - lo < hi - i {
            quick_range(a, lo, j);
            lo = i;
        } else {
            quick_range(a, i, hi);
            hi = j;
        }
    }
}

// EN: Build a max-heap inside the vector, then move the maximum to the end n - 1 times.
// PT: Constrói um max-heap dentro do vetor e move o máximo para o fim n - 1 vezes.
// ES: Construye un max-heap dentro del vector y mueve el máximo al final n - 1 veces.
pub fn heap_sort(values: &[i32]) -> Vec<i32> {
    let mut a = values.to_vec();
    let n = a.len();
    for i in (0..n / 2).rev() {
        sift_down(&mut a, i, n);
    }
    for end in (1..n).rev() {
        a.swap(0, end);
        sift_down(&mut a, 0, end);
    }
    a
}

fn sift_down(a: &mut [i32], start: usize, size: usize) {
    let value = a[start];
    let mut i = start;
    loop {
        let mut child = 2 * i + 1;
        if child >= size {
            break;
        }
        if child + 1 < size && a[child + 1] > a[child] {
            child += 1;
        }
        if a[child] <= value {
            break;
        }
        a[i] = a[child];
        i = child;
    }
    a[i] = value;
}

// EN: LSD radix sort in base 256: four stable counting passes, one per byte of the key, with
//     no comparison between values. Valid for integers from 0 to 2^31 - 1.
// PT: Radix sort LSD na base 256: quatro passadas estáveis de contagem, uma por byte da chave,
//     sem comparar valores. Válido para inteiros de 0 a 2^31 - 1.
// ES: Radix sort LSD en base 256: cuatro pasadas estables de conteo, una por byte de la clave,
//     sin comparar valores. Válido para enteros de 0 a 2^31 - 1.
pub fn radix_sort(values: &[i32]) -> Vec<i32> {
    let mut source = values.to_vec();
    let mut target = vec![0; source.len()];
    for shift in (0..32).step_by(8) {
        let mut count = [0usize; 256];
        for &value in &source {
            count[((value >> shift) & 255) as usize] += 1;
        }
        for digit in 1..256 {
            count[digit] += count[digit - 1];
        }
        for &value in source.iter().rev() {
            let digit = ((value >> shift) & 255) as usize;
            count[digit] -= 1;
            target[count[digit]] = value;
        }
        std::mem::swap(&mut source, &mut target);
    }
    source
}

// EN: Same order-sensitive digest in every language: h = (h * 31 + v) mod 1,000,000,007.
// PT: Mesmo resumo sensível à ordem em toda linguagem: h = (h * 31 + v) mod 1.000.000.007.
// ES: El mismo resumen sensible al orden en todo lenguaje:
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
    use super::{SORTS, checksum};

    // EN: Linear congruential generator with a fixed seed, so the test is reproducible.
    // PT: Gerador congruente linear com semente fixa, para o teste ser reproduzível.
    // ES: Generador congruencial lineal con semilla fija, para que la prueba sea reproducible.
    fn random_values(n: usize, seed: i64) -> Vec<i32> {
        let mut state = seed;
        (0..n)
            .map(|_| {
                state = (state * 1_103_515_245 + 12_345) % (1 << 31);
                state as i32
            })
            .collect()
    }

    // EN: Same six cases as the TypeScript reference. The oracle is the library sort: being
    //     equal to it means ordered and a permutation of the input.
    // PT: Mesmos seis casos da referência em TypeScript. O oráculo é a ordenação da biblioteca:
    //     ser igual a ela significa estar em ordem e ser uma permutação da entrada.
    // ES: Los mismos seis casos de la referencia en TypeScript. El oráculo es la ordenación de la
    //     biblioteca: ser igual a ella significa estar en orden y ser una permutación de la
    //     entrada.
    #[test]
    fn sorts_every_case() {
        let cases: [(&str, Vec<i32>); 6] = [
            ("empty", vec![]),
            ("single element", vec![42]),
            ("sorted", vec![1, 2, 3, 4, 5, 6, 7, 8]),
            ("reversed", vec![8, 7, 6, 5, 4, 3, 2, 1]),
            (
                "duplicated",
                vec![5, 3, 5, 1, 3, 3, 0, i32::MAX, 5, 0, i32::MAX],
            ),
            ("random", random_values(1000, 7)),
        ];
        for (name, sort) in SORTS {
            for (label, input) in &cases {
                let mut expected = input.clone();
                expected.sort();
                assert_eq!(sort(input), expected, "{name}: {label}");
            }
        }
    }

    #[test]
    fn checksum_depends_on_order() {
        assert_eq!(checksum(&[1, 2, 3]), "1026");
        assert_ne!(checksum(&[3, 2, 1]), checksum(&[1, 2, 3]));
    }
}
