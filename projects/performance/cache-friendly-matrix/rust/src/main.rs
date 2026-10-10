// EN: Three modes, the same as the C++ program.
//     `cache-friendly-matrix <naive|interchanged|blocked-B> <n>` multiplies two n x n matrices
//     and prints one JSON line in the benchmark contract.
//     `cache-friendly-matrix speedup <n>` times the three variants on the same input, prints a
//     Markdown table and fails unless the blocked variant is at least 2 times faster than naive.
//     `cache-friendly-matrix sweep <n>` times the blocked variant with several block sizes.
// PT: Três modos, os mesmos do programa em C++.
//     `cache-friendly-matrix <naive|interchanged|blocked-B> <n>` multiplica duas matrizes n x n
//     e imprime uma linha JSON no contrato de benchmark.
//     `cache-friendly-matrix speedup <n>` mede as três variantes na mesma entrada, imprime uma
//     tabela Markdown e falha a menos que a variante em blocos seja pelo menos 2 vezes mais
//     rápida que a ingênua.
//     `cache-friendly-matrix sweep <n>` mede a variante em blocos com vários tamanhos de bloco.
// ES: Tres modos, los mismos del programa en C++.
//     `cache-friendly-matrix <naive|interchanged|blocked-B> <n>` multiplica dos matrices n x n
//     e imprime una línea JSON en el contrato de benchmark.
//     `cache-friendly-matrix speedup <n>` mide las tres variantes sobre la misma entrada, imprime
//     una tabla Markdown y falla a menos que la variante por bloques sea al menos 2 veces más
//     rápida que la ingenua.
//     `cache-friendly-matrix sweep <n>` mide la variante por bloques con varios tamaños de bloque.

use std::fs;
use std::process::ExitCode;
use std::time::Instant;

use cache_friendly_matrix::{
    DEFAULT_BLOCK, block_working_set_bytes, checksum, make_matrix, max_abs_diff, multiply_blocked,
    multiply_interchanged, multiply_naive,
};

const MAX_N: usize = 4096;
const MAX_BLOCK: usize = 4096;
const REQUIRED_SPEEDUP: f64 = 2.0;
const SWEEP_BLOCKS: [usize; 7] = [8, 16, 32, 64, 128, 256, 512];
const USAGE: &str = "usage: cache-friendly-matrix <naive|interchanged|blocked-B> <n>\n       cache-friendly-matrix speedup <n>\n       cache-friendly-matrix sweep <n>";

struct Measurement {
    median_ms: f64,
    min_ms: f64,
    max_ms: f64,
    product: Vec<f64>,
}

fn parse_number(text: &str, limit: usize) -> Result<usize, String> {
    if text.is_empty() || text.len() > 6 || !text.bytes().all(|byte| byte.is_ascii_digit()) {
        return Err(USAGE.to_string());
    }
    match text.parse::<usize>() {
        Ok(value) if value >= 1 && value <= limit => Ok(value),
        _ => Err(format!("number out of range: {text}")),
    }
}

fn multiply(implementation: &str, a: &[f64], b: &[f64], n: usize) -> Result<Vec<f64>, String> {
    match implementation {
        "naive" => Ok(multiply_naive(a, b, n)),
        "interchanged" => Ok(multiply_interchanged(a, b, n)),
        _ => match implementation.strip_prefix("blocked-") {
            Some(block) => Ok(multiply_blocked(a, b, n, parse_number(block, MAX_BLOCK)?)),
            None => Err(USAGE.to_string()),
        },
    }
}

// EN: A small multiplication takes a few milliseconds, too little to trust a single run, so it
//     is repeated and the median is reported. A large one takes seconds and runs once: the
//     benchmark runner repeats the whole process anyway and reports the spread.
// PT: Uma multiplicação pequena leva poucos milissegundos, pouco para confiar em uma execução só,
//     então ela é repetida e a mediana é informada. Uma grande leva segundos e roda uma vez: o
//     runner de benchmark repete o processo inteiro de qualquer forma e informa a dispersão.
// ES: Una multiplicación pequeña toma pocos milisegundos, poco para confiar en una sola ejecución,
//     así que se repite y se informa la mediana. Una grande toma segundos y corre una vez: el
//     runner de benchmark repite el proceso completo de todos modos e informa la dispersión.
fn repetitions_for(n: usize) -> usize {
    if n <= 512 { 5 } else { 1 }
}

fn measure(
    implementation: &str,
    a: &[f64],
    b: &[f64],
    n: usize,
    repetitions: usize,
) -> Result<Measurement, String> {
    let mut times = Vec::with_capacity(repetitions);
    let mut product = Vec::new();
    for _ in 0..repetitions {
        let start = Instant::now();
        product = multiply(implementation, a, b, n)?;
        times.push(start.elapsed().as_secs_f64() * 1000.0);
    }
    times.sort_by(f64::total_cmp);
    Ok(Measurement {
        median_ms: times[times.len() / 2],
        min_ms: times[0],
        max_ms: times[times.len() - 1],
        product,
    })
}

