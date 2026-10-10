use std::io;
use std::path::{Path, PathBuf};
use std::process::ExitCode;

use external_sorting::lines::{Digest, SEED, Target, generate, inspect, set_sync_every};
use external_sorting::peak_rss_kb;
use external_sorting::sorter::{Config, external_sort, in_memory_sort};

const MIB: u64 = 1024 * 1024;
// EN: Under a container memory limit, written data is forced to disk every 4 MiB (see LineWriter).
// PT: Sob um limite de memória do contêiner, os dados gravados são forçados para o disco a cada 4 MiB (veja LineWriter).
// ES: Bajo un límite de memoria del contenedor, los datos escritos se fuerzan a disco cada 4 MiB
//     (véase LineWriter).
const SYNC_MIB: u64 = 4;

fn fail(message: String) -> io::Error {
    io::Error::other(message)
}

fn number(text: Option<&String>, what: &str) -> io::Result<u64> {
    text.and_then(|value| value.parse().ok())
        .ok_or_else(|| fail(format!("missing or invalid {what}")))
}

// EN: The output is accepted only if it is in order and has the same lines as the input.
// PT: A saída só é aceita se estiver em ordem e tiver as mesmas linhas da entrada.
// ES: La salida solo se acepta si está en orden y tiene las mismas líneas que la entrada.
fn check_output(input: &Digest, output: &Path) -> io::Result<Digest> {
    let (digest, sorted) = inspect(output)?;
    if !sorted {
        return Err(fail("the output is not sorted".to_string()));
    }
    if !digest.same_lines(input) {
        return Err(fail(
            "the output does not have the same lines as the input".to_string(),
        ));
    }
    Ok(digest)
}

// EN: `bench <fanin-K> <run-Nk> <lines>`: one row of the benchmark grid. The input is generated
//     once per container and reused by the following runs, so the measured process is the sort.
//     The last line printed follows the benchmark contract of the repository.
// PT: `bench <fanin-K> <run-Nk> <linhas>`: uma linha da grade de benchmark. A entrada é gerada
//     uma vez por contêiner e reaproveitada pelas execuções seguintes, então o processo medido é
//     a ordenação. A última linha impressa segue o contrato de benchmark do repositório.
// ES: `bench <fanin-K> <run-Nk> <líneas>`: una fila de la grilla de benchmark. La entrada se
//     genera una vez por contenedor y se reutiliza en las ejecuciones siguientes, así que el
//     proceso medido es la ordenación. La última línea impresa sigue el contrato de benchmark
//     del repositorio.
fn bench(args: &[String]) -> io::Result<()> {
    let implementation = args
        .first()
        .ok_or_else(|| fail("missing implementation".to_string()))?;
    let variant = args
        .get(1)
        .ok_or_else(|| fail("missing variant".to_string()))?;
    let lines = number(args.get(2), "number of lines")?;
    let fan_in = implementation
        .strip_prefix("fanin-")
        .and_then(|value| value.parse().ok())
        .ok_or_else(|| fail("implementation must be fanin-<k>".to_string()))?;
    let run_kib: usize = variant
        .strip_prefix("run-")
        .and_then(|value| value.strip_suffix('k'))
        .and_then(|value| value.parse().ok())
        .ok_or_else(|| fail("variant must be run-<KiB>k".to_string()))?;

    let input = PathBuf::from(format!("/tmp/extsort-{lines}.txt"));
    let sidecar = PathBuf::from(format!("/tmp/extsort-{lines}.digest"));
    let saved: Vec<u64> = std::fs::read_to_string(&sidecar)
        .unwrap_or_default()
        .split_whitespace()
        .filter_map(|field| field.parse().ok())
        .collect();
    let expected = if let [lines, bytes, sum, xor] = saved[..] {
        Digest {
            lines,
            bytes,
            sum,
            xor,
        }
    } else {
        let digest = generate(&input, Target::Lines(lines), SEED, 0)?;
        let text = format!(
            "{} {} {} {}",
            digest.lines, digest.bytes, digest.sum, digest.xor
        );
        std::fs::write(&sidecar, text)?;
        digest
    };
    let work = PathBuf::from(format!("/tmp/extsort-work-{}", std::process::id()));
    let output = work.join("sorted.txt");
    let stats = external_sort(
        &input,
        &output,
        &work,
        &Config {
            run_bytes: run_kib * 1024,
            fan_in,
        },
    )?;
    let digest = check_output(&expected, &output)?;
    std::fs::remove_dir_all(&work)?;
    eprintln!(
        "runs {}, merge passes {}, run generation {:.1} ms, merge {:.1} ms",
        stats.initial_runs, stats.merge_passes, stats.run_ms, stats.merge_ms
    );
    println!(
        "{{\"n\":{lines},\"elapsedMs\":{:.3},\"memoryKb\":{},\"language\":\"rust\",\"implementation\":\"{implementation}\",\"checksum\":\"{}\"}}",
        stats.run_ms + stats.merge_ms,
        peak_rss_kb(),
        digest.checksum()
    );
    Ok(())
}

