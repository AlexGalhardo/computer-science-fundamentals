// EN: Two modes, the same as the C++ program.
//     `hybrid-quicksort <pivot>-k<threshold> <shape> <n>` sorts one input and prints one JSON
//     line in the benchmark contract.
//     `hybrid-quicksort sweep <n>` sorts the same random input with thresholds 0, 5, 10, 20 and
//     50 and prints a Markdown table with the best one.
// PT: Dois modos, os mesmos do programa em C++.
//     `hybrid-quicksort <pivô>-k<limiar> <formato> <n>` ordena uma entrada e imprime uma linha
//     JSON no contrato de benchmark.
//     `hybrid-quicksort sweep <n>` ordena a mesma entrada aleatória com limiares 0, 5, 10, 20 e
//     50 e imprime uma tabela Markdown com o melhor.

use std::fs;
use std::process::ExitCode;
use std::time::Instant;

use hybrid_quicksort::{PIVOTS, Pivot, SHAPES, THRESHOLDS, checksum, hybrid_quicksort, make_input};

const MAX_N: usize = 5_000_000;
const MAX_THRESHOLD: usize = 1000;
const REPETITIONS: usize = 5;
const USAGE: &str = "usage: hybrid-quicksort <first|random|median3>-k<threshold> <random|sorted|reversed> <n>\n       hybrid-quicksort sweep <n>";

struct Measurement {
    median_ms: f64,
    min_ms: f64,
    max_ms: f64,
    sorted: Vec<i32>,
}

// EN: The sort is repeated on fresh copies of the input and the median time is reported. One
//     run of a few milliseconds is too noisy to tell threshold 10 from threshold 20.
// PT: A ordenação é repetida em cópias novas da entrada e o tempo mediano é informado. Uma
//     execução de poucos milissegundos é ruidosa demais para separar o limiar 10 do limiar 20.
fn measure(input: &[i32], pivot: Pivot, threshold: usize) -> Measurement {
    let mut times = Vec::with_capacity(REPETITIONS);
    let mut sorted = Vec::new();
    for _ in 0..REPETITIONS {
        sorted = input.to_vec();
        let start = Instant::now();
        hybrid_quicksort(&mut sorted, pivot, threshold);
        times.push(start.elapsed().as_secs_f64() * 1000.0);
    }
    times.sort_by(f64::total_cmp);
    Measurement {
        median_ms: times[REPETITIONS / 2],
        min_ms: times[0],
        max_ms: times[REPETITIONS - 1],
        sorted,
    }
}

fn parse_number(text: &str, limit: usize) -> Result<usize, String> {
    match text.parse::<usize>() {
        Ok(value) if value <= limit => Ok(value),
        _ => Err(format!(
            "expected a number from 0 to {limit}, got \"{text}\""
        )),
    }
}

// EN: VmHWM in /proc/self/status is the peak resident memory of the process in kibibytes.
// PT: VmHWM em /proc/self/status é o pico de memória residente do processo em kibibytes.
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

fn sweep(n: usize) -> String {
    let input = make_input("random", n);
    let mut out =
        String::from("| threshold k | median (ms) | range (ms) |\n| ---: | ---: | ---: |\n");
    let mut best = (0, f64::INFINITY);
    for threshold in THRESHOLDS {
        let result = measure(&input, Pivot::MedianOfThree, threshold);
        if result.median_ms < best.1 {
            best = (threshold, result.median_ms);
        }
        out.push_str(&format!(
            "| {threshold} | {:.2} | {:.2} to {:.2} |\n",
            result.median_ms, result.min_ms, result.max_ms
        ));
    }
    out.push_str(&format!(
        "\nBest threshold: k = {} (Rust, median3, random, n = {n}, median of {REPETITIONS} runs)",
        best.0
    ));
    out
}

fn run(args: &[String]) -> Result<String, String> {
    if let [mode, size] = args
        && mode == "sweep"
    {
        return Ok(sweep(parse_number(size, MAX_N)?));
    }
    let [implementation, shape, size] = args else {
        return Err(USAGE.to_string());
    };
    let (pivot_name, threshold) = implementation.split_once("-k").ok_or(USAGE)?;
    let pivot = PIVOTS
        .iter()
        .find(|(name, _)| *name == pivot_name)
        .map(|(_, pivot)| *pivot)
        .ok_or(USAGE)?;
    if !SHAPES.contains(&shape.as_str()) {
        return Err(USAGE.to_string());
    }
    let threshold = parse_number(threshold, MAX_THRESHOLD)?;
    let n = parse_number(size, MAX_N)?;

    let result = measure(&make_input(shape, n), pivot, threshold);
    Ok(format!(
        "{{\"n\":{n},\"elapsedMs\":{},\"memoryKb\":{},\"language\":\"rust\",\"implementation\":\"{implementation}\",\"checksum\":\"{}\"}}",
        result.median_ms,
        peak_memory_kb(),
        checksum(&result.sorted)
    ))
}

fn main() -> ExitCode {
    let args: Vec<String> = std::env::args().skip(1).collect();
    match run(&args) {
        Ok(line) => {
            println!("{line}");
            ExitCode::SUCCESS
        }
        Err(message) => {
            eprintln!("{message}");
            ExitCode::FAILURE
        }
    }
}