// EN: VmHWM in /proc/self/status is the peak resident memory of the process in kibibytes.
// PT: VmHWM em /proc/self/status é o pico de memória residente do processo em kibibytes.
// ES: VmHWM en /proc/self/status es el pico de memoria residente del proceso en kibibytes.
fn peak_memory_kb() -> u64 {
    fs::read_to_string("/proc/self/status")
        .ok()
        .and_then(|status| {
            status
                .lines()
                .find(|line| line.starts_with("VmHWM:"))
                .and_then(|line| line.split_whitespace().nth(1)?.parse().ok())
        })
        .unwrap_or(0)
}

fn speedup(n: usize) -> Result<ExitCode, String> {
    let a = make_matrix(n, 1);
    let b = make_matrix(n, 2);
    let blocked = format!("blocked-{DEFAULT_BLOCK}");
    let repetitions = 3;
    let naive = measure("naive", &a, &b, n, repetitions)?;
    let interchanged = measure("interchanged", &a, &b, n, repetitions)?;
    let tiled = measure(&blocked, &a, &b, n, repetitions)?;

    println!("| variant | median (ms) | range (ms) | times faster than naive | checksum |");
    println!("| --- | ---: | ---: | ---: | --- |");
    for (name, result) in [
        ("naive", &naive),
        ("interchanged", &interchanged),
        (blocked.as_str(), &tiled),
    ] {
        println!(
            "| {name} | {:.1} | {:.1} to {:.1} | {:.2} | {} |",
            result.median_ms,
            result.min_ms,
            result.max_ms,
            naive.median_ms / result.median_ms,
            checksum(&result.product)
        );
    }

    let ratio = naive.median_ms / tiled.median_ms;
    let tolerance = 1e-9 * n as f64;
    println!(
        "\nRust, n = {n}, median of {repetitions} runs: {blocked} is {ratio:.2} times faster than naive (required: {REQUIRED_SPEEDUP:.2})."
    );
    if max_abs_diff(&naive.product, &tiled.product) > tolerance
        || max_abs_diff(&naive.product, &interchanged.product) > tolerance
    {
        eprintln!("FAILED: the variants do not give the same matrix");
        return Ok(ExitCode::FAILURE);
    }
    if ratio < REQUIRED_SPEEDUP {
        eprintln!(
            "FAILED: the blocked variant is not {REQUIRED_SPEEDUP} times faster than naive at n = {n}"
        );
        return Ok(ExitCode::FAILURE);
    }
    Ok(ExitCode::SUCCESS)
}

fn sweep(n: usize) -> Result<ExitCode, String> {
    let a = make_matrix(n, 1);
    let b = make_matrix(n, 2);
    println!("| block B | working set 3 x B^2 x 8 bytes (KiB) | median (ms) | range (ms) |");
    println!("| ---: | ---: | ---: | ---: |");
    let mut best = (0, f64::INFINITY);
    for block in SWEEP_BLOCKS {
        let result = measure(&format!("blocked-{block}"), &a, &b, n, 3)?;
        if result.median_ms < best.1 {
            best = (block, result.median_ms);
        }
        println!(
            "| {block} | {} | {:.1} | {:.1} to {:.1} |",
            block_working_set_bytes(block) / 1024,
            result.median_ms,
            result.min_ms,
            result.max_ms
        );
    }
    println!(
        "\nBest block: B = {} (Rust, n = {n}, median of 3 runs)",
        best.0
    );
    Ok(ExitCode::SUCCESS)
}

fn run(args: &[String]) -> Result<ExitCode, String> {
    let [mode, size] = args else {
        return Err(USAGE.to_string());
    };
    let n = parse_number(size, MAX_N)?;
    match mode.as_str() {
        "speedup" => speedup(n),
        "sweep" => sweep(n),
        implementation => {
            let a = make_matrix(n, 1);
            let b = make_matrix(n, 2);
            let result = measure(implementation, &a, &b, n, repetitions_for(n))?;
            println!(
                "{{\"n\":{n},\"elapsedMs\":{},\"memoryKb\":{},\"language\":\"rust\",\"implementation\":\"{implementation}\",\"checksum\":\"{}\"}}",
                result.median_ms,
                peak_memory_kb(),
                checksum(&result.product)
            );
            Ok(ExitCode::SUCCESS)
        }
    }
}

fn main() -> ExitCode {
    let args: Vec<String> = std::env::args().skip(1).collect();
    match run(&args) {
        Ok(code) => code,
        Err(message) => {
            eprintln!("{message}");
            ExitCode::FAILURE
        }
    }
}
