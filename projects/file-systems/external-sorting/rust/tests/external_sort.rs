use std::io;
use std::path::PathBuf;

use external_sorting::lines::{Digest, SEED, Target, fnv1a64, generate, inspect};
use external_sorting::sorter::{
    Config, RunHeap, external_sort, generate_runs, in_memory_sort, merge_buffer_bytes, merge_runs,
};

fn temp(name: &str) -> io::Result<PathBuf> {
    let directory = std::env::temp_dir().join("extsort-test-rust").join(name);
    if directory.exists() {
        std::fs::remove_dir_all(&directory)?;
    }
    std::fs::create_dir_all(&directory)?;
    Ok(directory)
}

fn sorted_lines(bytes: &[u8]) -> Vec<Vec<u8>> {
    let mut lines: Vec<Vec<u8>> = bytes
        .split(|&byte| byte == b'\n')
        .map(<[u8]>::to_vec)
        .collect();
    if lines.last().is_some_and(Vec::is_empty) {
        lines.pop();
    }
    lines.sort();
    lines
}

fn lines_of(path: &std::path::Path) -> io::Result<Vec<Vec<u8>>> {
    let bytes = std::fs::read(path)?;
    let mut lines: Vec<Vec<u8>> = bytes
        .split(|&byte| byte == b'\n')
        .map(<[u8]>::to_vec)
        .collect();
    if lines.last().is_some_and(Vec::is_empty) {
        lines.pop();
    }
    Ok(lines)
}

// EN: The generator is the contract between the two languages: the same seed must give the
//     same file. These values are also asserted by the Go tests.
// PT: O gerador é o contrato entre as duas linguagens: a mesma semente precisa dar o mesmo
//     arquivo. Estes valores também são verificados pelos testes em Go.
// ES: El generador es el contrato entre los dos lenguajes: la misma semilla debe dar el mismo
//     archivo. Estos valores también los verifican las pruebas en Go.
#[test]
fn generator_is_deterministic() -> io::Result<()> {
    let directory = temp("generator")?;
    let digest = generate(&directory.join("a.txt"), Target::Lines(1000), SEED, 0)?;
    let again = generate(&directory.join("b.txt"), Target::Lines(1000), SEED, 0)?;
    assert_eq!(digest, again);
    assert_eq!(
        std::fs::read(directory.join("a.txt"))?,
        std::fs::read(directory.join("b.txt"))?
    );
    assert_eq!(digest.lines, 1000);
    assert_eq!(
        digest.bytes,
        std::fs::metadata(directory.join("a.txt"))?.len()
    );
    assert_eq!(
        digest.checksum(),
        include_str!("../../fixtures/checksum-1000.txt").trim()
    );
    let (inspected, sorted) = inspect(&directory.join("a.txt"))?;
    assert_eq!(
        inspected, digest,
        "the digest computed while writing equals the one read back"
    );
    assert!(!sorted, "a random file is not sorted");
    assert_eq!(fnv1a64(b""), 0xCBF2_9CE4_8422_2325);
    assert_eq!(fnv1a64(b"a"), 0xAF63_DC4C_8601_EC8C);
    let by_bytes = generate(&directory.join("c.txt"), Target::Bytes(100_000), SEED, 0)?;
    assert!(
        (100_000..100_100).contains(&by_bytes.bytes),
        "stops at the first line past the target"
    );
    Ok(())
}

// EN: Acceptance of MP-FS-2.2: for many shapes of input, run sizes and fan-ins, the output of
//     the external sort is exactly the list of input lines sorted in memory. Equality with
//     that list means both "sorted" and "same multiset of lines".
// PT: Aceite de MP-FS-2.2: para vários formatos de entrada, tamanhos de run e fan-ins, a saída
//     da ordenação externa é exatamente a lista de linhas da entrada ordenada na memória. Ser
//     igual a essa lista significa "ordenada" e também "mesmo multiconjunto de linhas".
// ES: Aceptación de MP-FS-2.2: para varios formatos de entrada, tamaños de run y fan-ins, la
//     salida de la ordenación externa es exactamente la lista de líneas de la entrada ordenada
//     en memoria. Ser igual a esa lista significa "ordenada" y también "mismo multiconjunto de
//     líneas".
#[test]
fn output_equals_in_memory_sort() -> io::Result<()> {
    let directory = temp("equality")?;
    let input = directory.join("input.txt");
    let output = directory.join("output.txt");
    // (lines, distinct keys): few distinct keys force many repeated keys.
    for (case, (lines, distinct)) in [
        (0, 0),
        (1, 0),
        (2, 0),
        (500, 0),
        (5000, 0),
        (5000, 7),
        (3000, 1),
    ]
    .into_iter()
    .enumerate()
    {
        let digest = generate(&input, Target::Lines(lines), SEED + case as u64, distinct)?;
        let expected = sorted_lines(&std::fs::read(&input)?);
        for run_bytes in [128, 4096, 65_536, 1 << 20] {
            for fan_in in [2, 3, 8, 64] {
                let config = Config { run_bytes, fan_in };
                let stats = external_sort(&input, &output, &directory.join("work"), &config)?;
                let what =
                    format!("{lines} lines, {distinct} keys, run {run_bytes}, fan-in {fan_in}");
                assert_eq!(lines_of(&output)?, expected, "{what}");
                assert_eq!(stats.lines, lines, "{what}");
                let (out_digest, sorted) = inspect(&output)?;
                assert!(sorted && out_digest.same_lines(&digest), "{what}");
                // Passes: each one divides the number of runs by the fan-in, rounding up.
                let mut runs = stats.initial_runs;
                let mut passes = 0;
                while runs > 1 {
                    runs = runs.div_ceil(fan_in);
                    passes += 1;
                }
                assert_eq!(stats.merge_passes, passes, "{what}");
                assert_eq!(
                    std::fs::read_dir(directory.join("work"))?.count(),
                    0,
                    "runs are deleted: {what}"
                );
            }
        }
    }
    Ok(())
}

