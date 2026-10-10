use std::collections::BTreeMap;
use std::io;
use std::path::PathBuf;

use file_organisation::compression::{
    HUFFMAN_HEADER, build_tree, code_table, count_bytes, huffman_decode, huffman_encode,
    rle_decode, rle_encode,
};
use file_organisation::database::Database;
use file_organisation::indexes::{PrimaryIndex, SecondaryIndex, match_lists};
use file_organisation::record_file::{LIVE_TAG, NO_SLOT, Record, RecordFile, decode, encode};
use file_organisation::workload::{CITIES, SEED, SplitMix64, make_record, run_demo};

fn temp(name: &str) -> PathBuf {
    let directory = std::env::temp_dir().join("forg-test-rust");
    std::fs::create_dir_all(&directory).expect("temp directory");
    directory.join(name)
}

fn sorted(mut records: Vec<Record>) -> Vec<Record> {
    records.sort_by_key(|record| record.id);
    records
}

#[test]
fn record_layout() -> io::Result<()> {
    assert_eq!(RecordFile::offset_of(0), 32);
    assert_eq!(
        RecordFile::offset_of(25),
        32 + 25 * 64,
        "byte offset = header + RRN x record size"
    );
    let record = Record {
        id: 42,
        year: 2024,
        city: "RECIFE".into(),
        name: "Ana".into(),
    };
    let slot = encode(&record)?;
    assert_eq!(
        (slot[0], slot[1], slot[7], slot[13], slot[63]),
        (LIVE_TAG, 42, b'R', b' ', b' ')
    );
    assert_eq!(decode(&slot), record);
    let long = Record {
        id: 1,
        year: 2000,
        city: "x".repeat(21),
        name: String::new(),
    };
    assert!(
        encode(&long).is_err(),
        "a field longer than its fixed size is refused"
    );
    Ok(())
}

// EN: Acceptance of MP-FS-1.1: the file has the same size after deletions and after the
//     insertions that reuse the deleted slots, and it grows by exactly one record only when
//     the free list is empty.
// PT: Aceite de MP-FS-1.1: o arquivo tem o mesmo tamanho depois das remoções e depois das
//     inserções que reaproveitam os slots removidos, e cresce exatamente um registro só quando
//     a lista de livres está vazia.
// ES: Aceptación de MP-FS-1.1: el archivo tiene el mismo tamaño después de las eliminaciones y
//     después de las inserciones que reutilizan los slots eliminados, y crece exactamente un
//     registro solo cuando la lista de libres está vacía.
#[test]
fn free_list_reuses_deleted_slots() -> io::Result<()> {
    let path = temp("free-list.dat");
    let mut rng = SplitMix64 { state: SEED };
    {
        let mut file = RecordFile::create(&path)?;
        assert_eq!(file.file_size()?, 32, "an empty file is only the header");
        for id in 0..1000 {
            assert_eq!(
                file.insert(&make_record(id, &mut rng))?,
                id,
                "new records are appended"
            );
        }
        let full = file.file_size()?;
        assert_eq!(full, 32 + 1000 * 64);

        assert!(file.remove(3)? && file.remove(7)? && file.remove(2)?);
        assert_eq!(
            file.free_list()?,
            vec![2, 7, 3],
            "the last slot removed is listed first"
        );
        assert!(!file.remove(7)? && file.read(7)?.is_none() && !file.remove(5000)?);
        assert_eq!(
            file.insert(&make_record(2000, &mut rng))?,
            2,
            "the top of the stack is reused"
        );
        assert!(file.remove(5)?);
        assert_eq!(file.insert(&make_record(2001, &mut rng))?, 5);
        assert_eq!(
            file.insert(&make_record(2002, &mut rng))?,
            7,
            "slots are reused in LIFO order"
        );
        assert_eq!(
            (file.free_head(), file.file_size()?),
            (3, full),
            "the file did not grow"
        );
        assert_eq!(file.insert(&make_record(2003, &mut rng))?, 3);
        assert_eq!(file.free_head(), NO_SLOT, "the list is empty again");

        for rrn in (0..1000).step_by(3) {
            file.remove(rrn)?;
        }
        assert_eq!(
            (
                file.file_size()?,
                file.live_count(),
                file.free_list()?.len()
            ),
            (full, 666, 334)
        );
        for i in 0..334 {
            assert!(
                file.insert(&make_record(3000 + i, &mut rng))? < 1000,
                "reuse stays inside"
            );
        }
        assert_eq!(
            (file.file_size()?, file.live_count(), file.slot_count()),
            (full, 1000, 1000),
            "334 insertions reuse the slots and the file size is unchanged"
        );
        assert_eq!(file.insert(&make_record(4000, &mut rng))?, 1000);
        assert_eq!(
            file.file_size()?,
            full + 64,
            "with an empty list the file grows by one record"
        );
        file.remove(10)?;
    }
    let mut reopened = RecordFile::open(&path)?;
    assert_eq!(
        (
            reopened.slot_count(),
            reopened.live_count(),
            reopened.free_head()
        ),
        (1001, 1000, 10)
    );
    assert_eq!(reopened.read(1000)?.map(|record| record.id), Some(4000));
    Ok(())
}

