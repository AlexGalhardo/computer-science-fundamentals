use std::cmp::Ordering;
use std::collections::HashMap;

use crate::table::{Table, Value};

// EN: A join result as pairs of row positions: (row of the left table, row of the right table).
//     The three algorithms below only differ in how they find the matching pairs, so returning
//     the pairs keeps the comparison fair. `materialise` turns pairs into a table.
// PT: O resultado de uma junção como pares de posições de linha: (linha da tabela esquerda,
//     linha da tabela direita). Os três algoritmos abaixo só diferem em como encontram os pares
//     que casam, então devolver os pares mantém a comparação justa. `materialise` transforma
//     pares em uma tabela.
// ES: El resultado de un join como pares de posiciones de fila: (fila de la tabla izquierda,
//     fila de la tabla derecha). Los tres algoritmos de abajo solo difieren en cómo encuentran
//     los pares que coinciden, así que devolver los pares mantiene justa la comparación.
//     `materialise` convierte los pares en una tabla.
pub type Pair = (usize, usize);

// EN: Nested-loop join: for each row of the left table, scan the whole right table. It makes
//     n * m comparisons, so doubling both tables makes it four times slower. Its strength is
//     generality: it would work for any join condition, not only equality.
// PT: Junção por laços aninhados: para cada linha da tabela esquerda, percorre a tabela direita
//     inteira. Faz n * m comparações, então dobrar as duas tabelas a deixa quatro vezes mais
//     lenta. Sua força é a generalidade: funcionaria para qualquer condição de junção, não só
//     igualdade.
// ES: Join por bucles anidados: para cada fila de la tabla izquierda, recorre la tabla derecha
//     completa. Hace n * m comparaciones, así que duplicar las dos tablas lo vuelve cuatro
//     veces más lento. Su fortaleza es la generalidad: funcionaría con cualquier condición de
//     join, no solo igualdad.
pub fn nested_loop_join(
    left: &Table,
    left_column: &str,
    right: &Table,
    right_column: &str,
) -> Result<Vec<Pair>, String> {
    let l = left.column_index(left_column)?;
    let r = right.column_index(right_column)?;
    let mut pairs = Vec::new();
    for (i, left_row) in left.rows.iter().enumerate() {
        for (j, right_row) in right.rows.iter().enumerate() {
            if left_row[l] == right_row[r] {
                pairs.push((i, j));
            }
        }
    }
    Ok(pairs)
}

// EN: Hash join, in two phases. Build: read the right table once and store, for each key, the
//     positions of the rows that have it. Probe: read the left table once and look each key up.
//     Equal keys always land in the same bucket, so each lookup is O(1) on average and the whole
//     join is O(n + m). The price is memory for the hash table, and it only works for equality.
// PT: Junção por hash, em duas fases. Construção: lê a tabela direita uma vez e guarda, para
//     cada chave, as posições das linhas que a têm. Sondagem: lê a tabela esquerda uma vez e
//     procura cada chave. Chaves iguais sempre caem no mesmo balde, então cada busca é O(1) em
//     média e a junção inteira é O(n + m). O preço é a memória da tabela hash, e ela só funciona
//     para igualdade.
// ES: Hash join, en dos fases. Construcción: lee la tabla derecha una vez y guarda, para cada
//     clave, las posiciones de las filas que la tienen. Sondeo: lee la tabla izquierda una vez
//     y busca cada clave. Las claves iguales siempre caen en la misma cubeta, así que cada
//     búsqueda es O(1) en promedio y el join completo es O(n + m). El precio es la memoria de la
//     tabla hash, y solo funciona para igualdad.
pub fn hash_join(
    left: &Table,
    left_column: &str,
    right: &Table,
    right_column: &str,
) -> Result<Vec<Pair>, String> {
    let l = left.column_index(left_column)?;
    let r = right.column_index(right_column)?;
    let mut buckets: HashMap<&Value, Vec<usize>> = HashMap::with_capacity(right.rows.len());
    for (j, right_row) in right.rows.iter().enumerate() {
        buckets.entry(&right_row[r]).or_default().push(j);
    }
    let mut pairs = Vec::new();
    for (i, left_row) in left.rows.iter().enumerate() {
        if let Some(matches) = buckets.get(&left_row[l]) {
            for &j in matches {
                pairs.push((i, j));
            }
        }
    }
    Ok(pairs)
}

