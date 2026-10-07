use std::env;
use std::fs;
use std::io::{self, BufWriter, Write};
use std::process::ExitCode;
use std::time::Instant;

use bytecode_vm::vm::Vm;
use bytecode_vm::{compiler, disassemble_source, parser, run_source};

const USAGE: &str = "usage:
  bytecode-vm run <file.mini>              run a program
  bytecode-vm disasm <file.mini>           print its bytecode
  bytecode-vm bench <program.mini> <n>     run a benchmark program with `let n = <n>;` in front";

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

// EN: Benchmark entry point. Reading the file, parsing and compiling stay outside the timed
//     section: only the execution of the bytecode is measured, which is the part being compared
//     with the tree-walking interpreter. The last line printed is the JSON object of the
//     repository's benchmark contract, and the checksum is what the program printed.
// PT: Ponto de entrada do benchmark. Ler o arquivo, analisar e compilar ficam fora do trecho
//     cronometrado: só a execução do bytecode é medida, que é a parte comparada com o
//     interpretador de árvore. A última linha impressa é o objeto JSON do contrato de benchmark
//     do repositório, e o checksum é o que o programa imprimiu.
fn bench(path: &str, n: &str) -> Result<(), String> {
    let n: u64 = n
        .parse()
        .map_err(|_| format!("<n> must be a non-negative integer, got '{n}'"))?;
    let body = fs::read_to_string(path).map_err(|error| format!("cannot read {path}: {error}"))?;
    let source = format!("let n = {n};\n{body}");
    let tree = parser::parse(&source).map_err(|error| error.to_string())?;
    let program = compiler::compile(&tree);

    let mut output = Vec::new();
    let started = Instant::now();
    Vm::new(&mut output)
        .run(&program)
        .map_err(|error| error.to_string())?;
    let elapsed_ms = started.elapsed().as_secs_f64() * 1000.0;

    let checksum = String::from_utf8_lossy(&output).trim().replace('\n', ",");
    let implementation = path
        .rsplit('/')
        .next()
        .unwrap_or(path)
        .trim_end_matches(".mini");
    println!(
        "{{\"n\":{n},\"elapsedMs\":{elapsed_ms:.3},\"memoryKb\":{},\"language\":\"rust\",\"implementation\":\"{implementation}\",\"checksum\":\"{checksum}\"}}",
        peak_memory_kb()
    );
    Ok(())
}

fn with_source(path: &str, action: impl FnOnce(&str) -> Result<(), String>) -> Result<(), String> {
    let source =
        fs::read_to_string(path).map_err(|error| format!("cannot read {path}: {error}"))?;
    action(&source)
}

fn main() -> ExitCode {
    let args: Vec<String> = env::args().skip(1).collect();
    let args: Vec<&str> = args.iter().map(String::as_str).collect();
    let result = match args.as_slice() {
        ["run", path] => with_source(path, |source| {
            // EN: Output is buffered and flushed even when the program fails, so everything it
            //     printed before a run-time error still appears.
            // PT: A saída é bufferizada e descarregada mesmo quando o programa falha, então tudo
            //     o que ele imprimiu antes de um erro de execução ainda aparece.
            let mut output = BufWriter::new(io::stdout().lock());
            let result = run_source(source, &mut output);
            let _ = output.flush();
            result.map_err(|error| error.to_string())
        }),
        ["disasm", path] => with_source(path, |source| {
            print!(
                "{}",
                disassemble_source(source).map_err(|error| error.to_string())?
            );
            Ok(())
        }),
        ["bench", path, n] => bench(path, n),
        _ => Err(USAGE.to_string()),
    };
    match result {
        Ok(()) => ExitCode::SUCCESS,
        Err(message) => {
            eprintln!("{message}");
            ExitCode::FAILURE
        }
    }
}
