use std::fs::File;
use std::io::{self, BufRead, BufReader, BufWriter, Write};
use std::path::Path;
use std::sync::atomic::{AtomicU64, Ordering};

pub const SEED: u64 = 20261007;

static SYNC_EVERY: AtomicU64 = AtomicU64::new(0);

// EN: A process-wide setting: after how many bytes written to a file the data is forced to the
//     disk. Zero, the default, never forces it. See `LineWriter`.
// PT: Uma configuração do processo inteiro: depois de quantos bytes gravados em um arquivo os
//     dados são forçados para o disco. Zero, o padrão, nunca força. Veja `LineWriter`.
pub fn set_sync_every(bytes: u64) {
    SYNC_EVERY.store(bytes, Ordering::Relaxed);
}

// EN: Every output file of the sort is written through this buffered writer. Bytes handed to
//     the kernel are not on the disk yet: they wait in the page cache as dirty pages. A
//     container memory limit also counts those pages, and dirty pages cannot be dropped until
//     they are written. A program that writes faster than the disk can therefore be killed
//     while its own memory is tiny. With a sync interval, the writer calls fdatasync every few
//     megabytes, which bounds the dirty pages the process can leave behind.
// PT: Todo arquivo de saída da ordenação é gravado por este escritor com buffer. Os bytes
//     entregues ao núcleo ainda não estão no disco: esperam no cache de páginas como páginas
//     sujas. O limite de memória de um contêiner também conta essas páginas, e páginas sujas
//     não podem ser descartadas antes de serem gravadas. Um programa que grava mais rápido que
//     o disco pode, então, ser morto mesmo com a própria memória minúscula. Com um intervalo de
//     sincronização, o escritor chama fdatasync a cada poucos megabytes, o que limita as
//     páginas sujas que o processo deixa para trás.
pub struct LineWriter {
    writer: BufWriter<File>,
    sync_every: u64,
    unsynced: u64,
}

impl LineWriter {
    pub fn create(path: &Path, buffer_bytes: usize) -> io::Result<Self> {
        Ok(Self {
            writer: BufWriter::with_capacity(buffer_bytes, File::create(path)?),
            sync_every: SYNC_EVERY.load(Ordering::Relaxed),
            unsynced: 0,
        })
    }

    pub fn write_line(&mut self, line: &[u8]) -> io::Result<()> {
        self.writer.write_all(line)?;
        self.writer.write_all(b"\n")?;
        self.unsynced += line.len() as u64 + 1;
        if self.sync_every > 0 && self.unsynced >= self.sync_every {
            self.writer.flush()?;
            self.writer.get_ref().sync_data()?;
            self.unsynced = 0;
        }
        Ok(())
    }

    pub fn finish(mut self) -> io::Result<()> {
        self.writer.flush()?;
        if self.sync_every > 0 {
            self.writer.get_ref().sync_data()?;
        }
        Ok(())
    }
}

// EN: SplitMix64, a small pseudo-random generator. The same seed gives the same sequence in
//     Rust and in Go, so both programs generate the same input file, byte for byte.
// PT: SplitMix64, um gerador pseudoaleatório pequeno. A mesma semente dá a mesma sequência em
//     Rust e em Go, então os dois programas geram o mesmo arquivo de entrada, byte a byte.
pub struct SplitMix64 {
    pub state: u64,
}

impl SplitMix64 {
    pub fn next_u64(&mut self) -> u64 {
        self.state = self.state.wrapping_add(0x9E37_79B9_7F4A_7C15);
        let mut z = self.state;
        z = (z ^ (z >> 30)).wrapping_mul(0xBF58_476D_1CE4_E5B9);
        z = (z ^ (z >> 27)).wrapping_mul(0x94D0_49BB_1331_11EB);
        z ^ (z >> 31)
    }

    pub fn below(&mut self, limit: u64) -> u64 {
        self.next_u64() % limit
    }
}

// EN: What is known about a file of lines without keeping it in memory: how many lines it
//     has, whether they are in order, and a checksum that does not depend on the order of the
//     lines (the sum and the exclusive-or of a 64-bit hash of each line). Two files with the
//     same count and the same checksum hold, for all practical purposes, the same multiset of
//     lines: the input and the sorted output are compared this way in O(1) memory.
// PT: O que se sabe sobre um arquivo de linhas sem guardá-lo na memória: quantas linhas tem, se
//     estão em ordem, e um checksum que não depende da ordem das linhas (a soma e o ou-exclusivo
//     de um hash de 64 bits de cada linha). Dois arquivos com a mesma contagem e o mesmo
//     checksum têm, para todos os efeitos práticos, o mesmo multiconjunto de linhas: a entrada
//     e a saída ordenada são comparadas assim com memória O(1).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub struct Digest {
    pub lines: u64,
    pub bytes: u64,
    pub sum: u64,
    pub xor: u64,
}

