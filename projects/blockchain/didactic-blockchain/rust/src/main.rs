use didactic_blockchain::bench::{GRID, PASSES, measure, to_json};
use didactic_blockchain::chain::{Block, add_block, genesis, validate};
use std::process::ExitCode;

const DIFFICULTY: u32 = 3;

fn print_chain(chain: &[Block]) {
    for block in chain {
        println!(
            "  block {}  hash {}...  previous {}...  nonce {:>5}  {} transaction(s)",
            block.header.height,
            &block.hash[..16],
            &block.header.previous_hash[..16],
            block.header.nonce,
            block.transactions.len()
        );
    }
}

// EN: Builds a small chain, shows that it validates, then changes one transaction of an old
//     block and shows where validation fails.
// PT: Monta uma cadeia pequena, mostra que ela valida, depois muda uma transação de um bloco
//     antigo e mostra onde a validação falha.
// ES: Arma una cadena pequeña, muestra que valida, luego cambia una transacción de un bloque
//     antiguo y muestra dónde falla la validación.
fn demo() -> ExitCode {
    let mut chain = vec![genesis()];
    add_block(&mut chain, vec!["alice pays bob 20".into()], 1, DIFFICULTY);
    add_block(
        &mut chain,
        vec!["bob pays carol 5".into(), "alice pays carol 7".into()],
        2,
        DIFFICULTY,
    );
    add_block(&mut chain, vec!["carol pays alice 1".into()], 3, DIFFICULTY);
    println!(
        "Chain with difficulty {DIFFICULTY} (hashes start with {DIFFICULTY} zero hex digits):"
    );
    print_chain(&chain);
    println!("validate: {:?}", validate(&chain, DIFFICULTY));

    chain[1].transactions[0] = "alice pays bob 2000".into();
    println!("\nAfter changing \"alice pays bob 20\" to \"alice pays bob 2000\" in block 1:");
    let result = validate(&chain, DIFFICULTY);
    println!("validate: {result:?}");
    if result.is_ok() {
        eprintln!("the tampered chain should not validate");
        return ExitCode::FAILURE;
    }
    ExitCode::SUCCESS
}

fn bench(out: &str, runtime: &str) -> ExitCode {
    let rows: Vec<_> = GRID
        .iter()
        .map(|&(difficulty, blocks)| measure(difficulty, blocks, PASSES))
        .collect();
    for row in &rows {
        println!(
            "difficulty {}: {} blocks, {:.1} attempts and {:.4} ms per block",
            row.difficulty,
            row.blocks,
            row.attempts as f64 / row.blocks as f64,
            row.median_ms
        );
    }
    match std::fs::write(out, to_json(runtime, &rows)) {
        Ok(()) => ExitCode::SUCCESS,
        Err(error) => {
            eprintln!("cannot write {out}: {error}");
            ExitCode::FAILURE
        }
    }
}

fn main() -> ExitCode {
    let args: Vec<String> = std::env::args().skip(1).collect();
    match args
        .iter()
        .map(String::as_str)
        .collect::<Vec<_>>()
        .as_slice()
    {
        ["demo"] => demo(),
        ["bench", out, runtime] => bench(out, runtime),
        _ => {
            eprintln!("usage: didactic-blockchain demo | bench <output.json> <runtime version>");
            ExitCode::from(2)
        }
    }
}
