use huffman_lz77::samples::{self, Rng};
use huffman_lz77::{entropy, huffman, lz77, report};

// EN: The property that makes a compressor lossless: decode(encode(x)) == x for every x.
// PT: A propriedade que torna um compressor sem perdas: decode(encode(x)) == x para todo x.
fn assert_round_trip(data: &[u8]) {
    assert_eq!(
        huffman::decode(&huffman::encode(data)).unwrap(),
        data,
        "huffman"
    );
    assert_eq!(lz77::decode(&lz77::encode(data)).unwrap(), data, "lz77");
}

#[test]
fn text_binary_and_empty_files_round_trip() {
    assert_round_trip(&samples::text());
    assert_round_trip(&samples::random());
    assert_round_trip(&[]);
}

#[test]
fn every_sample_round_trips() {
    for (_, data) in samples::all() {
        assert_round_trip(&data);
    }
}

#[test]
fn random_inputs_of_many_shapes_round_trip() {
    // EN: Small alphabets produce long matches and deep trees; large ones produce none.
    // PT: Alfabetos pequenos produzem repetições longas e árvores fundas; os grandes, nenhuma.
    let mut rng = Rng::new(42);
    for _ in 0..300 {
        let length = rng.below(700) as usize;
        let alphabet = 1 + rng.below(256);
        let data: Vec<u8> = (0..length).map(|_| rng.below(alphabet) as u8).collect();
        assert_round_trip(&data);
    }
}

#[test]
fn window_and_length_limits_round_trip() {
    // EN: A pattern that repeats farther back than the window, and a run longer than a token.
    // PT: Um padrão que se repete mais longe que a janela, e uma sequência maior que um token.
    let mut data = samples::random()[..5000].to_vec();
    data.extend_from_slice(&samples::random()[..5000]);
    data.extend(std::iter::repeat_n(9u8, 3000));
    assert_round_trip(&data);
    for token in lz77::tokenize(&data) {
        assert!((token.offset as usize) <= lz77::WINDOW);
    }
}

#[test]
fn entropy_acceptance_values() {
    assert_eq!(entropy::bits_per_byte(&samples::single_symbol()), 0.0);
    assert!((entropy::bits_per_byte(&samples::byte_cycle()) - 8.0).abs() < 1e-12);
}

#[test]
fn huffman_stays_within_one_bit_of_the_entropy() {
    // EN: Source coding theorem: H <= average code length < H + 1 (body only, no header).
    // PT: Teorema da codificação de fonte: H <= comprimento médio < H + 1 (só o corpo).
    for (name, data) in samples::all() {
        let body_bits = (huffman::encode(&data).len() - huffman::HEADER_LEN) as f64 * 8.0;
        let average = body_bits / data.len() as f64;
        let h = entropy::bits_per_byte(&data);
        if name == "single-symbol" {
            // One symbol still costs 1 bit: the floor of a symbol code.
            assert_eq!(average, 1.0);
        } else {
            assert!(
                average >= h - 1e-9 && average < h + 1.0 + 1e-3,
                "{name}: {average} vs {h}"
            );
        }
    }
}

#[test]
fn committed_fixture_matches() {
    // EN: The same file is checked by the Python tests, so both languages agree byte for byte.
    // PT: O mesmo arquivo é conferido pelos testes em Python, então as duas linguagens concordam
    //     byte a byte.
    let expected = include_str!("../../fixtures/expected.tsv");
    assert_eq!(report::fixture(&report::rows()), expected);
}

#[test]
fn committed_table_matches() {
    let expected = include_str!("../../results/comparison-table.md");
    assert_eq!(report::markdown(&report::rows()), expected);
}
