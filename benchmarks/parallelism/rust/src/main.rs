// EN: Parallelism workload in Rust: count the primes below n, range cut into 256 chunks.
//     Rust model: rayon, the usual data-parallelism library. It keeps a pool of OS threads and
//     each thread has its own queue of tasks. A thread that runs out of work steals a task
//     from another queue (work stealing), so uneven chunks balance themselves. The compiler
//     proves at build time that the closure shares no mutable data between threads.
// PT: Carga de paralelismo em Rust: conta os primos abaixo de n, intervalo cortado em 256
//     pedaços. Modelo do Rust: rayon, a biblioteca usual de paralelismo de dados. Ela mantém um
//     pool de threads do SO e cada thread tem sua fila de tarefas. Uma thread que fica sem
//     trabalho rouba uma tarefa de outra fila (work stealing), então pedaços desiguais se
//     equilibram sozinhos. O compilador prova em tempo de build que a closure não compartilha
//     dado mutável entre threads.
// ES: Carga de paralelismo en Rust: cuenta los primos por debajo de n, rango cortado en 256
//     pedazos. Modelo de Rust: rayon, la biblioteca habitual de paralelismo de datos. Mantiene un
//     pool de threads del SO y cada thread tiene su cola de tareas. Un thread que se queda sin
//     trabajo roba una tarea de otra cola (work stealing), así que los pedazos desiguales se
//     equilibran solos. El compilador prueba en tiempo de build que la closure no comparte
//     datos mutables entre threads.

use rayon::prelude::*;
use std::time::Instant;

const CHUNKS: u64 = 256;

fn is_prime(k: u64) -> bool {
    if k < 2 {
        return false;
    }
    if k < 4 {
        return true;
    }
    if k % 2 == 0 {
        return false;
    }
    let mut d = 3;
    while d * d <= k {
        if k % d == 0 {
            return false;
        }
        d += 2;
    }
    true
}

// EN: Chunk c covers [c*n/256, (c+1)*n/256).
// PT: O pedaço c cobre [c*n/256, (c+1)*n/256).
// ES: El pedazo c cubre [c*n/256, (c+1)*n/256).
fn count_chunk(chunk: u64, n: u64) -> u64 {
    (chunk * n / CHUNKS..(chunk + 1) * n / CHUNKS)
        .filter(|&k| is_prime(k))
        .count() as u64
}

fn count_primes(n: u64, workers: usize) -> u64 {
    let pool = rayon::ThreadPoolBuilder::new()
        .num_threads(workers)
        .build()
        .expect("thread pool");
    pool.install(|| {
        (0..CHUNKS)
            .into_par_iter()
            .map(|chunk| count_chunk(chunk, n))
            .sum()
    })
}

// EN: VmHWM in /proc/self/status is the peak resident memory, in kibibytes.
// PT: VmHWM em /proc/self/status é o pico de memória residente, em kibibytes.
// ES: VmHWM en /proc/self/status es el pico de memoria residente, en kibibytes.
fn peak_memory_kb() -> u64 {
    std::fs::read_to_string("/proc/self/status")
        .ok()
        .and_then(|status| {
            status
                .lines()
                .find(|line| line.starts_with("VmHWM:"))
                .and_then(|line| line.split_whitespace().nth(1)?.parse().ok())
        })
        .unwrap_or(0)
}

fn main() {
    let args: Vec<String> = std::env::args().collect();
    let implementation = args.get(1).map(String::as_str).unwrap_or("primes");
    let n: u64 = args
        .get(2)
        .and_then(|value| value.parse().ok())
        .unwrap_or(100_000);
    let workers: usize = args
        .get(3)
        .and_then(|value| value.parse().ok())
        .unwrap_or(1);

    // EN: Building the pool is inside the timed section, like thread creation elsewhere.
    // PT: Criar o pool fica dentro do trecho cronometrado, como a criação de threads nas outras.
    // ES: Crear el pool queda dentro del tramo cronometrado, como la creación de threads en los otros.
    let start = Instant::now();
    let total = count_primes(n, workers);
    let elapsed_ms = start.elapsed().as_secs_f64() * 1000.0;

    println!(
        "{{\"n\":{n},\"elapsedMs\":{elapsed_ms:.3},\"memoryKb\":{},\"language\":\"rust\",\"implementation\":\"{implementation}\",\"checksum\":\"{total}\"}}",
        peak_memory_kb()
    );
}
