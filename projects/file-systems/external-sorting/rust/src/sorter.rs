use std::fs::File;
use std::io::{self, BufReader, Read};
use std::path::{Path, PathBuf};
use std::time::Instant;

use crate::lines::{LineWriter, read_line};

#[derive(Debug, Clone, Copy)]
pub struct Config {
    /// Bytes of lines sorted in memory at a time: the size of one run.
    pub run_bytes: usize,
    /// How many runs one merge reads at the same time.
    pub fan_in: usize,
}

#[derive(Debug, Clone, Copy, Default, PartialEq)]
pub struct Stats {
    pub lines: u64,
    pub initial_runs: usize,
    pub merge_passes: usize,
    pub run_ms: f64,
    pub merge_ms: f64,
}

fn invalid(message: &str) -> io::Error {
    io::Error::new(io::ErrorKind::InvalidInput, message.to_string())
}

// EN: Phase 1, run generation. One buffer of `run_bytes` is the only large piece of memory:
//     it is filled from the file, the lines inside it are sorted, and they are written as one
//     sorted run. The lines are not copied to be sorted: an index of (start, length) pairs is
//     sorted instead, at a cost of 8 bytes per line. A line cut by the end of the buffer is
//     carried to the start of the next one. The input is read once, from start to end.
// PT: Fase 1, geração de runs. Um buffer de `run_bytes` é o único pedaço grande de memória: ele
//     é preenchido a partir do arquivo, as linhas dentro dele são ordenadas e gravadas como uma
//     run ordenada. As linhas não são copiadas para ordenar: ordena-se um índice de pares
//     (início, tamanho), ao custo de 8 bytes por linha. Uma linha cortada pelo fim do buffer é
//     levada para o começo do próximo. A entrada é lida uma única vez, do início ao fim.
pub fn generate_runs(
    input: &Path,
    tmp: &Path,
    run_bytes: usize,
) -> io::Result<(Vec<PathBuf>, u64)> {
    if !(64..=u32::MAX as usize).contains(&run_bytes) {
        return Err(invalid("run size must be between 64 bytes and 4 GiB"));
    }
    let mut file = File::open(input)?;
    let mut buffer = vec![0u8; run_bytes];
    let mut index: Vec<(u32, u32)> = Vec::new();
    let mut runs = Vec::new();
    let mut lines = 0u64;
    let mut filled = 0;
    let mut end_of_file = false;
    while !end_of_file {
        while filled < buffer.len() {
            let read = file.read(&mut buffer[filled..])?;
            if read == 0 {
                end_of_file = true;
                break;
            }
            filled += read;
        }
        if filled == 0 {
            break;
        }
        let end = if end_of_file {
            filled
        } else {
            match buffer[..filled].iter().rposition(|&byte| byte == b'\n') {
                Some(at) => at + 1,
                None => return Err(invalid("a line is longer than the run size")),
            }
        };
        index.clear();
        let mut start = 0;
        while start < end {
            let length = buffer[start..end]
                .iter()
                .position(|&byte| byte == b'\n')
                .unwrap_or(end - start);
            index.push((start as u32, length as u32));
            start += length + 1;
        }
        let line =
            |&(start, length): &(u32, u32)| &buffer[start as usize..(start + length) as usize];
        index.sort_unstable_by(|a, b| line(a).cmp(line(b)));

        let path = tmp.join(format!("run-{}.txt", runs.len()));
        let mut writer = LineWriter::create(&path, 1 << 16)?;
        for entry in &index {
            writer.write_line(line(entry))?;
        }
        writer.finish()?;
        runs.push(path);
        lines += index.len() as u64;
        buffer.copy_within(end..filled, 0);
        filled -= end;
    }
    Ok((runs, lines))
}

