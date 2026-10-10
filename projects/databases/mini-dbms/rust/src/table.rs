use std::collections::HashSet;
use std::fmt;

// EN: A value stored in a table. Deriving `Ord` in this order makes every integer smaller than
//     every text, which is also how SQLite orders its storage classes. `Hash` lets a value be a
//     key of a hash table (used by the hash join) and `Ord` lets it be sorted (sort-merge join).
// PT: Um valor guardado em uma tabela. Derivar `Ord` nesta ordem faz todo inteiro ser menor que
//     todo texto, que é também como o SQLite ordena suas classes de armazenamento. `Hash` permite
//     que o valor seja chave de uma tabela hash (usada na junção por hash) e `Ord` permite
//     ordená-lo (junção por ordenação e intercalação).
// ES: Un valor guardado en una tabla. Derivar `Ord` en este orden hace que todo entero sea
//     menor que todo texto, que es también como SQLite ordena sus clases de almacenamiento.
//     `Hash` permite que el valor sea clave de una tabla hash (usada en el hash join) y `Ord`
//     permite ordenarlo (sort-merge join).
#[derive(Debug, Clone, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub enum Value {
    Int(i64),
    Text(String),
}

impl fmt::Display for Value {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Value::Int(number) => write!(f, "{number}"),
            Value::Text(text) => write!(f, "{text}"),
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Op {
    Eq,
    Ne,
    Lt,
    Le,
    Gt,
    Ge,
}

impl Op {
    pub fn parse(symbol: &str) -> Option<Op> {
        match symbol {
            "=" => Some(Op::Eq),
            "<>" => Some(Op::Ne),
            "<" => Some(Op::Lt),
            "<=" => Some(Op::Le),
            ">" => Some(Op::Gt),
            ">=" => Some(Op::Ge),
            _ => None,
        }
    }

    pub fn test(self, left: &Value, right: &Value) -> bool {
        match self {
            Op::Eq => left == right,
            Op::Ne => left != right,
            Op::Lt => left < right,
            Op::Le => left <= right,
            Op::Gt => left > right,
            Op::Ge => left >= right,
        }
    }
}

// EN: A selection condition of the form `column op constant`, such as `salary > 4000`.
// PT: Uma condição de seleção da forma `coluna op constante`, como `salary > 4000`.
// ES: Una condición de selección de la forma `columna op constante`, como `salary > 4000`.
#[derive(Debug, Clone)]
pub struct Predicate {
    pub column: String,
    pub op: Op,
    pub value: Value,
}

// EN: An in-memory table: a heading (column names) and a body (rows). Rows are kept in a
//     vector, so unlike a mathematical relation this table has an order and may hold duplicate
//     rows. That is the SQL view of a table, and it is why `project` has a `distinct` flag.
// PT: Uma tabela em memória: um cabeçalho (nomes das colunas) e um corpo (linhas). As linhas
//     ficam em um vetor, então, diferente de uma relação matemática, esta tabela tem ordem e
//     pode ter linhas repetidas. Essa é a visão de tabela do SQL, e é por isso que `project`
//     tem a opção `distinct`.
// ES: Una tabla en memoria: un encabezado (nombres de las columnas) y un cuerpo (filas). Las
//     filas se guardan en un vector, así que, a diferencia de una relación matemática, esta
//     tabla tiene orden y puede tener filas repetidas. Esa es la visión de tabla de SQL, y por
//     eso `project` tiene la opción `distinct`.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Table {
    pub columns: Vec<String>,
    pub rows: Vec<Vec<Value>>,
}

impl Table {
    pub fn new(columns: &[&str]) -> Table {
        Table {
            columns: columns.iter().map(|name| name.to_string()).collect(),
            rows: Vec::new(),
        }
    }

    pub fn insert(&mut self, row: Vec<Value>) -> Result<(), String> {
        if row.len() != self.columns.len() {
            return Err(format!(
                "row has {} values, table has {} columns",
                row.len(),
                self.columns.len()
            ));
        }
        self.rows.push(row);
        Ok(())
    }

    pub fn column_index(&self, name: &str) -> Result<usize, String> {
        self.columns
            .iter()
            .position(|column| column == name)
            .ok_or_else(|| format!("unknown column: {name}"))
    }

