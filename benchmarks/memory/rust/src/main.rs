// EN: Memory workload in Rust: `binary-trees` (allocate and free many small nodes) and `idle`
//     (start and exit). Rust model: ownership, checked by the compiler. A `Box` is a heap
//     allocation with exactly one owner, and it is freed when the owner goes out of scope. No
//     collector runs, and forgetting to free or freeing twice does not compile.
// PT: Carga de memória em Rust: `binary-trees` (aloca e libera muitos nós pequenos) e `idle`
//     (sobe e sai). Modelo do Rust: posse, verificada pelo compilador. Um `Box` é uma alocação
//     no heap com exatamente um dono, e é liberado quando o dono sai de escopo. Nenhum coletor
//     roda, e esquecer de liberar ou liberar duas vezes não compila.

use std::time::Instant;

struct Node {
    children: Option<(Box<Node>, Box<Node>)>,
}

fn make(depth: u32) -> Box<Node> {
    Box::new(Node {
        children: if depth > 0 {
            Some((make(depth - 1), make(depth - 1)))
        } else {
            None
        },
    })
}

// EN: Walks the whole tree and counts its nodes.
// PT: Percorre a árvore inteira e conta os nós.
fn check(node: &Node) -> u64 {
    match &node.children {
        Some((left, right)) => 1 + check(left) + check(right),
        None => 1,
    }
}

fn binary_trees(n: u32) -> u64 {
    let min_depth = 4;
    let max_depth = n.max(min_depth + 2);
    let mut total = check(&make(max_depth + 1));
    let long_lived = make(max_depth);
    let mut depth = min_depth;
    while depth <= max_depth {
        let iterations = 1u64 << (max_depth - depth + min_depth);
        for _ in 0..iterations {
            // EN: The temporary tree is dropped, and so freed, at the end of this statement.
            // PT: A árvore temporária é descartada, e portanto liberada, no fim desta instrução.
            total += check(&make(depth));
        }
        depth += 2;
    }
    total + check(&long_lived)
}

fn peak_memory_kb() -> u64 {
    std::fs::read_to_string("/proc/self/status")
        .ok()
        .and_then(|status| {
            status
                .lines()
                .find(|line| line.starts_with("VmHWM:"))
                .and_then(|line| line.split_whitespace().nth(1)?.parse().ok())
        })
        .unwrap_or(0)
}

fn main() {
    let args: Vec<String> = std::env::args().collect();
    let implementation = args.get(1).map(String::as_str).unwrap_or("binary-trees");
    let n: u32 = args
        .get(2)
        .and_then(|value| value.parse().ok())
        .unwrap_or(10);

    let start = Instant::now();
    let checksum = if implementation == "idle" {
        "idle".to_string()
    } else {
        binary_trees(n).to_string()
    };
    let elapsed_ms = start.elapsed().as_secs_f64() * 1000.0;

    println!(
        "{{\"n\":{n},\"elapsedMs\":{elapsed_ms:.3},\"memoryKb\":{},\"language\":\"rust\",\"implementation\":\"{implementation}\",\"checksum\":\"{checksum}\"}}",
        peak_memory_kb()
    );
}
