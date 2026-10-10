//! Mandelbrot set rendering, sequential and parallel.

use std::sync::Mutex;
use std::thread;

use crate::schedule::{Schedule, split_static};

/// Iteration limit: a point that survives this many steps is treated as inside the set.
pub const MAX_ITER: u32 = 1000;
/// Rows handed to a worker at a time by the dynamic schedule.
pub const DYNAMIC_CHUNK_ROWS: usize = 4;

const X_MIN: f64 = -2.0;
const Y_MIN: f64 = -1.5;
const SPAN: f64 = 3.0;

/// A square image: one escape time per pixel, row by row.
#[derive(Debug, PartialEq, Eq)]
pub struct Image {
    pub side: usize,
    pub pixels: Vec<u32>,
    pub total_iterations: u64,
}

impl Image {
    // EN: This pass over the finished image runs on one thread whatever the worker count. It
    //     is a real serial part of the program, the kind Amdahl's law is about: it costs the
    //     same with 1 or with 8 workers. FNV-1a (here mixing one whole pixel per step) depends
    //     on the order of the values, so equal checksums mean equal images, pixel by pixel.
    // PT: Esta passada sobre a imagem pronta roda em uma thread, seja qual for o número de
    //     trabalhadores. É uma parte serial real do programa, do tipo que a lei de Amdahl
    //     descreve: custa o mesmo com 1 ou com 8 trabalhadores. O FNV-1a (aqui misturando um
    //     pixel inteiro por passo) depende da ordem dos valores, então checksums iguais
    //     significam imagens iguais, pixel a pixel.
    // ES: Esta pasada sobre la imagen terminada corre en un hilo, sea cual sea el número de
    //     trabajadores. Es una parte serial real del programa, del tipo que describe la ley de
    //     Amdahl: cuesta lo mismo con 1 o con 8 trabajadores. FNV-1a (aquí mezclando un
    //     píxel entero por paso) depende del orden de los valores, así que checksums iguales
    //     significan imágenes iguales, píxel a píxel.
    pub fn checksum(&self) -> u64 {
        let mut hash: u64 = 0xcbf2_9ce4_8422_2325;
        for &pixel in &self.pixels {
            hash ^= u64::from(pixel);
            hash = hash.wrapping_mul(0x0000_0100_0000_01b3);
        }
        hash
    }
}

// EN: Escape time of one point c: iterate z = z² + c from z = 0 and count the steps until
//     |z| > 2. Points inside the set never escape and cost the full `max_iter` steps, points
//     far away cost one or two. The cost of a pixel therefore varies a thousandfold across the
//     image, which is what makes this workload irregular. The result depends only on c, never
//     on another pixel, so pixels can be computed in any order and on any thread.
// PT: Tempo de escape de um ponto c: iterar z = z² + c a partir de z = 0 e contar os passos
//     até |z| > 2. Pontos dentro do conjunto nunca escapam e custam os `max_iter` passos
//     inteiros, pontos distantes custam um ou dois. O custo de um pixel varia, portanto, mil
//     vezes ao longo da imagem, e é isso que torna esta carga irregular. O resultado depende
//     só de c, nunca de outro pixel, então os pixels podem ser calculados em qualquer ordem e
//     em qualquer thread.
// ES: Tiempo de escape de un punto c: iterar z = z² + c a partir de z = 0 y contar los pasos
//     hasta |z| > 2. Los puntos dentro del conjunto nunca escapan y cuestan los `max_iter` pasos
//     enteros, los puntos lejanos cuestan uno o dos. El costo de un píxel varía, por tanto, mil
//     veces a lo largo de la imagen, y eso es lo que hace irregular esta carga. El resultado
//     depende solo de c, nunca de otro píxel, así que los píxeles pueden calcularse en cualquier
//     orden y en cualquier hilo.
pub fn escape_time(cx: f64, cy: f64, max_iter: u32) -> u32 {
    let mut zx = 0.0_f64;
    let mut zy = 0.0_f64;
    let mut iterations = 0;
    while iterations < max_iter {
        let x2 = zx * zx;
        let y2 = zy * zy;
        if x2 + y2 > 4.0 {
            break;
        }
        zy = 2.0 * zx * zy + cy;
        zx = x2 - y2 + cx;
        iterations += 1;
    }
    iterations
}