// EN: Sort-merge join. Sort both tables by the join key (O(n log n) each), then walk the two
//     sorted lists together like the merge step of merge sort: advance the side with the smaller
//     key, and when the keys are equal emit the matches. Only positions are sorted, so the
//     tables themselves are not moved.
// PT: Junção por ordenação e intercalação. Ordena as duas tabelas pela chave de junção
//     (O(n log n) cada), depois percorre as duas listas ordenadas juntas, como a etapa de
//     intercalação do merge sort: avança o lado de menor chave e, quando as chaves são iguais,
//     emite os casamentos. Só as posições são ordenadas, então as tabelas em si não são movidas.
// ES: Sort-merge join. Ordena las dos tablas por la clave de join (O(n log n) cada una), luego
//     recorre las dos listas ordenadas juntas, como el paso de intercalación del merge sort:
//     avanza el lado de menor clave y, cuando las claves son iguales, emite las coincidencias.
//     Solo se ordenan las posiciones, así que las tablas en sí no se mueven.
pub fn sort_merge_join(
    left: &Table,
    left_column: &str,
    right: &Table,
    right_column: &str,
) -> Result<Vec<Pair>, String> {
    let l = left.column_index(left_column)?;
    let r = right.column_index(right_column)?;
    let mut left_order: Vec<usize> = (0..left.rows.len()).collect();
    let mut right_order: Vec<usize> = (0..right.rows.len()).collect();
    left_order.sort_by(|&a, &b| left.rows[a][l].cmp(&left.rows[b][l]));
    right_order.sort_by(|&a, &b| right.rows[a][r].cmp(&right.rows[b][r]));

    let mut pairs = Vec::new();
    let mut i = 0;
    let mut j = 0;
    while i < left_order.len() && j < right_order.len() {
        let left_key = &left.rows[left_order[i]][l];
        let right_key = &right.rows[right_order[j]][r];
        match left_key.cmp(right_key) {
            Ordering::Less => i += 1,
            Ordering::Greater => j += 1,
            Ordering::Equal => {
                // EN: Duplicate keys form a run on each side. Every row of the left run matches
                //     every row of the right run, so the runs are found first and then crossed.
                // PT: Chaves repetidas formam um trecho de cada lado. Toda linha do trecho
                //     esquerdo casa com toda linha do trecho direito, então os trechos são
                //     encontrados primeiro e depois combinados.
                // ES: Las claves repetidas forman un tramo en cada lado. Toda fila del tramo
                //     izquierdo coincide con toda fila del tramo derecho, así que primero se
                //     encuentran los tramos y luego se cruzan.
                let mut i_end = i;
                while i_end < left_order.len() && &left.rows[left_order[i_end]][l] == left_key {
                    i_end += 1;
                }
                let mut j_end = j;
                while j_end < right_order.len() && &right.rows[right_order[j_end]][r] == right_key {
                    j_end += 1;
                }
                for &left_position in &left_order[i..i_end] {
                    for &right_position in &right_order[j..j_end] {
                        pairs.push((left_position, right_position));
                    }
                }
                i = i_end;
                j = j_end;
            }
        }
    }
    Ok(pairs)
}

// EN: Builds the joined table from the pairs: each result row is a left row followed by the
//     matching right row. Column names get the table name as a prefix, because both tables may
//     have a column with the same name (the join column usually does).
// PT: Monta a tabela resultante a partir dos pares: cada linha do resultado é uma linha da
//     esquerda seguida da linha da direita que casa com ela. Os nomes das colunas recebem o nome
//     da tabela como prefixo, porque as duas tabelas podem ter uma coluna de mesmo nome (a
//     coluna de junção costuma ter).
// ES: Arma la tabla resultante a partir de los pares: cada fila del resultado es una fila de la
//     izquierda seguida de la fila de la derecha que coincide con ella. Los nombres de las
//     columnas reciben el nombre de la tabla como prefijo, porque las dos tablas pueden tener
//     una columna con el mismo nombre (la columna de join suele tenerla).
pub fn materialise(
    left: &Table,
    left_name: &str,
    right: &Table,
    right_name: &str,
    pairs: &[Pair],
) -> Table {
    let mut columns: Vec<String> = left
        .columns
        .iter()
        .map(|column| format!("{left_name}.{column}"))
        .collect();
    columns.extend(
        right
            .columns
            .iter()
            .map(|column| format!("{right_name}.{column}")),
    );
    let rows = pairs
        .iter()
        .map(|&(i, j)| {
            let mut row = left.rows[i].clone();
            row.extend(right.rows[j].iter().cloned());
            row
        })
        .collect();
    Table { columns, rows }
}