fn cgroup(file: &str) -> String {
    std::fs::read_to_string(format!("/sys/fs/cgroup/{file}")).map_or_else(
        |_| "not available".to_string(),
        |text| text.trim().to_string(),
    )
}

// EN: `limit-check <MiB>`: the acceptance test of the memory limit. It generates a file ten
//     times larger than the limit, sorts it with runs of a quarter of the limit, checks the
//     output, and fails unless the peak resident memory of the process stayed under the limit.
//     docker-compose gives the container that same limit, with no swap, so a program that
//     needed more memory would be killed by the kernel instead of finishing.
// PT: `limit-check <MiB>`: o teste de aceite do limite de memória. Gera um arquivo dez vezes
//     maior que o limite, ordena com runs de um quarto do limite, confere a saída e falha se o
//     pico de memória residente do processo não ficou abaixo do limite. O docker-compose dá ao
//     contêiner esse mesmo limite, sem swap, então um programa que precisasse de mais memória
//     seria morto pelo núcleo em vez de terminar.
// ES: `limit-check <MiB>`: la prueba de aceptación del límite de memoria. Genera un archivo
//     diez veces mayor que el límite, ordena con runs de un cuarto del límite, comprueba la
//     salida y falla si el pico de memoria residente del proceso no quedó por debajo del
//     límite. El docker-compose le da al contenedor ese mismo límite, sin swap, así que un
//     programa que necesitara más memoria sería matado por el kernel en lugar de terminar.
fn limit_check(args: &[String]) -> io::Result<()> {
    let limit_mib = number(args.first(), "limit in MiB")?;
    set_sync_every(SYNC_MIB * MIB);
    let work = PathBuf::from("/tmp/extsort-limit");
    std::fs::create_dir_all(&work)?;
    let input = work.join("input.txt");
    let output = work.join("sorted.txt");
    let expected = generate(&input, Target::Bytes(10 * limit_mib * MIB), SEED, 0)?;
    let config = Config {
        run_bytes: (limit_mib * MIB / 4) as usize,
        fan_in: 8,
    };
    let stats = external_sort(&input, &output, &work, &config)?;
    check_output(&expected, &output)?;
    let peak_kb = peak_rss_kb();
    std::fs::remove_dir_all(&work)?;

    println!("language: rust");
    println!(
        "memory limit: {limit_mib} MiB (cgroup memory.max: {})",
        cgroup("memory.max")
    );
    println!(
        "input: {} lines, {} bytes ({:.1} times the limit)",
        expected.lines,
        expected.bytes,
        expected.bytes as f64 / (limit_mib * MIB) as f64
    );
    println!(
        "run size: {} bytes, fan-in {}",
        config.run_bytes, config.fan_in
    );
    println!("fdatasync after every {SYNC_MIB} MiB written");
    println!(
        "initial runs: {}, merge passes: {}",
        stats.initial_runs, stats.merge_passes
    );
    println!(
        "time: run generation {:.0} ms, merge {:.0} ms",
        stats.run_ms, stats.merge_ms
    );
    println!(
        "output: sorted, same lines as the input (checksum {})",
        expected.checksum()
    );
    println!(
        "peak resident memory (VmHWM): {peak_kb} KiB = {:.1} MiB",
        peak_kb as f64 / 1024.0
    );
    println!(
        "cgroup memory.peak, which also counts page cache: {} bytes",
        cgroup("memory.peak")
    );
    if peak_kb == 0 || peak_kb * 1024 >= limit_mib * MIB {
        return Err(fail(format!(
            "peak resident memory is not under the limit of {limit_mib} MiB"
        )));
    }
    println!("OK: peak resident memory stayed under {limit_mib} MiB");
    Ok(())
}

