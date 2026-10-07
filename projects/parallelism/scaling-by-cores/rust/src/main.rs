//! Command line of the benchmark: `scaling-by-cores <implementation> <n> <workers>`.

use std::process::ExitCode;
use std::time::Instant;

use scaling_by_cores::mandelbrot::{self, MAX_ITER};
use scaling_by_cores::primes;
use scaling_by_cores::schedule::Schedule;

const USAGE: &str =
    "usage: scaling-by-cores <primes|mandelbrot>-<seq|static|dynamic> <n> <workers>";

// EN: Peak resident memory of this process, as the Linux kernel reports it in
//     /proc/self/status (the `VmHWM` line, in kB). The benchmark always runs in a Linux
//     container, and outside Linux the field is reported as 0 instead of failing.
// PT: Pico de memória residente deste processo, como o kernel do Linux informa em
//     /proc/self/status (a linha `VmHWM`, em kB). O benchmark sempre roda em um contêiner
//     Linux, e fora do Linux o campo é informado como 0 em vez de falhar.
fn peak_memory_kb() -> u64 {
    std::fs::read_to_string("/proc/self/status")
        .ok()
        .and_then(|status| {
            status
                .lines()
                .find_map(|line| line.strip_prefix("VmHWM:"))
                .and_then(|rest| rest.split_whitespace().next())
                .and_then(|value| value.parse().ok())
        })
        .unwrap_or(0)
}

fn run(implementation: &str, n: u64, workers: usize) -> Option<String> {
    let (workload, mode) = implementation.split_once('-')?;
    let schedule = match mode {
        "seq" => None,
        "static" => Some(Schedule::Static),
        "dynamic" => Some(Schedule::Dynamic),
        _ => return None,
    };
    match workload {
        // EN: `n` is the number of items in both workloads, so one size compares them: the
        //     integers 1..=n tested for primality, or the pixels of a square image whose side
        //     is the integer square root of n.
        // PT: `n` é o número de itens nas duas cargas, então um único tamanho compara as
        //     duas: os inteiros 1..=n testados quanto à primalidade, ou os pixels de uma
        //     imagem quadrada cujo lado é a raiz quadrada inteira de n.
        "primes" => {
            let stats = match schedule {
                None => primes::count_sequential(n),
                Some(schedule) => primes::count_parallel(n, workers, schedule),
            };
            Some(format!("{}:{}", stats.count, stats.sum))
        }
        "mandelbrot" => {
            let side = usize::try_from(n.isqrt()).ok()?;
            let image = match schedule {
                None => mandelbrot::render_sequential(side, MAX_ITER),
                Some(schedule) => mandelbrot::render_parallel(side, MAX_ITER, workers, schedule),
            };
            Some(format!(
                "{}:{:016x}",
                image.total_iterations,
                image.checksum()
            ))
        }
        _ => None,
    }
}

fn main() -> ExitCode {
    let args: Vec<String> = std::env::args().skip(1).collect();
    let [implementation, n, workers] = args.as_slice() else {
        eprintln!("{USAGE}");
        return ExitCode::from(2);
    };
    let (Ok(n), Ok(workers)) = (n.parse::<u64>(), workers.parse::<usize>()) else {
        eprintln!("{USAGE}");
        return ExitCode::from(2);
    };

    // EN: Only the work is timed, not the start-up of the process. The checksum is part of
    //     the work: it is the serial tail every run pays.
    // PT: Só o trabalho é cronometrado, não a inicialização do processo. O checksum faz parte
    //     do trabalho: é a cauda serial que toda execução paga.
    let start = Instant::now();
    let Some(checksum) = run(implementation, n, workers) else {
        eprintln!("{USAGE}");
        return ExitCode::from(2);
    };
    let elapsed_ms = start.elapsed().as_secs_f64() * 1000.0;

    // EN: The benchmark contract: one JSON object on the last line of output.
    // PT: O contrato de benchmark: um objeto JSON na última linha da saída.
    println!(
        "{{\"n\":{n},\"elapsedMs\":{elapsed_ms:.3},\"memoryKb\":{},\"language\":\"rust\",\"implementation\":\"{implementation}\",\"checksum\":\"{checksum}\"}}",
        peak_memory_kb()
    );
    ExitCode::SUCCESS
}
