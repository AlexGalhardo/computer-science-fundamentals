//! The syntax tree of the mini language, as produced by the parser.

// EN: Where a token was found in the source. The compiler copies it next to every instruction it
//     emits, so the virtual machine can say where a run-time error happened.
// PT: Onde um token foi encontrado no código-fonte. O compilador o copia ao lado de cada instrução
//     que emite, para que a máquina virtual consiga dizer onde um erro de execução aconteceu.
// ES: Dónde se encontró un token en el código fuente. El compilador lo copia junto a cada
//     instrucción que emite, para que la máquina virtual pueda decir dónde ocurrió un error de
//     ejecución.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub struct Pos {
    pub line: u32,
    pub column: u32,
}

#[derive(Debug, Clone, PartialEq)]
pub enum Literal {
    Number(f64),
    Str(String),
    Bool(bool),
    Nil,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum UnaryOp {
    Negate,
    Not,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum BinaryOp {
    Add,
    Subtract,
    Multiply,
    Divide,
    Modulo,
    Equal,
    NotEqual,
    Less,
    LessEqual,
    Greater,
    GreaterEqual,
}

// EN: The same tree the TypeScript parser of MP-COMP-1 builds: parentheses and semicolons are
//     gone, and each node keeps the position of its defining token (the operator of a binary
//     expression, the name of a variable, the `(` of a call).
// PT: A mesma árvore que o parser em TypeScript do MP-COMP-1 constrói: parênteses e ponto e
//     vírgula desaparecem, e cada nó guarda a posição do token que o define (o operador de uma
//     expressão binária, o nome de uma variável, o `(` de uma chamada).
// ES: El mismo árbol que construye el parser en TypeScript del MP-COMP-1: paréntesis y punto y
//     coma desaparecen, y cada nodo guarda la posición del token que lo define (el operador de
//     una expresión binaria, el nombre de una variable, el `(` de una llamada).
#[derive(Debug, Clone, PartialEq)]
pub enum Expr {
    Literal(Literal, Pos),
    Variable {
        name: String,
        pos: Pos,
    },
    Assign {
        name: String,
        value: Box<Expr>,
        pos: Pos,
    },
    Unary {
        op: UnaryOp,
        operand: Box<Expr>,
        pos: Pos,
    },
    Binary {
        op: BinaryOp,
        left: Box<Expr>,
        right: Box<Expr>,
        pos: Pos,
    },
    Logical {
        is_and: bool,
        left: Box<Expr>,
        right: Box<Expr>,
        pos: Pos,
    },
    Call {
        callee: Box<Expr>,
        args: Vec<Expr>,
        pos: Pos,
    },
}

#[derive(Debug, Clone, PartialEq)]
pub enum Stmt {
    Let {
        name: String,
        initializer: Expr,
    },
    Fn {
        name: String,
        params: Vec<String>,
        body: Vec<Stmt>,
    },
    If {
        condition: Expr,
        then_branch: Vec<Stmt>,
        else_branch: Option<Vec<Stmt>>,
    },
    While {
        condition: Expr,
        body: Vec<Stmt>,
    },
    Return(Option<Expr>),
    Print(Expr),
    Block(Vec<Stmt>),
    Expression(Expr),
}