#[test]
fn primary_and_secondary_indexes() {
    let mut primary = PrimaryIndex::default();
    for id in 0..1000u32 {
        assert!(primary.insert(id * 7919 % 1000, id));
    }
    assert!(!primary.insert(5, 0), "a duplicate key is refused");
    assert!(
        primary
            .entries()
            .windows(2)
            .all(|pair| pair[0].id < pair[1].id),
        "sorted by key"
    );
    for id in 0..1000u32 {
        assert_eq!(primary.find(id * 7919 % 1000), Some(id));
    }
    assert_eq!(primary.find(1000), None);
    // 2^9 = 512 < 1000 <= 2^10, so binary search needs at most 10 probes.
    assert_eq!(primary.max_probes(), 10);
    let mut copy = PrimaryIndex::default();
    assert!(copy.load_bytes(&primary.to_bytes(false)));
    assert_eq!((copy.len(), copy.find(7919 % 1000)), (1000, Some(1)));
    assert!(
        !copy.load_bytes(&primary.to_bytes(true)),
        "an out-of-date image is refused"
    );
    assert!(primary.erase(5) && !primary.erase(5) && primary.find(5).is_none());

    let mut cities = SecondaryIndex::default();
    for (city, id) in [
        ("RECIFE", 30),
        ("NATAL", 20),
        ("RECIFE", 10),
        ("RECIFE", 20),
        ("RECIFE", 10),
    ] {
        cities.add(city, id);
    }
    assert_eq!(
        cities.ids("RECIFE"),
        vec![10, 20, 30],
        "increasing primary key, no repeats"
    );
    assert_eq!(cities.ids("NATAL"), vec![20]);
    assert!(cities.ids("MANAUS").is_empty());
    assert_eq!((cities.key_count(), cities.node_count()), (2, 4));
    let mut loaded = SecondaryIndex::default();
    assert!(loaded.load_bytes(&cities.keys_to_bytes(), &cities.nodes_to_bytes()));
    assert_eq!(loaded.ids("RECIFE"), cities.ids("RECIFE"));
    assert_eq!(
        match_lists(&[104, 117, 123, 150, 162], &[101, 117, 150, 151, 162, 170]),
        vec![117, 150, 162]
    );
}

// EN: Acceptance of MP-FS-1.2: for every city, every year and every pair, the search through
//     the indexes returns exactly the records that a full scan of the file returns.
// PT: Aceite de MP-FS-1.2: para cada cidade, cada ano e cada par, a busca pelos índices devolve
//     exatamente os registros que uma varredura completa do arquivo devolve.
// ES: Aceptación de MP-FS-1.2: para cada ciudad, cada año y cada par, la búsqueda por los
//     índices devuelve exactamente los registros que devuelve un barrido completo del archivo.
fn compare_with_scan(db: &mut Database, when: &str) -> io::Result<()> {
    for city in CITIES {
        let by_scan = db.scan(|record| record.city == city)?;
        assert_eq!(
            sorted(db.find_by_city(city)?),
            sorted(by_scan),
            "{when}: city {city}"
        );
    }
    for year in 1999..=2025u16 {
        let by_scan = db.scan(|record| record.year == year)?;
        assert_eq!(
            sorted(db.find_by_year(year)?),
            sorted(by_scan),
            "{when}: year {year}"
        );
        let by_scan = db.scan(|record| record.city == "RECIFE" && record.year == year)?;
        assert_eq!(
            sorted(db.find_by_city_and_year("RECIFE", year)?),
            sorted(by_scan),
            "{when}: RECIFE and {year}"
        );
    }
    Ok(())
}

