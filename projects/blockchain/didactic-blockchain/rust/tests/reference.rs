use didactic_blockchain::bench::measure;
use didactic_blockchain::chain::{
    Block, Header, add_block, genesis, header_hash, merkle_root, mine, transaction_ids, validate,
};
use didactic_blockchain::sha256::sha256_hex;

const DIFFICULTY: u32 = 2;

#[test]
fn sha256_matches_the_published_test_vectors() {
    assert_eq!(
        sha256_hex(""),
        "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    );
    assert_eq!(
        sha256_hex("abc"),
        "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
    );
    // 56 bytes: the padding no longer fits in the same block.
    assert_eq!(
        sha256_hex("abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq"),
        "248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1"
    );
    assert_eq!(
        sha256_hex(&"a".repeat(1_000_000)),
        "cdc76e5c9914fb9281a1c7e284d73e67f1809a48a497200e046d39ccc7112cd0"
    );
}

// EN: The values below were printed by the TypeScript reference. Equal results prove that both
//     languages build the same trees and the same header text.
// PT: Os valores abaixo foram impressos pela referência em TypeScript. Resultados iguais provam
//     que as duas linguagens montam as mesmas árvores e o mesmo texto de cabeçalho.
// ES: Los valores de abajo los imprimió la referencia en TypeScript. Resultados iguales prueban
//     que los dos lenguajes construyen los mismos árboles y el mismo texto de encabezado.
#[test]
fn merkle_root_matches_the_typescript_reference() {
    let leaves: Vec<String> = ["a", "b", "c", "d", "e"]
        .iter()
        .map(|s| sha256_hex(s))
        .collect();
    assert_eq!(
        merkle_root(&leaves),
        "3615e586768e706351e326736e446554c49123d0e24c169d3ecf9b791a82636b"
    );
    assert_eq!(merkle_root(&leaves[..1]), leaves[0]);
    // Known limit of the "duplicate the last node" convention.
    let mut repeated = leaves[..3].to_vec();
    repeated.push(leaves[2].clone());
    assert_eq!(merkle_root(&repeated), merkle_root(&leaves[..3]));
}

#[test]
fn genesis_and_mined_block_match_the_typescript_reference() {
    assert_eq!(
        genesis().hash,
        "43c6202ca046c17255be7eb1e84e6cb0373730dbbece74fe7b5bc374fe6c49ad"
    );
    let mined = mine(Header {
        height: 7,
        previous_hash: sha256_hex("previous block"),
        merkle_root: sha256_hex("transactions"),
        timestamp: 1_700_000_000,
        difficulty: 3,
        nonce: 0,
    });
    assert_eq!(mined.header.nonce, 8228);
    assert_eq!(mined.attempts, 8229);
    assert_eq!(
        mined.hash,
        "000eda6f4af83d3682f44693d823fdf2f93e216518bd9bcf8c43e5486b6fb595"
    );
    assert_eq!(header_hash(&mined.header), mined.hash);
}

#[test]
fn benchmark_attempts_match_the_typescript_reference() {
    assert_eq!(measure(1, 2000, 1).attempts, 31_258);
    assert_eq!(measure(2, 2000, 1).attempts, 522_738);
}

fn sample_chain() -> Vec<Block> {
    let mut chain = vec![genesis()];
    add_block(&mut chain, vec!["alice pays bob 20".into()], 1, DIFFICULTY);
    add_block(
        &mut chain,
        vec![
            "bob pays carol 5".into(),
            "alice pays carol 7".into(),
            "carol pays dave 1".into(),
        ],
        2,
        DIFFICULTY,
    );
    add_block(&mut chain, vec!["dave pays alice 1".into()], 3, DIFFICULTY);
    chain
}

#[test]
fn a_mined_chain_validates() {
    assert_eq!(validate(&sample_chain(), DIFFICULTY), Ok(()));
    // The same blocks do not satisfy a harder rule.
    assert!(validate(&sample_chain(), DIFFICULTY + 3).is_err());
}

// MP-CHAIN-1.1: changing any transaction invalidates the chain.
#[test]
fn changing_any_transaction_invalidates_the_chain() {
    let original = sample_chain();
    let mut cases = 0;
    for height in 1..original.len() {
        for index in 0..original[height].transactions.len() {
            let mut chain = original.clone();
            chain[height].transactions[index].push('0');
            let error = validate(&chain, DIFFICULTY).unwrap_err();
            assert_eq!(error.height, height as u64);
            assert_eq!(error.reason, "Merkle root does not match the transactions");
            cases += 1;
        }
    }
    assert_eq!(cases, 5);
}

#[test]
fn fixing_the_root_breaks_the_hash_and_remining_breaks_the_next_link() {
    let mut chain = sample_chain();
    chain[1].transactions[0] = "alice pays bob 2000".into();
    chain[1].header.merkle_root = merkle_root(&transaction_ids(&chain[1].transactions));
    assert_eq!(
        validate(&chain, DIFFICULTY).unwrap_err().reason,
        "block hash does not match its header"
    );

    let mined = mine(chain[1].header.clone());
    chain[1].header = mined.header;
    chain[1].hash = mined.hash;
    let error = validate(&chain, DIFFICULTY).unwrap_err();
    assert_eq!(error.height, 2);
    assert_eq!(
        error.reason,
        "previous hash does not match the hash of the previous block"
    );
}

#[test]
fn removing_or_reordering_transactions_is_detected() {
    let mut removed = sample_chain();
    removed[2].transactions.pop();
    assert!(validate(&removed, DIFFICULTY).is_err());

    let mut reordered = sample_chain();
    reordered[2].transactions.swap(0, 1);
    assert!(validate(&reordered, DIFFICULTY).is_err());

    assert!(validate(&sample_chain()[1..], DIFFICULTY).is_err());
}