#[test]
fn runs_are_sorted_and_bounded_by_the_run_size() -> io::Result<()> {
    let directory = temp("runs")?;
    let input = directory.join("input.txt");
    let digest = generate(&input, Target::Lines(20_000), SEED, 0)?;
    let run_bytes = 64 * 1024;
    let (runs, lines) = generate_runs(&input, &directory, run_bytes)?;
    assert_eq!(lines, 20_000);
    // Every run but the last is almost full: at most one line (73 bytes) is carried over.
    let at_least = digest.bytes.div_ceil(run_bytes as u64) as usize;
    assert!(
        runs.len() >= at_least && runs.len() <= at_least + 1,
        "{} runs",
        runs.len()
    );
    let mut total = Digest::default();
    for run in &runs {
        assert!(
            std::fs::metadata(run)?.len() <= run_bytes as u64,
            "a run fits in the buffer"
        );
        let (run_digest, sorted) = inspect(run)?;
        assert!(sorted, "every run is sorted");
        total.lines += run_digest.lines;
        total.sum = total.sum.wrapping_add(run_digest.sum);
        total.xor ^= run_digest.xor;
    }
    assert!(
        total.same_lines(&digest),
        "the runs together hold the lines of the input"
    );

    let merged = directory.join("merged.txt");
    assert_eq!(merge_runs(&runs, &merged, 4096)?, 20_000);
    let (merged_digest, sorted) = inspect(&merged)?;
    assert!(
        sorted && merged_digest.same_lines(&digest),
        "one k-way merge of all the runs"
    );
    assert_eq!(
        merge_buffer_bytes(&Config {
            run_bytes: 1 << 20,
            fan_in: 15
        }),
        65_536
    );
    assert_eq!(
        merge_buffer_bytes(&Config {
            run_bytes: 8192,
            fan_in: 64
        }),
        4096
    );
    Ok(())
}

#[test]
fn input_without_final_line_break_and_long_lines() -> io::Result<()> {
    let directory = temp("edges")?;
    let input = directory.join("input.txt");
    let output = directory.join("output.txt");
    std::fs::write(&input, "pear\napple\n\nfig\napple\nbanana")?;
    let config = Config {
        run_bytes: 64,
        fan_in: 2,
    };
    external_sort(&input, &output, &directory.join("work"), &config)?;
    assert_eq!(
        std::fs::read_to_string(&output)?,
        "\napple\napple\nbanana\nfig\npear\n"
    );
    assert_eq!(in_memory_sort(&input, &directory.join("memory.txt"))?, 6);
    assert_eq!(
        std::fs::read(&output)?,
        std::fs::read(directory.join("memory.txt"))?
    );

    std::fs::write(&input, format!("{}\nshort\n", "x".repeat(200)))?;
    assert!(
        external_sort(&input, &output, &directory.join("work"), &config).is_err(),
        "line > run"
    );
    assert!(
        external_sort(
            &input,
            &output,
            &directory.join("work"),
            &Config {
                run_bytes: 4096,
                fan_in: 1
            }
        )
        .is_err()
    );
    Ok(())
}

// EN: The checks themselves are tested: a file out of order, a missing line and a changed
//     line are all detected.
// PT: As próprias verificações são testadas: um arquivo fora de ordem, uma linha faltando e uma
//     linha alterada são todos detectados.
// ES: Las propias verificaciones se prueban: un archivo desordenado, una línea faltante y una
//     línea alterada se detectan todos.
#[test]
fn inspection_detects_wrong_outputs() -> io::Result<()> {
    let directory = temp("inspect")?;
    let write = |name: &str, text: &str| -> io::Result<(Digest, bool)> {
        std::fs::write(directory.join(name), text)?;
        inspect(&directory.join(name))
    };
    let (good, sorted) = write("good.txt", "a\nb\nb\nc\n")?;
    assert!(sorted && good.lines == 4);
    let (unsorted, sorted) = write("unsorted.txt", "a\nc\nb\nb\n")?;
    assert!(
        !sorted && unsorted.same_lines(&good),
        "same lines, wrong order"
    );
    let (missing, sorted) = write("missing.txt", "a\nb\nc\n")?;
    assert!(
        sorted && !missing.same_lines(&good),
        "a repeated line was lost"
    );
    let (changed, _) = write("changed.txt", "a\nb\nb\nd\n")?;
    assert!(!changed.same_lines(&good), "a line was changed");
    Ok(())
}

#[test]
fn heap_always_gives_the_smallest_current_line() {
    let mut lines: Vec<Vec<u8>> = ["m", "c", "x", "c", "a", "t", "k"]
        .iter()
        .map(|text| text.as_bytes().to_vec())
        .collect();
    let mut heap = RunHeap::new((0..lines.len()).collect(), &lines);
    assert_eq!((heap.len(), heap.peek()), (7, Some(4)));
    // Run 4 gives its next line, which is larger than everything else.
    lines[4] = b"z".to_vec();
    heap.top_changed(&lines);
    assert_eq!(
        heap.peek(),
        Some(1),
        "equal lines: the lower run number comes first"
    );
    heap.remove_top(&lines);
    assert_eq!(heap.peek(), Some(3));
    let mut order = Vec::new();
    while let Some(run) = heap.peek() {
        order.push(run);
        heap.remove_top(&lines);
    }
    assert_eq!(order, vec![3, 6, 0, 5, 2, 4]);
    assert!(heap.is_empty());
}
