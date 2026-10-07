// EN: Prints the page-fault tables. The text must be identical, byte for byte, to the one
//     printed by `bun run src/cli.ts faults` in the TypeScript implementation.
// PT: Imprime as tabelas de faltas de página. O texto precisa ser idêntico, byte a byte, ao
//     impresso por `bun run src/cli.ts faults` na implementação em TypeScript.

use paging_tlb::{Algorithm, BELADY, CLASSIC, count_faults};

fn table(title: &str, trace: &[u64], frames: &[usize], algorithms: &[Algorithm]) -> String {
    let pages: Vec<String> = trace.iter().map(u64::to_string).collect();
    let mut lines = vec![
        title.to_string(),
        format!("reference string: {}", pages.join(" ")),
    ];
    let header: String = frames.iter().map(|count| format!("{count:>5}")).collect();
    lines.push(format!("{:<8}{header}", "frames"));
    for &algorithm in algorithms {
        let counts: String = frames
            .iter()
            .map(|&count| format!("{:>5}", count_faults(algorithm, trace, count)))
            .collect();
        lines.push(format!("{:<8}{counts}", algorithm.name()));
    }
    lines.join("\n")
}

fn main() {
    let classic = table(
        "Page faults per number of frames",
        &CLASSIC,
        &[1, 2, 3, 4, 5, 6, 7],
        &Algorithm::ALL,
    );
    let belady = table(
        "Belady's anomaly",
        &BELADY,
        &[1, 2, 3, 4, 5],
        &[Algorithm::Fifo, Algorithm::Lru, Algorithm::Optimal],
    );
    println!("{classic}\n\n{belady}");
}