impl Digest {
    pub fn add(&mut self, line: &[u8]) {
        let hash = fnv1a64(line);
        self.lines += 1;
        self.bytes += line.len() as u64 + 1;
        self.sum = self.sum.wrapping_add(hash);
        self.xor ^= hash;
    }

    pub fn checksum(&self) -> String {
        format!("{:016x}{:016x}", self.sum, self.xor)
    }

    pub fn same_lines(&self, other: &Digest) -> bool {
        self.lines == other.lines && self.sum == other.sum && self.xor == other.xor
    }
}

pub fn fnv1a64(bytes: &[u8]) -> u64 {
    let mut hash = 0xCBF2_9CE4_8422_2325u64;
    for &byte in bytes {
        hash ^= u64::from(byte);
        hash = hash.wrapping_mul(0x0000_0100_0000_01B3);
    }
    hash
}

#[derive(Debug, Clone, Copy)]
pub enum Target {
    Lines(u64),
    Bytes(u64),
}

// EN: Writes the input file: each line is a key of 16 hexadecimal digits, a space and 8 to 56
//     letters, about 50 bytes per line. `distinct` limits the number of different keys, which
//     the tests use to force repeated keys (0 means any 64-bit key). The digest is computed
//     while writing, so the input never has to be read again to be compared with the output.
// PT: Grava o arquivo de entrada: cada linha é uma chave de 16 dígitos hexadecimais, um espaço
//     e de 8 a 56 letras, cerca de 50 bytes por linha. `distinct` limita o número de chaves
//     diferentes, o que os testes usam para forçar chaves repetidas (0 significa qualquer chave
//     de 64 bits). O digest é calculado durante a gravação, então a entrada nunca precisa ser
//     lida de novo para ser comparada com a saída.
pub fn generate(path: &Path, target: Target, seed: u64, distinct: u64) -> io::Result<Digest> {
    const HEX: &[u8; 16] = b"0123456789abcdef";
    let mut writer = LineWriter::create(path, 1 << 16)?;
    let mut rng = SplitMix64 { state: seed };
    let mut digest = Digest::default();
    let mut line = Vec::with_capacity(80);
    loop {
        let done = match target {
            Target::Lines(lines) => digest.lines >= lines,
            Target::Bytes(bytes) => digest.bytes >= bytes,
        };
        if done {
            break;
        }
        line.clear();
        let key = if distinct == 0 {
            rng.next_u64()
        } else {
            rng.below(distinct)
        };
        for digit in (0..16).rev() {
            line.push(HEX[((key >> (4 * digit)) & 0xF) as usize]);
        }
        line.push(b' ');
        let letters = 8 + rng.below(49) as usize;
        let mut written = 0;
        while written < letters {
            let value = rng.next_u64();
            for k in 0..8 {
                if written < letters {
                    line.push(b'a' + (((value >> (8 * k)) & 0xFF) % 26) as u8);
                    written += 1;
                }
            }
        }
        digest.add(&line);
        writer.write_line(&line)?;
    }
    writer.finish()?;
    Ok(digest)
}

// EN: Reads one line into `line`, without the line break. Returns false at the end of the file.
// PT: Lê uma linha para `line`, sem a quebra de linha. Devolve false no fim do arquivo.
pub fn read_line(reader: &mut impl BufRead, line: &mut Vec<u8>) -> io::Result<bool> {
    line.clear();
    if reader.read_until(b'\n', line)? == 0 {
        return Ok(false);
    }
    if line.last() == Some(&b'\n') {
        line.pop();
    }
    Ok(true)
}

// EN: One sequential pass over a file: the digest, and whether every line is greater than or
//     equal to the one before it.
// PT: Uma passada sequencial em um arquivo: o digest, e se cada linha é maior ou igual à anterior.
pub fn inspect(path: &Path) -> io::Result<(Digest, bool)> {
    let mut reader = BufReader::with_capacity(1 << 16, File::open(path)?);
    let mut digest = Digest::default();
    let mut sorted = true;
    let mut previous: Vec<u8> = Vec::new();
    let mut line = Vec::new();
    while read_line(&mut reader, &mut line)? {
        if digest.lines > 0 && line < previous {
            sorted = false;
        }
        digest.add(&line);
        std::mem::swap(&mut previous, &mut line);
    }
    Ok((digest, sorted))
}