// EN: `in-memory-check <MiB>`: the same file, loaded whole and sorted in memory. Under the
//     container limit this process is expected to be killed (exit code 137).
// PT: `in-memory-check <MiB>`: o mesmo arquivo, carregado inteiro e ordenado na memória. Sob o
//     limite do contêiner, espera-se que este processo seja morto (código de saída 137).
// ES: `in-memory-check <MiB>`: el mismo archivo, cargado entero y ordenado en memoria. Bajo el
//     límite del contenedor, se espera que este proceso sea matado (código de salida 137).
fn in_memory_check(args: &[String]) -> io::Result<()> {
    let limit_mib = number(args.first(), "limit in MiB")?;
    set_sync_every(SYNC_MIB * MIB);
    let work = PathBuf::from("/tmp/extsort-in-memory");
    std::fs::create_dir_all(&work)?;
    let input = work.join("input.txt");
    generate(&input, Target::Bytes(10 * limit_mib * MIB), SEED, 0)?;
    let lines = in_memory_sort(&input, &work.join("sorted.txt"))?;
    println!(
        "in-memory sort of {lines} lines survived with a peak of {} KiB",
        peak_rss_kb()
    );
    Ok(())
}

fn run(args: &[String]) -> io::Result<()> {
    match args.first().map(String::as_str) {
        Some("bench") => bench(&args[1..]),
        Some("limit-check") => limit_check(&args[1..]),
        Some("in-memory-check") => in_memory_check(&args[1..]),
        Some("generate") => {
            let path = args.get(1).ok_or_else(|| fail("missing path".to_string()))?;
            let digest = generate(Path::new(path), Target::Lines(number(args.get(2), "number of lines")?), SEED, 0)?;
            println!("{} lines, {} bytes, checksum {}", digest.lines, digest.bytes, digest.checksum());
            Ok(())
        }
        Some("sort") => {
            let (input, output) = match (args.get(1), args.get(2)) {
                (Some(input), Some(output)) => (Path::new(input), Path::new(output)),
                _ => return Err(fail("usage: sort <input> <output> <run KiB> <fan-in>".to_string())),
            };
            let config = Config {
                run_bytes: number(args.get(3), "run size in KiB")? as usize * 1024,
                fan_in: number(args.get(4), "fan-in")? as usize,
            };
            let work = PathBuf::from(format!("/tmp/extsort-work-{}", std::process::id()));
            let stats = external_sort(input, output, &work, &config)?;
            std::fs::remove_dir_all(&work)?;
            let (input_digest, _) = inspect(input)?;
            check_output(&input_digest, output)?;
            println!(
                "{} lines, {} runs, {} merge passes, {:.0} ms, peak resident memory {} KiB",
                stats.lines,
                stats.initial_runs,
                stats.merge_passes,
                stats.run_ms + stats.merge_ms,
                peak_rss_kb()
            );
            Ok(())
        }
        _ => Err(fail(
            "commands: generate <path> <lines> | sort <input> <output> <run KiB> <fan-in> | bench <fanin-K> <run-Nk> <lines> | limit-check <MiB> | in-memory-check <MiB>"
                .to_string(),
        )),
    }
}

fn main() -> ExitCode {
    let args: Vec<String> = std::env::args().skip(1).collect();
    match run(&args) {
        Ok(()) => ExitCode::SUCCESS,
        Err(error) => {
            eprintln!("extsort: {error}");
            ExitCode::FAILURE
        }
    }
}
