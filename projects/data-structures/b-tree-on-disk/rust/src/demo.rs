use std::path::PathBuf;

use b_tree_on_disk::compare;

// EN: Demo: builds a B-tree and a binary search tree on disk with the same keys, for growing
//     sizes, and prints a Markdown table with the pages read per search in each one.
//       demo [largest n] [directory for the temporary files]
// PT: Demo: monta uma árvore B e uma árvore binária de busca em disco com as mesmas chaves,
//     para tamanhos crescentes, e imprime uma tabela Markdown com as páginas lidas por busca
//     em cada uma.
//       demo [maior n] [diretório dos arquivos temporários]
fn main() -> std::io::Result<()> {
    let args: Vec<String> = std::env::args().collect();
    let largest: u64 = args
        .get(1)
        .and_then(|value| value.parse().ok())
        .unwrap_or(1_000_000);
    let directory = args.get(2).map_or_else(std::env::temp_dir, PathBuf::from);
    println!(
        "| Keys | B-tree levels | B-tree pages per search (avg / max) | BST height (nodes) | BST pages per search (avg / max) | B-tree file pages | BST file pages |"
    );
    println!("| ---: | ---: | ---: | ---: | ---: | ---: | ---: |");
    let mut n = 1000;
    while n <= largest {
        let row = compare(n, &directory, 10_000)?;
        println!(
            "| {} | {} | {:.2} / {} | {} | {:.2} / {} | {} | {} |",
            row.n,
            row.btree_height,
            row.btree_average,
            row.btree_max,
            row.bst_height,
            row.bst_average,
            row.bst_max,
            row.btree_pages,
            row.bst_pages
        );
        n *= 10;
    }
    Ok(())
}
