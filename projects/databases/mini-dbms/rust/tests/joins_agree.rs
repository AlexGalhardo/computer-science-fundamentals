use mini_dbms::workload::{Lcg, bench_tables, checksum};
use mini_dbms::{Pair, Table, Value, hash_join, materialise, nested_loop_join, sort_merge_join};

// EN: A random table with a text key drawn from a small set, so keys repeat on both sides and
//     some keys of one table are missing in the other. Those are the cases where a join
//     algorithm usually goes wrong.
// PT: Uma tabela aleatória com chave de texto tirada de um conjunto pequeno, para que as chaves
//     se repitam dos dois lados e algumas chaves de uma tabela faltem na outra. Esses são os
//     casos em que um algoritmo de junção costuma errar.
// ES: Una tabla aleatoria con clave de texto tomada de un conjunto pequeño, para que las claves
//     se repitan en los dos lados y algunas claves de una tabla falten en la otra. Esos son los
//     casos en que un algoritmo de join suele equivocarse.
fn random_table(random: &mut Lcg, rows: u64, distinct_keys: u64) -> Table {
    let mut table = Table::new(&["key", "payload"]);
    for _ in 0..rows {
        let key = format!("k{}", random.next_below(distinct_keys));
        let payload = random.next_below(1_000_000) as i64;
        table
            .insert(vec![Value::Text(key), Value::Int(payload)])
            .expect("row matches the heading");
    }
    table
}

fn sorted(mut pairs: Vec<Pair>) -> Vec<Pair> {
    pairs.sort_unstable();
    pairs
}

// EN: The three algorithms must return the same set of pairs. They find them in different
//     orders, so the pairs are sorted before comparing.
// PT: Os três algoritmos precisam devolver o mesmo conjunto de pares. Eles os encontram em
//     ordens diferentes, então os pares são ordenados antes de comparar.
// ES: Los tres algoritmos deben devolver el mismo conjunto de pares. Los encuentran en órdenes
//     distintos, así que los pares se ordenan antes de comparar.
#[test]
fn three_joins_return_the_same_rows_on_random_tables() {
    let mut random = Lcg::new(2026);
    for round in 0..200 {
        let left_rows = random.next_below(40);
        let right_rows = random.next_below(40);
        let distinct_keys = 1 + random.next_below(12);
        let left = random_table(&mut random, left_rows, distinct_keys);
        let right = random_table(&mut random, right_rows, distinct_keys + 3);

        let nested = sorted(nested_loop_join(&left, "key", &right, "key").unwrap());
        let hash = sorted(hash_join(&left, "key", &right, "key").unwrap());
        let merge = sorted(sort_merge_join(&left, "key", &right, "key").unwrap());
        assert_eq!(nested, hash, "hash join differs in round {round}");
        assert_eq!(nested, merge, "sort-merge join differs in round {round}");

        let from_nested = materialise(&left, "l", &right, "r", &nested);
        let from_merge = materialise(&left, "l", &right, "r", &merge);
        assert_eq!(
            from_nested.sorted_text_rows(),
            from_merge.sorted_text_rows()
        );
    }
}

#[test]
fn joins_with_an_empty_table_return_nothing() {
    let mut random = Lcg::new(7);
    let full = random_table(&mut random, 10, 3);
    let empty = Table::new(&["key", "payload"]);
    assert!(
        nested_loop_join(&full, "key", &empty, "key")
            .unwrap()
            .is_empty()
    );
    assert!(hash_join(&full, "key", &empty, "key").unwrap().is_empty());
    assert!(
        sort_merge_join(&empty, "key", &full, "key")
            .unwrap()
            .is_empty()
    );
}

#[test]
fn unknown_join_column_is_an_error() {
    let table = Table::new(&["key", "payload"]);
    assert!(hash_join(&table, "missing", &table, "key").is_err());
}

// EN: In the benchmark workload every row of R matches exactly one row of S, so the join has n
//     rows. The checksum must be the same for the three algorithms: that is what the benchmark
//     table uses to show that the implementations agree.
// PT: Na carga do benchmark cada linha de R casa com exatamente uma linha de S, então a junção
//     tem n linhas. O checksum precisa ser o mesmo nos três algoritmos: é o que a tabela do
//     benchmark usa para mostrar que as implementações concordam.
// ES: En la carga del benchmark cada fila de R coincide con exactamente una fila de S, así que
//     el join tiene n filas. El checksum debe ser el mismo en los tres algoritmos: es lo que usa
//     la tabla del benchmark para mostrar que las implementaciones concuerdan.
#[test]
fn benchmark_workload_has_n_matches_and_one_checksum() {
    let (r, s) = bench_tables(1000);
    let nested = nested_loop_join(&r, "k", &s, "k").unwrap();
    let hash = hash_join(&r, "k", &s, "k").unwrap();
    let merge = sort_merge_join(&r, "k", &s, "k").unwrap();
    assert_eq!(nested.len(), 1000);
    assert_eq!(checksum(&r, &s, &nested), checksum(&r, &s, &hash));
    assert_eq!(checksum(&r, &s, &nested), checksum(&r, &s, &merge));
}