// EN: A binary min-heap of run numbers. The heap does not hold the lines, only which run each
//     candidate comes from, and it compares the current line of those runs. The smallest
//     current line is always at position 0. When two lines are equal the lower run number
//     wins, which keeps the merge stable: equal lines leave in the order of the runs.
// PT: Um heap binário de mínimo com números de runs. O heap não guarda as linhas, só de qual
//     run vem cada candidato, e compara a linha atual dessas runs. A menor linha atual está
//     sempre na posição 0. Quando duas linhas são iguais, ganha a run de menor número, o que
//     mantém a intercalação estável: linhas iguais saem na ordem das runs.
pub struct RunHeap {
    items: Vec<usize>,
}

impl RunHeap {
    pub fn new(runs: Vec<usize>, lines: &[Vec<u8>]) -> Self {
        let mut heap = Self { items: runs };
        for at in (0..heap.items.len() / 2).rev() {
            heap.sift_down(at, lines);
        }
        heap
    }

    pub fn peek(&self) -> Option<usize> {
        self.items.first().copied()
    }

    pub fn len(&self) -> usize {
        self.items.len()
    }

    pub fn is_empty(&self) -> bool {
        self.items.is_empty()
    }

    // EN: The line of the run at the top changed (the next line of that run was read), so it
    //     sinks until both children are larger. This costs about log2(k) comparisons, against
    //     the k - 1 of looking at every run.
    // PT: A linha da run do topo mudou (a próxima linha dessa run foi lida), então ela desce
    //     até que os dois filhos sejam maiores. Isso custa cerca de log2(k) comparações, contra
    //     as k - 1 de olhar todas as runs.
    pub fn top_changed(&mut self, lines: &[Vec<u8>]) {
        self.sift_down(0, lines);
    }

    // EN: The run at the top ended: the last item takes its place and sinks.
    // PT: A run do topo acabou: o último item toma o lugar dela e desce.
    pub fn remove_top(&mut self, lines: &[Vec<u8>]) {
        let last = self.items.len() - 1;
        self.items.swap(0, last);
        self.items.pop();
        self.sift_down(0, lines);
    }

    fn less(&self, a: usize, b: usize, lines: &[Vec<u8>]) -> bool {
        let (left, right) = (self.items[a], self.items[b]);
        (&lines[left], left) < (&lines[right], right)
    }

    fn sift_down(&mut self, mut at: usize, lines: &[Vec<u8>]) {
        loop {
            let mut smallest = at;
            for child in [2 * at + 1, 2 * at + 2] {
                if child < self.items.len() && self.less(child, smallest, lines) {
                    smallest = child;
                }
            }
            if smallest == at {
                return;
            }
            self.items.swap(at, smallest);
            at = smallest;
        }
    }
}

// EN: Phase 2, the k-way merge. Each run is read sequentially through its own buffer, and
//     only one line of each run is in memory. The heap says which run has the smallest line:
//     that line is written, the next line of the same run is read, and the heap is repaired.
// PT: Fase 2, a intercalação de k caminhos. Cada run é lida em sequência pelo seu próprio
//     buffer, e só uma linha de cada run fica na memória. O heap diz qual run tem a menor
//     linha: essa linha é gravada, a próxima linha da mesma run é lida, e o heap é consertado.
pub fn merge_runs(inputs: &[PathBuf], output: &Path, buffer_bytes: usize) -> io::Result<u64> {
    let mut readers = Vec::with_capacity(inputs.len());
    let mut lines: Vec<Vec<u8>> = vec![Vec::new(); inputs.len()];
    let mut alive = Vec::new();
    for (run, path) in inputs.iter().enumerate() {
        let mut reader = BufReader::with_capacity(buffer_bytes, File::open(path)?);
        if read_line(&mut reader, &mut lines[run])? {
            alive.push(run);
        }
        readers.push(reader);
    }
    let mut heap = RunHeap::new(alive, &lines);
    let mut writer = LineWriter::create(output, buffer_bytes)?;
    let mut written = 0u64;
    while let Some(run) = heap.peek() {
        writer.write_line(&lines[run])?;
        written += 1;
        if read_line(&mut readers[run], &mut lines[run])? {
            heap.top_changed(&lines);
        } else {
            heap.remove_top(&lines);
        }
    }
    writer.finish()?;
    Ok(written)
}

