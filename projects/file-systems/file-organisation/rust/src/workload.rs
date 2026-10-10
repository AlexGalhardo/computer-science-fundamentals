use std::fmt::Write as _;
use std::io;
use std::path::Path;

use crate::compression::{huffman_decode, huffman_encode, rle_decode, rle_encode};
use crate::database::Database;
use crate::record_file::{HEADER_SIZE, RECORD_SIZE, Record};

pub const SEED: u64 = 20261007;

// EN: SplitMix64, a small pseudo-random generator. The same seed gives the same sequence in
//     C++ and in Rust, so both programs build the same file and print the same tables.
// PT: SplitMix64, um gerador pseudoaleatório pequeno. A mesma semente dá a mesma sequência em
//     C++ e em Rust, então os dois programas montam o mesmo arquivo e imprimem as mesmas tabelas.
// ES: SplitMix64, un generador pseudoaleatorio pequeño. La misma semilla da la misma secuencia
//     en C++ y en Rust, así que los dos programas arman el mismo archivo e imprimen las mismas
//     tablas.
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

pub const CITIES: [&str; 12] = [
    "BELEM",
    "BELO HORIZONTE",
    "BRASILIA",
    "CURITIBA",
    "FORTALEZA",
    "MANAUS",
    "NATAL",
    "PORTO ALEGRE",
    "RECIFE",
    "RIO DE JANEIRO",
    "SALVADOR",
    "SAO PAULO",
];

pub fn make_record(id: u32, rng: &mut SplitMix64) -> Record {
    let year = 2000 + rng.below(25) as u16;
    let city = CITIES[rng.below(CITIES.len() as u64) as usize].to_string();
    let mut name = format!("N{id}-");
    let letters = 4 + rng.below(20);
    for _ in 0..letters {
        name.push(char::from(b'a' + rng.below(26) as u8));
    }
    Record {
        id,
        year,
        city,
        name,
    }
}

pub fn shuffle(values: &mut [u32], rng: &mut SplitMix64) {
    for i in (2..=values.len()).rev() {
        values.swap(i - 1, rng.below(i as u64) as usize);
    }
}

pub fn ids_of(records: &[Record]) -> Vec<u32> {
    let mut ids: Vec<u32> = records.iter().map(|record| record.id).collect();
    ids.sort_unstable();
    ids
}

fn text_error(_: std::fmt::Error) -> io::Error {
    io::Error::other("cannot format the report")
}