    // EN: Selection (restriction, the sigma of relational algebra): keeps the rows for which
    //     the condition is true and keeps every column. It is the WHERE clause of SQL. With no
    //     index, the only way to answer it is to look at every row once: O(n).
    // PT: Seleção (restrição, o sigma da álgebra relacional): mantém as linhas em que a condição
    //     é verdadeira e mantém todas as colunas. É a cláusula WHERE do SQL. Sem índice, o único
    //     jeito de responder é olhar cada linha uma vez: O(n).
    // ES: Selección (restricción, el sigma del álgebra relacional): conserva las filas en que la
    //     condición es verdadera y conserva todas las columnas. Es la cláusula WHERE de SQL. Sin
    //     índice, la única forma de responder es mirar cada fila una vez: O(n).
    pub fn select(&self, predicate: &Predicate) -> Result<Table, String> {
        let index = self.column_index(&predicate.column)?;
        let rows = self
            .rows
            .iter()
            .filter(|row| predicate.op.test(&row[index], &predicate.value))
            .cloned()
            .collect();
        Ok(Table {
            columns: self.columns.clone(),
            rows,
        })
    }

    // EN: Projection (the pi of relational algebra): keeps the requested columns of every row.
    //     Dropping columns can make different rows equal. Relational algebra removes those
    //     duplicates because a relation is a set, while SQL keeps them unless DISTINCT is
    //     written. `distinct` chooses between the two behaviours; a hash set remembers the rows
    //     already produced, so removing duplicates stays O(n) on average.
    // PT: Projeção (o pi da álgebra relacional): mantém as colunas pedidas de cada linha.
    //     Descartar colunas pode tornar iguais linhas que eram diferentes. A álgebra relacional
    //     remove essas duplicatas porque uma relação é um conjunto, enquanto o SQL as mantém a
    //     menos que se escreva DISTINCT. `distinct` escolhe entre os dois comportamentos; um
    //     conjunto hash lembra as linhas já produzidas, então remover duplicatas continua O(n)
    //     em média.
    // ES: Proyección (el pi del álgebra relacional): conserva las columnas pedidas de cada fila.
    //     Descartar columnas puede volver iguales filas que eran distintas. El álgebra relacional
    //     elimina esos duplicados porque una relación es un conjunto, mientras que SQL los
    //     conserva a menos que se escriba DISTINCT. `distinct` elige entre los dos
    //     comportamientos; un conjunto hash recuerda las filas ya producidas, así que eliminar
    //     duplicados sigue siendo O(n) en promedio.
    pub fn project(&self, columns: &[&str], distinct: bool) -> Result<Table, String> {
        let indexes = columns
            .iter()
            .map(|name| self.column_index(name))
            .collect::<Result<Vec<usize>, String>>()?;
        let mut seen: HashSet<Vec<Value>> = HashSet::new();
        let mut rows = Vec::new();
        for row in &self.rows {
            let projected: Vec<Value> = indexes.iter().map(|&index| row[index].clone()).collect();
            if distinct && !seen.insert(projected.clone()) {
                continue;
            }
            rows.push(projected);
        }
        Ok(Table {
            columns: columns.iter().map(|name| name.to_string()).collect(),
            rows,
        })
    }

    // EN: Rows as sorted text, so two results can be compared without depending on row order.
    //     A query result has no guaranteed order unless ORDER BY is used.
    // PT: Linhas como texto ordenado, para comparar dois resultados sem depender da ordem das
    //     linhas. O resultado de uma consulta não tem ordem garantida sem ORDER BY.
    // ES: Filas como texto ordenado, para comparar dos resultados sin depender del orden de las
    //     filas. El resultado de una consulta no tiene orden garantizado sin ORDER BY.
    pub fn sorted_text_rows(&self) -> Vec<Vec<String>> {
        let mut rows: Vec<Vec<String>> = self
            .rows
            .iter()
            .map(|row| row.iter().map(|value| value.to_string()).collect())
            .collect();
        rows.sort();
        rows
    }
}

#[cfg(test)]
mod tests {
    use super::{Op, Predicate, Table, Value};

    fn cities() -> Table {
        let mut table = Table::new(&["sno", "city"]);
        for (sno, city) in [(1, "Lisboa"), (2, "Porto"), (3, "Lisboa"), (4, "Faro")] {
            table
                .insert(vec![Value::Int(sno), Value::Text(city.to_string())])
                .unwrap();
        }
        table
    }

    #[test]
    fn select_keeps_matching_rows_and_all_columns() {
        let predicate = Predicate {
            column: "city".to_string(),
            op: Op::Eq,
            value: Value::Text("Lisboa".to_string()),
        };
        let result = cities().select(&predicate).unwrap();
        assert_eq!(result.columns, ["sno", "city"]);
        assert_eq!(result.rows.len(), 2);
    }

    #[test]
    fn project_keeps_duplicates_unless_distinct() {
        let table = cities();
        assert_eq!(table.project(&["city"], false).unwrap().rows.len(), 4);
        assert_eq!(table.project(&["city"], true).unwrap().rows.len(), 3);
    }

    #[test]
    fn unknown_column_and_wrong_arity_are_errors() {
        let mut table = cities();
        assert!(table.project(&["missing"], false).is_err());
        assert!(table.insert(vec![Value::Int(9)]).is_err());
    }
}