// EN: The whole memory of the merge is its buffers: one per input run plus one for the output.
//     With a fixed budget, a larger fan-in means smaller buffers, so each refill brings less
//     data. On a magnetic disk every refill is also a seek.
// PT: Toda a memória da intercalação são os seus buffers: um por run de entrada mais um para a
//     saída. Com um orçamento fixo, um fan-in maior significa buffers menores, então cada
//     recarga traz menos dados. Em um disco magnético cada recarga é também um seek.
pub fn merge_buffer_bytes(config: &Config) -> usize {
    (config.run_bytes / (config.fan_in + 1)).max(4096)
}

fn move_file(from: &Path, to: &Path) -> io::Result<()> {
    if std::fs::rename(from, to).is_err() {
        std::fs::copy(from, to)?;
        std::fs::remove_file(from)?;
    }
    Ok(())
}

// EN: External merge sort. After run generation, each merge pass joins groups of up to
//     `fan_in` runs into longer runs, until one is left. A pass reads and writes every line
//     once, so the number of passes, ceil(log base fan_in of the number of runs), is what the
//     configuration really changes. Merged runs are deleted as soon as they are consumed.
// PT: Ordenação externa por intercalação. Depois da geração de runs, cada passada junta grupos
//     de até `fan_in` runs em runs maiores, até sobrar uma. Uma passada lê e grava cada linha
//     uma vez, então o número de passadas, teto(log na base fan_in do número de runs), é o que
//     a configuração realmente muda. As runs intercaladas são apagadas assim que consumidas.
pub fn external_sort(
    input: &Path,
    output: &Path,
    tmp: &Path,
    config: &Config,
) -> io::Result<Stats> {
    if config.fan_in < 2 {
        return Err(invalid("fan-in must be at least 2"));
    }
    std::fs::create_dir_all(tmp)?;
    let started = Instant::now();
    let (mut runs, lines) = generate_runs(input, tmp, config.run_bytes)?;
    let run_ms = started.elapsed().as_secs_f64() * 1000.0;
    let mut stats = Stats {
        lines,
        initial_runs: runs.len(),
        run_ms,
        ..Stats::default()
    };

    let started = Instant::now();
    let buffer_bytes = merge_buffer_bytes(config);
    while runs.len() > 1 {
        stats.merge_passes += 1;
        let last_pass = runs.len() <= config.fan_in;
        let mut merged = Vec::new();
        for (group_number, group) in runs.chunks(config.fan_in).enumerate() {
            if group.len() == 1 {
                merged.push(group[0].clone());
                continue;
            }
            let target = if last_pass {
                output.to_path_buf()
            } else {
                tmp.join(format!("pass-{}-{group_number}.txt", stats.merge_passes))
            };
            merge_runs(group, &target, buffer_bytes)?;
            for path in group {
                std::fs::remove_file(path)?;
            }
            merged.push(target);
        }
        runs = merged;
    }
    match runs.first() {
        // A single run was generated: it is already the sorted file.
        Some(only) if only != output => move_file(only, output)?,
        Some(_) => {}
        None => drop(File::create(output)?),
    }
    stats.merge_ms = started.elapsed().as_secs_f64() * 1000.0;
    Ok(stats)
}

// EN: The wrong tool, kept for comparison: load the whole file and sort it in memory. It needs
//     memory proportional to the file, and under the memory limit of the demo it is killed.
// PT: A ferramenta errada, mantida para comparação: carregar o arquivo inteiro e ordenar na
//     memória. Ela precisa de memória proporcional ao arquivo e, sob o limite de memória da
//     demonstração, é morta pelo sistema.
pub fn in_memory_sort(input: &Path, output: &Path) -> io::Result<u64> {
    let bytes = std::fs::read(input)?;
    let mut lines: Vec<&[u8]> = bytes.split(|&byte| byte == b'\n').collect();
    if lines.last().is_some_and(|line| line.is_empty()) {
        lines.pop();
    }
    lines.sort_unstable();
    let mut writer = LineWriter::create(output, 1 << 16)?;
    for line in &lines {
        writer.write_line(line)?;
    }
    writer.finish()?;
    Ok(lines.len() as u64)
}
