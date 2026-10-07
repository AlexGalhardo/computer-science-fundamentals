// EN: Prints the fragmentation benchmark. The text must be identical, byte for byte, to the
//     output of `./demo` in the C++ implementation.
// PT: Imprime o benchmark de fragmentação. O texto precisa ser idêntico, byte a byte, à saída de
//     `./demo` na implementação em C++.

use memory_allocator::{WORKLOADS, make_allocators, run_workload};

fn main() {
    for workload in &WORKLOADS {
        println!(
            "Workload: {} (arena {} bytes, {} steps, seed {})",
            workload.name, workload.arena, workload.steps, workload.seed
        );
        println!(
            "{:<10}{:>10}{:>8}{:>10}{:>12}{:>12}{:>11}",
            "strategy", "attempts", "failed", "failed %", "ext frag %", "int frag %", "peak used"
        );
        for mut allocator in make_allocators(workload.arena) {
            let row = run_workload(allocator.as_mut(), workload);
            let failed = if row.attempts == 0 {
                0.0
            } else {
                100.0 * row.failures as f64 / row.attempts as f64
            };
            println!(
                "{:<10}{:>10}{:>8}{:>10.2}{:>12.2}{:>12.2}{:>11}",
                row.strategy,
                row.attempts,
                row.failures,
                failed,
                row.external_fragmentation,
                row.internal_fragmentation,
                row.peak_used
            );
        }
        println!();
    }
}
