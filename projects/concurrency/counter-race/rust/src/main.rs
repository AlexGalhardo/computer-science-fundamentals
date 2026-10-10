//! Demo: runs one counter variant and prints one JSON line (the benchmark contract of the
//! repository). With no arguments it runs every variant and prints a small table.

use std::process::ExitCode;
use std::time::Instant;

use counter_race::{VARIANTS, new_counter, run};

// EN: 8 workers by default. The benchmark sets WORKERS to 1, 2, 4 and 8 to show how each fix scales.
// PT: 8 workers por padrão. O benchmark define WORKERS como 1, 2, 4 e 8 para mostrar como cada
//     correção escala.
// ES: 8 workers por defecto. El benchmark define WORKERS como 1, 2, 4 y 8 para mostrar cómo
//     escala cada corrección.
fn workers() -> usize {
    std::env::var("WORKERS")
        .ok()
        .and_then(|text| text.parse().ok())
        .filter(|count| *count > 0)
        .unwrap_or(8)
}

/// Peak resident memory of this process, read from Linux.
fn peak_memory_kb() -> u64 {
    std::fs::read_to_string("/proc/self/status")
        .ok()
        .and_then(|status| {
            status
                .lines()
                .find_map(|line| line.strip_prefix("VmHWM:"))
                .and_then(|rest| rest.trim().trim_end_matches("kB").trim().parse().ok())
        })
        .unwrap_or(0)
}

/// Returns the final value and the elapsed milliseconds.
fn measure(variant: &str, n: u64) -> Option<(u64, f64)> {
    let counter = new_counter(variant)?;
    let start = Instant::now();
    let total = run(counter.as_ref(), workers(), n / workers() as u64);
    Some((total, start.elapsed().as_secs_f64() * 1000.0))
}

fn main() -> ExitCode {
    let args: Vec<String> = std::env::args().skip(1).collect();
    let Some(variant) = args.first() else {
        let n = 1_000_000;
        println!(
            "{:<8} {:>10} {:>10} {:>10}",
            "variant", "final", "lost", "ms"
        );
        for variant in VARIANTS {
            if let Some((total, ms)) = measure(variant, n) {
                println!(
                    "{variant:<8} {total:>10} {:>10} {ms:>10.1}",
                    n.saturating_sub(total)
                );
            }
        }
        return ExitCode::SUCCESS;
    };
    let n = match args.get(1).map(|text| text.parse::<u64>()) {
        None => 1_000_000,
        Some(Ok(n)) if n >= workers() as u64 => n,
        Some(_) => {
            eprintln!("n must be an integer of at least {}", workers());
            return ExitCode::from(2);
        }
    };
    let Some((total, ms)) = measure(variant, n) else {
        eprintln!("unknown variant {variant:?} (use one of {VARIANTS:?})");
        return ExitCode::from(2);
    };
    // EN: The checksum is the final value. For a correct counter it equals n.
    // PT: O checksum é o valor final. Em um contador correto ele é igual a n.
    // ES: El checksum es el valor final. En un contador correcto es igual a n.
    println!(
        "{{\"n\":{n},\"elapsedMs\":{ms:.3},\"memoryKb\":{},\"language\":\"rust\",\"implementation\":\"{variant}\",\"checksum\":\"{total}\"}}",
        peak_memory_kb()
    );
    ExitCode::SUCCESS
}