// EN: Renders the rows stored in `block`, whose first row is row `first_row` of the image, and
//     returns the iterations it spent. The worker owns `block` exclusively (`&mut`), so it
//     writes pixels without any lock, and it accumulates the iterations in a local variable.
// PT: Calcula as linhas guardadas em `block`, cuja primeira linha é a linha `first_row` da
//     imagem, e devolve as iterações gastas. O trabalhador é dono exclusivo de `block`
//     (`&mut`), então escreve pixels sem trava alguma, e acumula as iterações em uma variável
//     local.
// ES: Calcula las filas guardadas en `block`, cuya primera fila es la fila `first_row` de la
//     imagen, y devuelve las iteraciones gastadas. El trabajador es dueño exclusivo de `block`
//     (`&mut`), así que escribe píxeles sin ningún bloqueo, y acumula las iteraciones en una
//     variable local.
fn render_rows(block: &mut [u32], first_row: usize, side: usize, max_iter: u32) -> u64 {
    if side == 0 {
        return 0;
    }
    let step = SPAN / side as f64;
    let mut iterations = 0;
    for (offset, row) in block.chunks_mut(side).enumerate() {
        let cy = Y_MIN + (first_row + offset) as f64 * step;
        for (px, pixel) in row.iter_mut().enumerate() {
            let cx = X_MIN + px as f64 * step;
            let escape = escape_time(cx, cy, max_iter);
            *pixel = escape;
            iterations += u64::from(escape);
        }
    }
    iterations
}

/// Renders a `side` x `side` image on the calling thread.
pub fn render_sequential(side: usize, max_iter: u32) -> Image {
    let mut pixels = vec![0; side * side];
    let total_iterations = render_rows(&mut pixels, 0, side, max_iter);
    Image {
        side,
        pixels,
        total_iterations,
    }
}

