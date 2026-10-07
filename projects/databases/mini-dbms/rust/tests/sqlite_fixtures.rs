use std::collections::HashMap;
use std::fs;
use std::path::Path;

use mini_dbms::{
    Op, Predicate, Table, Value, hash_join, materialise, nested_loop_join, sort_merge_join,
};

// EN: The file `fixtures/sqlite_cases.tsv` is written by `python/make_fixtures.py`, which runs
//     every query on a real SQLite database and records the rows SQLite returned. This test
//     runs the same queries on the Rust engine and compares. A Python test checks that the
//     committed file still equals what SQLite answers, so the expected rows cannot go stale.
//     Rust has no SQLite in its standard library, and this keeps the crate free of dependencies.
// PT: O arquivo `fixtures/sqlite_cases.tsv` é escrito por `python/make_fixtures.py`, que roda
//     cada consulta em um banco SQLite de verdade e registra as linhas que o SQLite devolveu.
//     Este teste roda as mesmas consultas no motor em Rust e compara. Um teste em Python confere
//     que o arquivo versionado ainda é igual ao que o SQLite responde, então as linhas esperadas
//     não ficam desatualizadas. O Rust não tem SQLite na biblioteca padrão, e assim o crate
//     continua sem dependências.
struct Fixture {
    tables: HashMap<String, Table>,
    types: HashMap<String, Vec<String>>,
    queries: Vec<Vec<String>>,
    joins: Vec<Vec<String>>,
    expected: HashMap<String, Vec<Vec<String>>>,
}

fn parse_value(kind: &str, text: &str) -> Value {
    if kind == "int" {
        Value::Int(text.parse().expect("integer value in fixture"))
    } else {
        Value::Text(text.to_string())
    }
}

fn load_fixture() -> Fixture {
    let path = Path::new(env!("CARGO_MANIFEST_DIR")).join("../fixtures/sqlite_cases.tsv");
    let content = fs::read_to_string(&path).expect("fixtures/sqlite_cases.tsv is readable");
    let mut fixture = Fixture {
        tables: HashMap::new(),
        types: HashMap::new(),
        queries: Vec::new(),
        joins: Vec::new(),
        expected: HashMap::new(),
    };
    for line in content.lines() {
        if line.is_empty() || line.starts_with('#') {
            continue;
        }
        let fields: Vec<String> = line.split('\t').map(str::to_string).collect();
        match fields[0].as_str() {
            // T <table> <column:type>...
            "T" => {
                let mut names = Vec::new();
                let mut kinds = Vec::new();
                for declaration in &fields[2..] {
                    let (name, kind) = declaration.split_once(':').expect("column:type");
                    names.push(name);
                    kinds.push(kind.to_string());
                }
                fixture.tables.insert(fields[1].clone(), Table::new(&names));
                fixture.types.insert(fields[1].clone(), kinds);
            }
            // R <table> <value>...
            "R" => {
                let kinds = &fixture.types[&fields[1]];
                let row = fields[2..]
                    .iter()
                    .zip(kinds)
                    .map(|(text, kind)| parse_value(kind, text))
                    .collect();
                fixture
                    .tables
                    .get_mut(&fields[1])
                    .expect("table declared before its rows")
                    .insert(row)
                    .expect("row matches the heading");
            }
            // Q <id> <table> <where column or -> <op> <constant> <projection or *> <all|distinct>
            "Q" => {
                fixture.expected.entry(fields[1].clone()).or_default();
                fixture.queries.push(fields);
            }
            // J <id> <left table> <left column> <right table> <right column>
            "J" => {
                fixture.expected.entry(fields[1].clone()).or_default();
                fixture.joins.push(fields);
            }
            // E <id> <value>...
            "E" => fixture
                .expected
                .entry(fields[1].clone())
                .or_default()
                .push(fields[2..].to_vec()),
            other => panic!("unknown fixture line kind: {other}"),
        }
    }
    for rows in fixture.expected.values_mut() {
        rows.sort();
    }
    fixture
}

#[test]
fn selection_and_projection_equal_sqlite() {
    let fixture = load_fixture();
    assert!(!fixture.queries.is_empty());
    for query in &fixture.queries {
        let id = &query[1];
        let table = &fixture.tables[&query[2]];
        let kinds = &fixture.types[&query[2]];

        let selected = if query[3] == "-" {
            table.clone()
        } else {
            let index = table.column_index(&query[3]).unwrap();
            let predicate = Predicate {
                column: query[3].clone(),
                op: Op::parse(&query[4]).expect("known operator"),
                value: parse_value(&kinds[index], &query[5]),
            };
            table.select(&predicate).unwrap()
        };
        let projected = if query[6] == "*" {
            selected
        } else {
            let columns: Vec<&str> = query[6].split(',').collect();
            selected.project(&columns, query[7] == "distinct").unwrap()
        };
        assert_eq!(
            projected.sorted_text_rows(),
            fixture.expected[id],
            "query {id} differs from SQLite"
        );
    }
}

#[test]
fn joins_equal_sqlite() {
    let fixture = load_fixture();
    assert!(!fixture.joins.is_empty());
    for join in &fixture.joins {
        let id = &join[1];
        let left = &fixture.tables[&join[2]];
        let right = &fixture.tables[&join[4]];
        let results = [
            (
                "nested-loop",
                nested_loop_join(left, &join[3], right, &join[5]),
            ),
            ("hash", hash_join(left, &join[3], right, &join[5])),
            (
                "sort-merge",
                sort_merge_join(left, &join[3], right, &join[5]),
            ),
        ];
        for (name, pairs) in results {
            let joined = materialise(left, &join[2], right, &join[4], &pairs.unwrap());
            assert_eq!(
                joined.sorted_text_rows(),
                fixture.expected[id],
                "{name} join {id} differs from SQLite"
            );
        }
    }
}