// EN: The demo. Every number it prints is a count (bytes, slots, probes), never a time, so
//     the output is the same on any machine and in both languages, and a test compares it
//     with the committed table.
// PT: A demonstração. Todo número que ela imprime é uma contagem (bytes, slots, sondagens), e
//     nunca um tempo, então a saída é a mesma em qualquer máquina e nas duas linguagens, e um
//     teste a compara com a tabela versionada.
// ES: La demostración. Todo número que imprime es una cuenta (bytes, slots, sondeos), y nunca
//     un tiempo, así que la salida es la misma en cualquier máquina y en los dos lenguajes, y
//     una prueba la compara con la tabla versionada.
pub fn run_demo(directory: &Path, n: u32) -> io::Result<String> {
    if directory.exists() {
        std::fs::remove_dir_all(directory)?;
    }
    let mut out = String::new();
    let mut rng = SplitMix64 { state: SEED };
    let mut db = Database::open(directory)?;

    fn row(out: &mut String, db: &mut Database, step: &str) -> io::Result<()> {
        let free = db.file().free_list()?.len();
        let size = db.file().file_size()?;
        writeln!(
            out,
            "| {step} | {} | {} | {free} | {size} |",
            db.file().slot_count(),
            db.file().live_count()
        )
        .map_err(text_error)
    }

    out.push_str("# File organisation demo\n\n");
    writeln!(
        out,
        "Records: {n} of {RECORD_SIZE} bytes, after a header of {HEADER_SIZE} bytes. Seed {SEED}.\n"
    )
    .map_err(text_error)?;
    out.push_str("## 1. Free list inside the file\n\n");
    out.push_str("| Step | Slots in the file | Live records | Free slots | File size (bytes) |\n");
    out.push_str("| --- | ---: | ---: | ---: | ---: |\n");

    let mut ids: Vec<u32> = (0..n).map(|i| 100_000 + i).collect();
    shuffle(&mut ids, &mut rng);
    for &id in &ids {
        db.insert(&make_record(id, &mut rng))?;
    }
    row(&mut out, &mut db, &format!("insert {n} records"))?;

    let removed = n * 3 / 10;
    shuffle(&mut ids, &mut rng);
    let mut removed_rrns = Vec::new();
    for &id in &ids[..removed as usize] {
        removed_rrns.extend(db.primary().find(id));
        db.remove(id)?;
    }
    row(&mut out, &mut db, &format!("delete {removed} records"))?;

    let mut reused_rrns = Vec::new();
    for i in 0..removed {
        db.insert(&make_record(200_000 + i, &mut rng))?;
        reused_rrns.extend(db.primary().find(200_000 + i));
    }
    row(&mut out, &mut db, &format!("insert {removed} records"))?;

    let extra = n / 20;
    for i in 0..extra {
        db.insert(&make_record(300_000 + i, &mut rng))?;
    }
    row(&mut out, &mut db, &format!("insert {extra} records"))?;

    let last = removed_rrns.len();
    writeln!(
        out,
        "\nLast three slots deleted (RRN): {}, {}, {}. First three slots reused (RRN): {}, {}, {}.\n",
        removed_rrns[last - 3],
        removed_rrns[last - 2],
        removed_rrns[last - 1],
        reused_rrns[0],
        reused_rrns[1],
        reused_rrns[2]
    )
    .map_err(text_error)?;

    out.push_str("## 2. Index search against a full scan\n\n");
    out.push_str(
        "| Query | Records found | Slots read by the scan | Slots read through the index | Same records |\n",
    );
    out.push_str("| --- | ---: | ---: | ---: | --- |\n");
    let mut queries: Vec<(String, &str, Option<u16>)> = CITIES
        .iter()
        .map(|city| (format!("city = {city}"), *city, None))
        .collect();
    queries.push((
        "city = RECIFE and year = 2010".to_string(),
        "RECIFE",
        Some(2010),
    ));
    for (label, city, year) in queries {
        let before = db.file().slot_reads();
        let by_index = match year {
            Some(year) => db.find_by_city_and_year(city, year)?,
            None => db.find_by_city(city)?,
        };
        let index_reads = db.file().slot_reads() - before;
        let before = db.file().slot_reads();
        let by_scan =
            db.scan(|record| record.city == city && year.is_none_or(|year| record.year == year))?;
        let scan_reads = db.file().slot_reads() - before;
        let same = if ids_of(&by_index) == ids_of(&by_scan) {
            "yes"
        } else {
            "NO"
        };
        writeln!(
            out,
            "| {label} | {} | {scan_reads} | {index_reads} | {same} |",
            by_index.len()
        )
        .map_err(text_error)?;
    }

    let mut probes = 0u64;
    let mut most = 0;
    for _ in 0..1000 {
        db.primary()
            .find(200_000 + rng.below(u64::from(removed)) as u32);
        probes += u64::from(db.primary().last_probes());
        most = most.max(db.primary().last_probes());
    }
    writeln!(
        out,
        "\nPrimary index: {} entries, 1000 searches by id, {:.2} probes on average and at most {most}, then 1 slot read each.\n",
        db.primary().len(),
        probes as f64 / 1000.0
    )
    .map_err(text_error)?;

    out.push_str("## 3. Index files and the out-of-date flag\n\n");
    out.push_str("| Session | How it ended | What the next open did |\n");
    out.push_str("| --- | --- | --- |\n");
    db.close()?;
    drop(db);
    let mut db = Database::open(directory)?;
    let loaded = if db.rebuilt_on_open() {
        "rebuilt"
    } else {
        "loaded the index files"
    };
    writeln!(out, "| 1 | close() | {loaded} |").map_err(text_error)?;
    db.insert(&make_record(999_999, &mut rng))?;
    // EN: The object is dropped without close(): the index files on disk are now out of date.
    // PT: O objeto é descartado sem close(): os arquivos de índice em disco ficaram desatualizados.
    // ES: El objeto se descarta sin close(): los archivos de índice en disco quedaron
    //     desactualizados.
    drop(db);
    let mut db = Database::open(directory)?;
    let rebuilt = if db.rebuilt_on_open() {
        "rebuilt the indexes from the data file"
    } else {
        "loaded the index files"
    };
    writeln!(out, "| 2 | 1 insert, then no close() | {rebuilt} |").map_err(text_error)?;
    let found = if db.find(999_999)?.is_some() {
        "yes"
    } else {
        "NO"
    };
    writeln!(
        out,
        "\nRecord inserted in session 2 found after the rebuild: {found}.\n"
    )
    .map_err(text_error)?;
    db.close()?;
    let data_path = db.path("records.dat");
    drop(db);

    out.push_str("## 4. Compression of the data file\n\n");
    out.push_str("| Method | Bytes | Ratio (compressed / original) | Round trip |\n");
    out.push_str("| --- | ---: | ---: | --- |\n");
    let original = std::fs::read(data_path)?;
    let rle = rle_encode(&original);
    let huffman = huffman_encode(&original)?;
    let both = huffman_encode(&rle)?;
    let lines = [
        ("none", original.len(), true),
        ("run-length", rle.len(), rle_decode(&rle)? == original),
        (
            "Huffman",
            huffman.len(),
            huffman_decode(&huffman)? == original,
        ),
        (
            "run-length, then Huffman",
            both.len(),
            rle_decode(&huffman_decode(&both)?)? == original,
        ),
    ];
    for (method, bytes, lossless) in lines {
        writeln!(
            out,
            "| {method} | {bytes} | {:.3} | {} |",
            bytes as f64 / original.len() as f64,
            if lossless { "lossless" } else { "DIFFERENT" }
        )
        .map_err(text_error)?;
    }
    Ok(out)
}
