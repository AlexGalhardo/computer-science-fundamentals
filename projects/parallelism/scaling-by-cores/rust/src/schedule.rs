//! How the work is handed to the workers.

use std::ops::Range;

// EN: Two ways of sharing a loop among workers. `Static` cuts the items into one contiguous
//     block per worker before anything runs: zero coordination, but a worker whose block is
//     cheap finishes early and sits idle. `Dynamic` lets every worker fetch the next small
//     chunk when it is free: a little coordination per chunk, and the load balances itself.
// PT: Duas formas de repartir um laço entre trabalhadores. `Static` corta os itens em um bloco
//     contíguo por trabalhador antes de qualquer execução: coordenação zero, mas o trabalhador
//     com um bloco barato termina cedo e fica ocioso. `Dynamic` deixa cada trabalhador buscar
//     o próximo pedaço pequeno quando fica livre: um pouco de coordenação por pedaço, e a
//     carga se equilibra sozinha.
// ES: Dos formas de repartir un bucle entre trabajadores. `Static` corta los ítems en un bloque
//     contiguo por trabajador antes de cualquier ejecución: coordinación cero, pero el
//     trabajador con un bloque barato termina antes y queda ocioso. `Dynamic` deja que cada
//     trabajador tome la siguiente porción pequeña cuando queda libre: algo de coordinación por
//     porción, y la carga se equilibra sola.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Schedule {
    Static,
    Dynamic,
}

// EN: Splits `total` items into `workers` contiguous ranges whose sizes differ by at most one.
//     The first `total % workers` ranges take the leftover items, so nothing is lost when the
//     division is not exact. Every item belongs to exactly one range: that is what lets the
//     workers run without locks.
// PT: Divide `total` itens em `workers` intervalos contíguos cujos tamanhos diferem em no
//     máximo um. Os primeiros `total % workers` intervalos ficam com os itens que sobram, então
//     nada se perde quando a divisão não é exata. Cada item pertence a exatamente um
//     intervalo: é isso que deixa os trabalhadores rodarem sem travas.
// ES: Divide `total` ítems en `workers` intervalos contiguos cuyos tamaños difieren en como
//     máximo uno. Los primeros `total % workers` intervalos se quedan con los ítems que sobran,
//     así que nada se pierde cuando la división no es exacta. Cada ítem pertenece a exactamente
//     un intervalo: eso es lo que deja a los trabajadores correr sin bloqueos.
pub fn split_static(total: u64, workers: usize) -> Vec<Range<u64>> {
    let workers = workers.max(1) as u64;
    let base = total / workers;
    let extra = total % workers;
    let mut start = 0;
    (0..workers)
        .map(|index| {
            let end = start + base + u64::from(index < extra);
            let range = start..end;
            start = end;
            range
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn ranges_cover_every_item_exactly_once() {
        for total in [0, 1, 7, 8, 9, 1000] {
            for workers in [1, 2, 3, 4, 8] {
                let ranges = split_static(total, workers);
                assert_eq!(ranges.len(), workers);
                let mut expected_start = 0;
                for range in &ranges {
                    assert_eq!(range.start, expected_start);
                    expected_start = range.end;
                }
                assert_eq!(expected_start, total);
            }
        }
    }

    #[test]
    fn sizes_differ_by_at_most_one() {
        let sizes: Vec<u64> = split_static(10, 4)
            .iter()
            .map(|r| r.end - r.start)
            .collect();
        assert_eq!(sizes, [3, 3, 2, 2]);
    }
}
