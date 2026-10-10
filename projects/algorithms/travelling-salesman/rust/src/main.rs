// EN: `travelling-salesman <solver> <n>` solves the instance of n cities (seed 1) and prints one
//     JSON line in the benchmark contract. The checksum is the length of the tour found.
// PT: `travelling-salesman <resolvedor> <n>` resolve a instância de n cidades (semente 1) e
//     imprime uma linha JSON no contrato de benchmark. O checksum é o comprimento do passeio.
// ES: `travelling-salesman <resolvedor> <n>` resuelve la instancia de n ciudades (semilla 1) e
//     imprime una línea JSON en el contrato de benchmark. El checksum es la longitud del recorrido.

use std::fs;
use std::process::ExitCode;
use std::time::{Duration, Instant};

use travelling_salesman::{
    HELD_KARP_MAX_CITIES, Instance, brute_force, held_karp, nearest_neighbour, two_opt,
};

// EN: Brute force gives up after 12 seconds and reports "timeout", the same cap as in TypeScript.
// PT: A força bruta desiste após 12 segundos e informa "timeout", o mesmo limite do TypeScript.
// ES: La fuerza bruta se rinde tras 12 segundos e informa "timeout", el mismo límite que
//     TypeScript.
const BRUTE_FORCE_DEADLINE: Duration = Duration::from_secs(12);
const MAX_CITIES: usize = 2000;
const SEED: u64 = 1;
const SOLVERS: [&str; 4] = ["brute-force", "held-karp", "nearest-neighbour", "two-opt"];

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

fn run(args: &[String]) -> Result<String, String> {
    let usage = format!("usage: travelling-salesman <{}> <n>", SOLVERS.join("|"));
    let [implementation, size] = args else {
        return Err(usage);
    };
    if !SOLVERS.contains(&implementation.as_str()) {
        return Err(usage);
    }
    let limit = if implementation == "held-karp" {
        HELD_KARP_MAX_CITIES
    } else {
        MAX_CITIES
    };
    let n = match size.parse::<usize>() {
        Ok(n) if (1..=limit).contains(&n) => n,
        _ => return Err(format!("{usage} (n from 1 to {limit})")),
    };

    let instance = Instance::random(n, SEED);
    let start = Instant::now();
    let checksum = match implementation.as_str() {
        "brute-force" => brute_force(&instance, Some(BRUTE_FORCE_DEADLINE))
            .map_or_else(|| "timeout".to_string(), |s| s.length.to_string()),
        "held-karp" => held_karp(&instance).length.to_string(),
        "nearest-neighbour" => nearest_neighbour(&instance).length.to_string(),
        _ => two_opt(&instance).length.to_string(),
    };
    let elapsed_ms = start.elapsed().as_secs_f64() * 1000.0;

    Ok(format!(
        "{{\"n\":{n},\"elapsedMs\":{elapsed_ms},\"memoryKb\":{},\"language\":\"rust\",\"implementation\":\"{implementation}\",\"checksum\":\"{checksum}\"}}",
        peak_memory_kb()
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
