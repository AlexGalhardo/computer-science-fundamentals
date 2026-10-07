use std::collections::BTreeMap;
use std::path::PathBuf;

use b_tree_on_disk::{BTree, Key, MAX_DEGREE, Value, compare};

fn temp_file(name: &str) -> PathBuf {
    std::env::temp_dir().join(name)
}

#[test]
fn basics_and_reopen() -> std::io::Result<()> {
    let path = temp_file("basics-rust.btree");
    {
        let mut tree = BTree::create(&path, 2)?;
        assert_eq!((tree.height(), tree.len()), (1, 0));
        for key in 1..=20u64 {
            tree.insert(key * 7 % 23, key)?;
        }
        assert_eq!(tree.len(), 20);
        assert!(tree.height() >= 3, "20 keys with t = 2 split the root");
        assert_eq!(tree.check(), Ok(()));
        assert_eq!(tree.search(7)?, Some(1));
        assert_eq!(tree.search(0)?, None);
        assert!(!tree.insert(7, 99)?);
        assert_eq!(tree.search(7)?, Some(99));
        assert!(tree.remove(7)?);
        assert!(!tree.remove(7)?);
        assert_eq!(tree.check(), Ok(()));
    }
    // EN: The first tree value was dropped and its file is closed. Everything a new value
    //     knows comes from the pages on disk.
    // PT: O primeiro valor da árvore foi descartado e o arquivo foi fechado. Tudo o que um
    //     valor novo sabe vem das páginas em disco.
    let mut reopened = BTree::open(&path)?;
    assert_eq!(reopened.len(), 19);
    assert_eq!(reopened.search(14)?, Some(2));
    assert_eq!(reopened.check(), Ok(()));
    drop(reopened);
    std::fs::remove_file(path)
}

// EN: 100,000 random operations run on the B-tree and on the standard BTreeMap at the same
//     time. Every answer has to match, and the invariants are checked along the way and at the
//     end. Small degrees with a small key range make splits, borrows and merges happen
//     constantly.
// PT: 100.000 operações aleatórias rodam na árvore B e no BTreeMap padrão ao mesmo tempo. Toda
//     resposta precisa bater, e as invariantes são conferidas pelo caminho e no fim. Graus
//     pequenos com uma faixa pequena de chaves fazem divisões, empréstimos e fusões acontecerem
//     o tempo todo.
fn random_operations(degree: usize, key_range: u64) -> std::io::Result<()> {
    let path = temp_file(&format!("random-rust-{degree}.btree"));
    let mut tree = BTree::create(&path, degree)?;
    let mut reference: BTreeMap<Key, Value> = BTreeMap::new();
    let mut state = 0x9e37_79b9_7f4a_7c15u64 + degree as u64;
    let mut next = move || {
        state ^= state << 13;
        state ^= state >> 7;
        state ^= state << 17;
        state
    };
    let mut tallest = 0;
    for step in 1..=100_000 {
        let key = next() % key_range;
        let value = next();
        match next() % 10 {
            0..5 => assert_eq!(
                tree.insert(key, value)?,
                reference.insert(key, value).is_none()
            ),
            5..8 => assert_eq!(tree.remove(key)?, reference.remove(&key).is_some()),
            _ => assert_eq!(tree.search(key)?, reference.get(&key).copied()),
        }
        assert_eq!(
            tree.len(),
            reference.len() as u64,
            "t = {degree}, step {step}"
        );
        tallest = tallest.max(tree.height());
        if step % 5000 == 0 {
            assert_eq!(tree.check(), Ok(()), "t = {degree}, step {step}");
        }
    }
    assert!(tallest >= 3, "the tree reached at least 3 levels");
    for (&key, &value) in &reference {
        assert_eq!(tree.search(key)?, Some(value));
    }

    // EN: Removing everything has to bring the tree back to one empty leaf, and the pages
    //     released on the way must be reused: emptying the tree and inserting the same keys in
    //     the same order a second time cannot make the file grow.
    // PT: Remover tudo precisa trazer a árvore de volta a uma folha vazia, e as páginas
    //     liberadas no caminho precisam ser reaproveitadas: esvaziar a árvore e inserir as
    //     mesmas chaves na mesma ordem pela segunda vez não pode fazer o arquivo crescer.
    for &key in reference.keys() {
        assert!(tree.remove(key)?);
    }
    assert_eq!((tree.len(), tree.height(), tree.check()), (0, 1, Ok(())));
    for (&key, &value) in &reference {
        tree.insert(key, value)?;
    }
    let pages = tree.page_count();
    for &key in reference.keys() {
        tree.remove(key)?;
    }
    for (&key, &value) in &reference {
        tree.insert(key, value)?;
    }
    assert_eq!(tree.page_count(), pages, "freed pages are reused");
    assert_eq!(tree.check(), Ok(()));
    drop(tree);
    std::fs::remove_file(path)
}

#[test]
fn random_operations_with_degree_2() -> std::io::Result<()> {
    random_operations(2, 4096)
}

#[test]
fn random_operations_with_degree_3() -> std::io::Result<()> {
    random_operations(3, 4096)
}

#[test]
fn random_operations_with_the_largest_degree() -> std::io::Result<()> {
    random_operations(MAX_DEGREE, 60_000)
}

// EN: The point of the whole mini-project in one test: with a million keys, no search reads
//     more pages than the height of the tree, and that height is 3.
// PT: O sentido do mini-projeto inteiro em um teste: com um milhão de chaves, nenhuma busca lê
//     mais páginas que a altura da árvore, e essa altura é 3.
#[test]
fn a_search_in_a_million_keys_reads_at_most_the_height_in_pages() -> std::io::Result<()> {
    let result = compare(1_000_000, &std::env::temp_dir(), 10_000)?;
    println!("{result:?}");
    assert!(result.all_found);
    assert_eq!(result.btree_height, 3);
    assert!(result.btree_max <= result.btree_height);
    assert!(result.btree_max_missing <= result.btree_height);
    assert!(result.bst_average > 3.0 * result.btree_height as f64);
    Ok(())
}