#[test]
fn index_search_equals_full_scan() -> io::Result<()> {
    let path = temp("db");
    if path.exists() {
        std::fs::remove_dir_all(&path)?;
    }
    let mut rng = SplitMix64 { state: SEED + 1 };
    let mut model = BTreeMap::new();
    {
        let mut db = Database::open(&path)?;
        assert!(
            db.rebuilt_on_open(),
            "a new database has no index files to load"
        );
        // EN: Random insertions and removals over a small range of ids, so ids are removed and
        //     inserted again with another city and year. The BTreeMap is the model.
        // PT: Inserções e remoções aleatórias em uma faixa pequena de ids, de modo que ids são
        //     removidos e inseridos de novo com outra cidade e outro ano. O BTreeMap é o modelo.
        // ES: Inserciones y eliminaciones aleatorias en un rango pequeño de ids, de modo que los
        //     ids se eliminan y se insertan de nuevo con otra ciudad y otro año. El BTreeMap es
        //     el modelo.
        for _ in 0..6000 {
            let id = rng.below(3000) as u32;
            if rng.below(3) == 0 {
                assert_eq!(db.remove(id)?, model.remove(&id).is_some());
            } else {
                let record = make_record(id, &mut rng);
                let inserted = !model.contains_key(&id);
                assert_eq!(db.insert(&record)?, inserted);
                model.entry(id).or_insert(record);
            }
        }
        assert_eq!(db.file().live_count() as usize, model.len());
        assert_eq!(db.primary().len(), model.len());
        for (id, record) in &model {
            assert_eq!(db.find(*id)?.as_ref(), Some(record));
        }
        assert!(db.find(3000)?.is_none());
        let spelled = db.find_by_city("  recife ")?.len();
        assert!(
            spelled > 0 && spelled == db.find_by_city("RECIFE")?.len(),
            "canonical form"
        );
        compare_with_scan(&mut db, "first session")?;
        db.close()?;
    }
    {
        let mut db = Database::open(&path)?;
        assert!(
            !db.rebuilt_on_open(),
            "after close() the index files are loaded"
        );
        compare_with_scan(&mut db, "loaded indexes")?;
        let late = Record {
            id: 5000,
            year: 2024,
            city: "Natal".into(),
            name: "after the last save".into(),
        };
        assert!(db.insert(&late)?);
    }
    let mut db = Database::open(&path)?;
    assert!(
        db.rebuilt_on_open(),
        "without close() the flag forces a rebuild"
    );
    assert_eq!(
        db.find(5000)?.map(|record| record.city),
        Some("NATAL".to_string())
    );
    compare_with_scan(&mut db, "rebuilt indexes")
}

