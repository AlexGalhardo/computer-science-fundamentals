use std::fmt::Write;

use crate::{entropy, huffman, lz77, samples};

pub struct Row {
    pub name: &'static str,
    pub size: usize,
    pub entropy: f64,
    pub bound: f64,
    pub huffman: Vec<u8>,
    pub lz77: Vec<u8>,
    /// EN: Huffman applied to the LZ77 output, the idea behind DEFLATE.
    /// PT: Huffman aplicado à saída do LZ77, a ideia por trás do DEFLATE.
    pub both: Vec<u8>,
    pub sample_hash: u64,
}

// EN: FNV-1a, a short non-cryptographic hash. It is only a fingerprint to prove that Rust and
//     Python produced the same bytes without committing the bytes themselves.
// PT: FNV-1a, um hash curto e não criptográfico. É só uma impressão digital para provar que Rust
//     e Python produziram os mesmos bytes sem versionar os próprios bytes.
pub fn fnv1a64(data: &[u8]) -> u64 {
    data.iter().fold(0xCBF2_9CE4_8422_2325, |hash, &byte| {
        (hash ^ u64::from(byte)).wrapping_mul(0x0000_0100_0000_01B3)
    })
}

pub fn rows() -> Vec<Row> {
    samples::all()
        .into_iter()
        .map(|(name, data)| {
            let lz77 = lz77::encode(&data);
            Row {
                name,
                size: data.len(),
                entropy: entropy::bits_per_byte(&data),
                bound: entropy::bound_bytes(&data),
                huffman: huffman::encode(&data),
                both: huffman::encode(&lz77),
                lz77,
                sample_hash: fnv1a64(&data),
            }
        })
        .collect()
}

// EN: Ratio = compressed size / original size. Below 1 the file shrank, above 1 it grew.
// PT: Taxa = tamanho comprimido / tamanho original. Abaixo de 1 o arquivo encolheu, acima de 1
//     ele cresceu.
fn cell(compressed: usize, original: usize) -> String {
    format!("{compressed} ({:.3})", compressed as f64 / original as f64)
}

pub fn markdown(rows: &[Row]) -> String {
    let mut out = String::from(
        "| Sample | Bytes | Entropy (bits/byte) | Entropy bound (bytes) | Huffman | LZ77 | LZ77 + Huffman |\n\
         | --- | ---: | ---: | ---: | ---: | ---: | ---: |\n",
    );
    for row in rows {
        writeln!(
            out,
            "| `{}` | {} | {:.3} | {:.0} | {} | {} | {} |",
            row.name,
            row.size,
            row.entropy,
            row.bound.ceil(),
            cell(row.huffman.len(), row.size),
            cell(row.lz77.len(), row.size),
            cell(row.both.len(), row.size),
        )
        .expect("writing to a String cannot fail");
    }
    out
}

// EN: One line per sample with sizes and fingerprints. The file is committed, and the tests of
//     both languages must reproduce it exactly.
// PT: Uma linha por amostra com tamanhos e impressões digitais. O arquivo é versionado, e os
//     testes das duas linguagens precisam reproduzi-lo exatamente.
pub fn fixture(rows: &[Row]) -> String {
    let mut out =
        String::from("name\tsize\tsample\thuffman_size\thuffman\tlz77_size\tlz77\tboth_size\n");
    for row in rows {
        writeln!(
            out,
            "{}\t{}\t{:016x}\t{}\t{:016x}\t{}\t{:016x}\t{}",
            row.name,
            row.size,
            row.sample_hash,
            row.huffman.len(),
            fnv1a64(&row.huffman),
            row.lz77.len(),
            fnv1a64(&row.lz77),
            row.both.len(),
        )
        .expect("writing to a String cannot fail");
    }
    out
}
