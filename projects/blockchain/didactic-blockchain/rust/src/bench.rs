use crate::chain::{Header, mine};
use crate::sha256::sha256_hex;
use std::time::Instant;

// EN: The same grid as the TypeScript benchmark: (difficulty, blocks mined at that difficulty),
//     each row timed PASSES times.
// PT: A mesma grade do benchmark em TypeScript: (dificuldade, blocos minerados nela), cada
//     linha cronometrada PASSES vezes.
// ES: La misma cuadrícula del benchmark en TypeScript: (dificultad, bloques minados en ella),
//     cada fila cronometrada PASSES veces.
pub const GRID: [(u32, u64); 4] = [(1, 40000), (2, 4000), (3, 500), (4, 150)];
pub const PASSES: usize = 3;

pub struct Row {
    pub difficulty: u32,
    pub blocks: u64,
    pub passes: usize,
    /// Nonces tried in one pass over all the blocks.
    pub attempts: u64,
    /// Time per block in the median, the fastest and the slowest pass.
    pub median_ms: f64,
    pub min_ms: f64,
    pub max_ms: f64,
}

// EN: Mines `blocks` fixed headers at one difficulty. The headers are the same ones the
//     TypeScript benchmark mines, so the number of attempts must be identical in both languages.
//     They are built before the clock starts.
// PT: Minera `blocks` cabeçalhos fixos em uma dificuldade. Os cabeçalhos são os mesmos que o
//     benchmark em TypeScript minera, então o número de tentativas precisa ser idêntico nas
//     duas linguagens. Eles são montados antes de o relógio começar.
// ES: Mina `blocks` encabezados fijos con una dificultad. Los encabezados son los mismos que
//     mina el benchmark en TypeScript, así que el número de intentos debe ser idéntico en los
//     dos lenguajes. Se arman antes de que empiece el reloj.
pub fn measure(difficulty: u32, blocks: u64, passes: usize) -> Row {
    let merkle_root = sha256_hex("bench");
    let headers: Vec<Header> = (0..blocks)
        .map(|height| Header {
            height,
            previous_hash: sha256_hex(&format!("bench {difficulty} {height}")),
            merkle_root: merkle_root.clone(),
            timestamp: 0,
            difficulty,
            nonce: 0,
        })
        .collect();
    let mut attempts = 0;
    let mut times = Vec::with_capacity(passes);
    for _ in 0..passes.max(1) {
        attempts = 0;
        let start = Instant::now();
        for header in &headers {
            attempts += mine(header.clone()).attempts;
        }
        times.push(start.elapsed().as_secs_f64() * 1000.0 / blocks as f64);
    }
    times.sort_by(f64::total_cmp);
    Row {
        difficulty,
        blocks,
        passes: times.len(),
        attempts,
        median_ms: times[times.len() / 2],
        min_ms: times[0],
        max_ms: times[times.len() - 1],
    }
}

fn escape(text: &str) -> String {
    text.replace('\\', "\\\\").replace('"', "\\\"")
}

/// The same JSON shape the TypeScript benchmark writes, read by `ts/src/report.ts`.
pub fn to_json(runtime: &str, rows: &[Row]) -> String {
    let rows: Vec<String> = rows
        .iter()
        .map(|row| {
            format!(
                "\t\t{{ \"difficulty\": {}, \"blocks\": {}, \"passes\": {}, \"attempts\": {}, \"meanAttempts\": {}, \"medianMs\": {}, \"minMs\": {}, \"maxMs\": {} }}",
                row.difficulty,
                row.blocks,
                row.passes,
                row.attempts,
                row.attempts as f64 / row.blocks as f64,
                row.median_ms,
                row.min_ms,
                row.max_ms
            )
        })
        .collect();
    format!(
        "{{\n\t\"language\": \"rust\",\n\t\"runtime\": \"{}\",\n\t\"machine\": \"\",\n\t\"command\": \"docker compose run --rm bench-rust\",\n\t\"date\": \"\",\n\t\"rows\": [\n{}\n\t]\n}}\n",
        escape(runtime),
        rows.join(",\n")
    )
}
