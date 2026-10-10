// EN: `sorting-race <algorithm> <variant> <n>` reads `data/<variant>-<n>.txt`, sorts it and
//     prints one JSON line in the benchmark contract. Only the sort is timed.
// PT: `sorting-race <algoritmo> <variante> <n>` lê `data/<variante>-<n>.txt`, ordena e imprime
//     uma linha JSON no contrato de benchmark. Só a ordenação é cronometrada.
// ES: `sorting-race <algoritmo> <variante> <n>` lee `data/<variante>-<n>.txt`, ordena e imprime
//     una línea JSON en el contrato de benchmark. Solo se cronometra la ordenación.

use std::fs;
use std::process::ExitCode;
use std::time::Instant;

use sorting_race::{SORTS, checksum};

const VARIANTS: [&str; 3] = ["random", "sorted", "reversed"];

// EN: The file is external input: a line that is not an integer from 0 to 2^31 - 1 is an error.
// PT: O arquivo é entrada externa: uma linha que não é um inteiro de 0 a 2^31 - 1 é um erro.
// ES: El archivo es entrada externa: una línea que no es un entero de 0 a 2^31 - 1 es un error.
fn read_values(path: &str, expected: usize) -> Result<Vec<i32>, String> {
    let text = fs::read_to_string(path).map_err(|error| format!("{path}: {error}"))?;
    let values = text
        .lines()
        .enumerate()
        .map(|(index, line)| match line.parse::<i32>() {
            Ok(value) if value >= 0 => Ok(value),
            _ => Err(format!(
                "{path}:{}: not an integer from 0 to 2^31 - 1",
                index + 1
            )),
        })
        .collect::<Result<Vec<i32>, String>>()?;
    if values.len() != expected {
        return Err(format!(
            "{path}: expected {expected} values, found {}",
            values.len()
        ));
    }
    Ok(values)
}

// EN: VmHWM ("high water mark") in /proc/self/status is the peak resident memory of the
//     process in kibibytes. Reading it avoids a dependency just to call getrusage.
// PT: VmHWM ("marca d'água") em /proc/self/status é o pico de memória residente do processo em
//     kibibytes. Ler esse arquivo evita uma dependência só para chamar getrusage.
// ES: VmHWM ("marca de agua") en /proc/self/status es el pico de memoria residente del proceso en
//     kibibytes. Leer ese archivo evita una dependencia solo para llamar a getrusage.
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
    let usage = "usage: sorting-race <algorithm> <random|sorted|reversed> <n>";
    let [implementation, variant, size] = args else {
        return Err(usage.to_string());
    };
    let sort = SORTS
        .iter()
        .find(|(name, _)| name == implementation)
        .map(|(_, sort)| sort)
        .ok_or(usage)?;
    if !VARIANTS.contains(&variant.as_str()) {
        return Err(usage.to_string());
    }
    let n: usize = size.parse().map_err(|_| usage.to_string())?;
    let values = read_values(&format!("data/{variant}-{n}.txt"), n)?;

    // EN: Up to 5 runs while the total stays under 300 ms, and the fastest one is reported: the
    //     minimum is the measurement least disturbed by other programs on the machine.
    // PT: Até 5 execuções enquanto o total fica abaixo de 300 ms, e a mais rápida é informada: o
    //     mínimo é a medida menos perturbada por outros programas na máquina.
    // ES: Hasta 5 ejecuciones mientras el total se mantiene por debajo de 300 ms, y se informa la
    //     más rápida: el mínimo es la medida menos perturbada por otros programas en la máquina.
    let mut sorted = Vec::new();
    let mut elapsed_ms = f64::INFINITY;
    let mut spent_ms = 0.0;
    for repetition in 0..5 {
        if repetition > 0 && spent_ms >= 300.0 {
            break;
        }
        let start = Instant::now();
        sorted = sort(&values);
        let elapsed = start.elapsed().as_secs_f64() * 1000.0;
        elapsed_ms = elapsed_ms.min(elapsed);
        spent_ms += elapsed;
    }

    Ok(format!(
        "{{\"n\":{n},\"elapsedMs\":{elapsed_ms},\"memoryKb\":{},\"language\":\"rust\",\"implementation\":\"{implementation}\",\"checksum\":\"{}\"}}",
        peak_memory_kb(),
        checksum(&sorted)
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
