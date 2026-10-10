// EN: A mini relational DBMS kept small enough to read in one sitting: in-memory tables with
//     selection and projection (`table`), three equi-join algorithms (`join`) and the workload
//     used by the benchmark (`workload`).
// PT: Um mini SGBD relacional pequeno o bastante para ser lido de uma vez: tabelas em memória
//     com seleção e projeção (`table`), três algoritmos de junção por igualdade (`join`) e a
//     carga usada pelo benchmark (`workload`).
// ES: Un mini SGBD relacional lo bastante pequeño como para leerlo de una sola vez: tablas en
//     memoria con selección y proyección (`table`), tres algoritmos de join por igualdad
//     (`join`) y la carga usada por el benchmark (`workload`).
pub mod join;
pub mod table;
pub mod workload;

pub use join::{Pair, hash_join, materialise, nested_loop_join, sort_merge_join};
pub use table::{Op, Predicate, Table, Value};