// EN: Acceptance of MP-FS-1.3: decoding gives back exactly the original bytes, for edge cases
//     and for the data file, and the compressed sizes are the ones worked out by hand.
// PT: Aceite de MP-FS-1.3: decodificar devolve exatamente os bytes originais, nos casos
//     extremos e no arquivo de dados, e os tamanhos comprimidos são os calculados à mão.
// ES: Aceptación de MP-FS-1.3: decodificar devuelve exactamente los bytes originales, en los
//     casos extremos y en el archivo de datos, y los tamaños comprimidos son los calculados a
//     mano.
#[test]
fn compression_round_trips() -> io::Result<()> {
    let runs: Vec<u8> = vec![
        0x22, 0x22, 0x22, 0x22, 0x22, 0x22, 0x23, 0x24, 0x24, 0x24, 0x24, 0x24, 0x24, 0x24, 0x24,
        0x25, 0x26, 0x26,
    ];
    assert_eq!(
        rle_encode(&runs),
        vec![0xFF, 0x22, 6, 0x23, 0xFF, 0x24, 8, 0x25, 0x26, 0x26]
    );
    assert_eq!(
        rle_encode(&[1, 0xFF, 2]),
        vec![1, 0xFF, 0xFF, 1, 2],
        "a marker byte becomes a run"
    );
    assert_eq!(
        rle_encode(b"abcabc").len(),
        6,
        "data with no runs does not shrink"
    );

    // A = 45, B = 25, C = 15, D = 10, E = 5: code lengths 1, 2, 3, 4, 4 and 200 bits in total.
    let mut symbols = Vec::new();
    for (letter, count) in [(b'A', 45), (b'B', 25), (b'C', 15), (b'D', 10), (b'E', 5)] {
        symbols.extend(std::iter::repeat_n(letter, count));
    }
    assert_eq!(huffman_encode(&symbols)?.len(), HUFFMAN_HEADER + 25);
    let codes = code_table(&build_tree(&count_bytes(&symbols)));
    let lengths: Vec<usize> = b"ABCDE"
        .iter()
        .map(|&letter| codes[usize::from(letter)].len())
        .collect();
    assert_eq!(
        lengths,
        vec![1, 2, 3, 4, 4],
        "frequent symbols get the short codes"
    );

    let mut rng = SplitMix64 { state: SEED + 2 };
    let random: Vec<u8> = (0..50_000).map(|_| rng.below(256) as u8).collect();
    let skewed: Vec<u8> = (0..50_000)
        .map(|_| {
            if rng.below(10) < 8 {
                0xFF
            } else {
                rng.below(4) as u8
            }
        })
        .collect();
    let path = temp("compress.dat");
    {
        let mut file = RecordFile::create(&path)?;
        for id in 0..2000 {
            file.insert(&make_record(id, &mut rng))?;
        }
    }
    let data_file = std::fs::read(&path)?;
    let cases: [(&str, Vec<u8>); 9] = [
        ("empty", vec![]),
        ("one byte", vec![7]),
        ("one distinct byte", vec![b'x'; 1000]),
        ("only markers", vec![0xFF; 700]),
        ("runs", runs),
        ("symbols", symbols),
        ("random", random.clone()),
        ("skewed with markers", skewed),
        ("data file", data_file.clone()),
    ];
    for (name, bytes) in &cases {
        assert_eq!(
            &rle_decode(&rle_encode(bytes))?,
            bytes,
            "run-length: {name}"
        );
        assert_eq!(
            &huffman_decode(&huffman_encode(bytes)?)?,
            bytes,
            "Huffman: {name}"
        );
        let both = huffman_encode(&rle_encode(bytes))?;
        assert_eq!(
            &rle_decode(&huffman_decode(&both)?)?,
            bytes,
            "run-length then Huffman: {name}"
        );
    }
    assert_eq!(data_file.len(), 32 + 2000 * 64);
    assert!(rle_encode(&data_file).len() < data_file.len());
    assert!(huffman_encode(&data_file)?.len() < data_file.len());
    assert!(
        huffman_encode(&random)?.len() > random.len(),
        "random bytes do not shrink"
    );
    Ok(())
}

// EN: The demo output is deterministic, so it is compared with the committed table, which is
//     also what the C++ demo prints.
// PT: A saída da demonstração é determinística, então é comparada com a tabela versionada, que
//     também é o que a demo em C++ imprime.
// ES: La salida de la demostración es determinista, así que se compara con la tabla
//     versionada, que también es lo que imprime la demo en C++.
#[test]
fn demo_equals_committed_table() -> io::Result<()> {
    let expected =
        std::fs::read_to_string(concat!(env!("CARGO_MANIFEST_DIR"), "/../results/demo.md"))?;
    assert_eq!(run_demo(&temp("demo"), 10_000)?, expected);
    Ok(())
}
