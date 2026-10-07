use std::io;
use std::path::Path;

use crate::btree::{BTree, Key, MAX_DEGREE};
use crate::disk_bst::DiskBst;

// EN: Turns 0, 1, 2... into keys that look random. The function is a bijection (every step can
//     be undone), so different inputs always give different keys and no key is repeated.
// PT: Transforma 0, 1, 2... em chaves com cara de aleatórias. A função é uma bijeção (cada
//     passo pode ser desfeito), então entradas diferentes dão sempre chaves diferentes e nenhuma
//     chave se repete.
pub fn scramble(mut x: u64) -> Key {
    x ^= x >> 30;
    x = x.wrapping_mul(0xbf58_476d_1ce4_e5b9);
    x ^= x >> 27;
    x = x.wrapping_mul(0x94d0_49bb_1331_11eb);
    x ^= x >> 31;
    x
}

#[derive(Debug, Default)]
pub struct Comparison {
    pub n: u64,
    pub btree_height: u64,
    pub btree_average: f64,
    pub btree_max: u64,
    pub btree_max_missing: u64,
    pub btree_pages: u64,
    pub bst_height: u64,
    pub bst_average: f64,
    pub bst_max: u64,
    pub bst_pages: u64,
    pub all_found: bool,
}

// EN: Builds both structures with the same n keys in the same order, then runs the same
//     searches on both and records how many pages each search read.
// PT: Monta as duas estruturas com as mesmas n chaves na mesma ordem, depois roda as mesmas
//     buscas nas duas e registra quantas páginas cada busca leu.
pub fn compare(n: u64, directory: &Path, searches: u64) -> io::Result<Comparison> {
    let tree_path = directory.join("compare-rust.btree");
    let bst_path = directory.join("compare-rust.bst");
    let keys: Vec<Key> = (0..n).map(scramble).collect();
    let mut result = Comparison {
        n,
        all_found: true,
        ..Comparison::default()
    };
    {
        let mut tree = BTree::create(&tree_path, MAX_DEGREE)?;
        for &key in &keys {
            tree.insert(key, key.wrapping_mul(2))?;
        }
        let mut bst = DiskBst::build(&bst_path, &keys)?;
        result.btree_height = tree.height();
        result.btree_pages = tree.page_count();
        result.bst_height = bst.height();
        result.bst_pages = bst.page_count();
        let (mut tree_total, mut bst_total) = (0, 0);
        for s in 0..searches {
            let key = keys[(scramble(s + 7) % n) as usize];
            let expected = Some(key.wrapping_mul(2));

            let before = tree.page_reads();
            result.all_found &= tree.search(key)? == expected;
            let used = tree.page_reads() - before;
            tree_total += used;
            result.btree_max = result.btree_max.max(used);

            let before = bst.page_reads();
            result.all_found &= bst.search(key)? == expected;
            let used = bst.page_reads() - before;
            bst_total += used;
            result.bst_max = result.bst_max.max(used);

            // EN: scramble(n + s) was never inserted, so this search has to fail.
            // PT: scramble(n + s) nunca foi inserida, então esta busca tem de falhar.
            let before = tree.page_reads();
            result.all_found &= tree.search(scramble(n + s))?.is_none();
            result.btree_max_missing = result.btree_max_missing.max(tree.page_reads() - before);
        }
        result.btree_average = tree_total as f64 / searches as f64;
        result.bst_average = bst_total as f64 / searches as f64;
    }
    std::fs::remove_file(tree_path)?;
    std::fs::remove_file(bst_path)?;
    Ok(result)
}
