use std::env;
use std::fs;
use std::process::ExitCode;
use std::time::Instant;

use mini_dbms::workload::{bench_tables, checksum};
use mini_dbms::{hash_join, nested_loop_join, sort_merge_join};

// EN: Peak resident memory of this process in KiB. Linux publishes it as the `VmHWM` line
//     ("high water mark") of /proc/self/status, so no external crate is needed.
// PT: Pico de memória residente deste processo em KiB. O Linux o publica na linha `VmHWM`
//     ("marca d'água máxima") de /proc/self/status, então nenhum crate externo é necessário.
fn peak_memory_kb() -> u64 {
    let status = fs::read_to_string("/proc/self/status").unwrap_or_default();
    status
        .lines()
        .find(|line| line.starts_with("VmHWM:"))
        .and_then(|line| line.split_whitespace().nth(1))
        .and_then(|number| number.parse().ok())
        .unwrap_or(0)
}

// EN: Benchmark entry point: `mini-dbms bench <nested-loop|hash|sort-merge> <n>`. Building the
//     tables is outside the timed section: only the join is measured. The last line printed is
//     the JSON object of the repository's benchmark contract.
// PT: Ponto de entrada do benchmark: `mini-dbms bench <nested-loop|hash|sort-merge> <n>`. A
//     montagem das tabelas fica fora do trecho cronometrado: só a junção é medida. A última
//     linha impressa é o objeto JSON do contrato de benchmark do repositório.
fn main() -> ExitCode {
    let args: Vec<String> = env::args().collect();
    if args.len() != 4 || args[1] != "bench" {
        eprintln!("usage: mini-dbms bench <nested-loop|hash|sort-merge> <n>");
        return ExitCode::from(2);
    }
    let implementation = args[2].as_str();
    let Ok(n) = args[3].parse::<usize>() else {
        eprintln!("n must be a non-negative integer");
        return ExitCode::from(2);
    };

    let (r, s) = bench_tables(n);
    let start = Instant::now();
    let result = match implementation {
        "nested-loop" => nested_loop_join(&r, "k", &s, "k"),
        "hash" => hash_join(&r, "k", &s, "k"),
        "sort-merge" => sort_merge_join(&r, "k", &s, "k"),
        other => Err(format!("unknown implementation: {other}")),
    };
    let elapsed_ms = start.elapsed().as_secs_f64() * 1000.0;

    match result {
        Ok(pairs) => {
            println!(
                "{{\"n\":{n},\"elapsedMs\":{elapsed_ms:.3},\"memoryKb\":{},\"language\":\"rust\",\"implementation\":\"{implementation}\",\"checksum\":\"{}\"}}",
                peak_memory_kb(),
                checksum(&r, &s, &pairs)
            );
            ExitCode::SUCCESS
        }
        Err(message) => {
            eprintln!("{message}");
            ExitCode::from(2)
        }
    }
}