/// Renders a `side` x `side` image with `workers` threads.
pub fn render_parallel(side: usize, max_iter: u32, workers: usize, schedule: Schedule) -> Image {
    let workers = workers.max(1);
    let mut pixels = vec![0; side * side];
    if side == 0 {
        return Image {
            side,
            pixels,
            total_iterations: 0,
        };
    }
    // EN: `split_at_mut` and `chunks_mut` cut the buffer into blocks of whole rows that cannot
    //     overlap. That is the proof the Rust compiler asks for before it lets several threads
    //     write to the same buffer: every pixel has exactly one writer, so there is no data
    //     race by construction.
    // PT: O `split_at_mut` e o `chunks_mut` cortam o buffer em blocos de linhas inteiras que não
    //     se sobrepõem. É a prova que o compilador de Rust exige antes de deixar várias threads
    //     escreverem no mesmo buffer: cada pixel tem exatamente um escritor, então não há
    //     corrida de dados por construção.
    // ES: `split_at_mut` y `chunks_mut` cortan el búfer en bloques de filas enteras que no se
    //     solapan. Es la prueba que el compilador de Rust exige antes de dejar que varios hilos
    //     escriban en el mismo búfer: cada píxel tiene exactamente un escritor, así que no hay
    //     condición de carrera por construcción.
    let partials: Vec<u64> = match schedule {
        Schedule::Static => {
            // EN: One big block per worker. The rows in the middle of the image cross the set
            //     and cost far more than the rows at the top and bottom, so the workers with
            //     the outer blocks finish early and wait: the speed-up suffers.
            // PT: Um bloco grande por trabalhador. As linhas do meio da imagem atravessam o
            //     conjunto e custam muito mais que as do topo e da base, então os
            //     trabalhadores com os blocos externos terminam cedo e esperam: o speed-up
            //     sofre.
            // ES: Un bloque grande por trabajador. Las filas del medio de la imagen atraviesan el
            //     conjunto y cuestan mucho más que las de arriba y las de abajo, así que los
            //     trabajadores con los bloques externos terminan antes y esperan: el speed-up
            //     sufre.
            thread::scope(|scope| {
                let mut rest = pixels.as_mut_slice();
                let mut handles = Vec::with_capacity(workers);
                for rows in split_static(side as u64, workers) {
                    let first_row = rows.start as usize;
                    let row_count = (rows.end - rows.start) as usize;
                    let (block, tail) = rest.split_at_mut(row_count * side);
                    rest = tail;
                    handles
                        .push(scope.spawn(move || render_rows(block, first_row, side, max_iter)));
                }
                handles
                    .into_iter()
                    .map(|handle| handle.join().expect("worker panicked"))
                    .collect()
            })
        }
        Schedule::Dynamic => {
            // EN: Many small blocks in a queue. A free worker locks the queue just long enough
            //     to take the next block, then renders it with the lock released. Expensive
            //     and cheap rows end up spread over all workers. Go and C++ use an atomic row
            //     counter here; Rust uses a queue because handing out `&mut` blocks from an
            //     iterator is how it keeps the "one writer per pixel" proof.
            // PT: Muitos blocos pequenos em uma fila. Um trabalhador livre trava a fila só o
            //     tempo de pegar o próximo bloco e depois o calcula com a trava solta. Linhas
            //     caras e baratas acabam espalhadas por todos os trabalhadores. Go e C++ usam
            //     aqui um contador atômico de linhas; Rust usa uma fila porque entregar blocos
            //     `&mut` a partir de um iterador é como ele mantém a prova de "um escritor por
            //     pixel".
            // ES: Muchos bloques pequeños en una cola. Un trabajador libre bloquea la cola solo el
            //     tiempo de tomar el siguiente bloque y luego lo calcula con el bloqueo liberado.
            //     Filas caras y baratas terminan repartidas entre todos los trabajadores. Go y C++
            //     usan aquí un contador atómico de filas; Rust usa una cola porque entregar bloques
            //     `&mut` desde un iterador es como mantiene la prueba de "un escritor por
            //     píxel".
            let queue = Mutex::new(pixels.chunks_mut(DYNAMIC_CHUNK_ROWS * side).enumerate());
            thread::scope(|scope| {
                let handles: Vec<_> = (0..workers)
                    .map(|_| {
                        scope.spawn(|| {
                            let mut local = 0;
                            loop {
                                let next = queue.lock().expect("queue poisoned").next();
                                let Some((index, block)) = next else {
                                    break;
                                };
                                local +=
                                    render_rows(block, index * DYNAMIC_CHUNK_ROWS, side, max_iter);
                            }
                            local
                        })
                    })
                    .collect();
                handles
                    .into_iter()
                    .map(|handle| handle.join().expect("worker panicked"))
                    .collect()
            })
        }
    };
    Image {
        side,
        pixels,
        total_iterations: partials.into_iter().sum(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn escape_time_of_known_points() {
        // The origin is inside the set; the corner (-2, -1.5) leaves after one step.
        assert_eq!(escape_time(0.0, 0.0, 1000), 1000);
        assert_eq!(escape_time(-2.0, -1.5, 1000), 1);
        assert_eq!(escape_time(1.0, 0.0, 1000), 3);
    }

    // EN: The same golden values are asserted by the Go and C++ tests. Floating-point results
    //     match across languages because all three evaluate the same operations in the same
    //     order and none fuses a multiplication and an addition into one instruction.
    // PT: Os mesmos valores de referência são verificados pelos testes de Go e C++. Os
    //     resultados de ponto flutuante coincidem entre linguagens porque as três avaliam as
    //     mesmas operações na mesma ordem e nenhuma funde uma multiplicação e uma soma em uma
    //     única instrução.
    // ES: Los mismos valores de referencia se verifican en las pruebas de Go y C++. Los
    //     resultados de punto flotante coinciden entre lenguajes porque los tres evalúan las
    //     mismas operaciones en el mismo orden y ninguno fusiona una multiplicación y una suma en
    //     una única instrucción.
    #[test]
    fn golden_image() {
        let image = render_sequential(64, MAX_ITER);
        assert_eq!(image.total_iterations, GOLDEN_ITERATIONS);
        assert_eq!(image.checksum(), GOLDEN_CHECKSUM);
    }

    const GOLDEN_ITERATIONS: u64 = 717_248;
    const GOLDEN_CHECKSUM: u64 = 0x6728_d00f_a67e_e48d;

    #[test]
    fn parallel_equals_sequential() {
        for side in [0, 1, 2, 3, 7, 64, 97] {
            let expected = render_sequential(side, 200);
            for workers in [1, 2, 3, 4, 8] {
                for schedule in [Schedule::Static, Schedule::Dynamic] {
                    assert_eq!(
                        render_parallel(side, 200, workers, schedule),
                        expected,
                        "side {side}, {workers} workers, {schedule:?}"
                    );
                }
            }
        }
    }
}
