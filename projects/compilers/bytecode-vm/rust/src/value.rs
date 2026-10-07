//! Run-time values of the virtual machine.

use std::cell::RefCell;
use std::fmt;
use std::rc::Rc;

use crate::chunk::Chunk;

// EN: A value fits in a few bytes and is cheap to copy: numbers, booleans and `nil` are stored
//     inline, and strings and functions are shared through a reference-counted pointer (`Rc`),
//     so pushing one on the stack never copies the text or the code.
// PT: Um valor cabe em poucos bytes e é barato de copiar: números, booleanos e `nil` ficam
//     guardados direto, e strings e funções são compartilhadas por um ponteiro com contagem de
//     referências (`Rc`), então empilhar um deles nunca copia o texto nem o código.
#[derive(Debug, Clone)]
pub enum Value {
    Nil,
    Bool(bool),
    Number(f64),
    Str(Rc<str>),
    Closure(Rc<Closure>),
}

impl Value {
    /// Only `false` and `nil` are false. Everything else, including 0 and "", is true.
    pub fn is_truthy(&self) -> bool {
        !matches!(self, Value::Nil | Value::Bool(false))
    }
}

// EN: Values of different types are never equal, and two functions are equal only when they are
//     the very same closure object.
// PT: Valores de tipos diferentes nunca são iguais, e duas funções são iguais apenas quando são
//     exatamente o mesmo objeto closure.
impl PartialEq for Value {
    fn eq(&self, other: &Self) -> bool {
        match (self, other) {
            (Value::Nil, Value::Nil) => true,
            (Value::Bool(a), Value::Bool(b)) => a == b,
            (Value::Number(a), Value::Number(b)) => a == b,
            (Value::Str(a), Value::Str(b)) => a == b,
            (Value::Closure(a), Value::Closure(b)) => Rc::ptr_eq(a, b),
            _ => false,
        }
    }
}

impl fmt::Display for Value {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Value::Nil => write!(f, "nil"),
            Value::Bool(value) => write!(f, "{value}"),
            // Negative zero prints as "0", as the tree-walking interpreter does.
            Value::Number(value) if *value == 0.0 => write!(f, "0"),
            Value::Number(value) => write!(f, "{value}"),
            Value::Str(value) => write!(f, "{value}"),
            Value::Closure(closure) => write!(f, "<fn {}>", closure.function.name),
        }
    }
}

/// Where a closure finds one captured variable when it is created.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct UpvalueRef {
    /// `true`: a local slot of the enclosing function. `false`: an upvalue of the enclosing one.
    pub from_local: bool,
    pub index: u32,
}

// EN: A compiled function: what the compiler produces for one `fn` (and for the top-level
//     script). It is immutable and exists once, however many times the function is called.
// PT: Uma função compilada: o que o compilador produz para um `fn` (e para o script de nível
//     superior). É imutável e existe uma única vez, não importa quantas vezes a função é chamada.
#[derive(Debug)]
pub struct Function {
    pub name: String,
    pub arity: usize,
    pub chunk: Chunk,
    pub upvalues: Vec<UpvalueRef>,
}

// EN: A captured variable. While the function that declared it is still running, the variable
//     lives in a stack slot and the upvalue only points at it (`Open`). When that slot is about
//     to disappear, the value moves into the upvalue itself (`Closed`). Every closure that
//     captured the variable shares this one object, so they all keep seeing the same variable.
// PT: Uma variável capturada. Enquanto a função que a declarou ainda está rodando, a variável
//     mora em uma posição da pilha e o upvalue apenas aponta para ela (`Open`). Quando essa
//     posição está prestes a sumir, o valor se muda para dentro do próprio upvalue (`Closed`).
//     Toda closure que capturou a variável compartilha este mesmo objeto, então todas continuam
//     vendo a mesma variável.
#[derive(Debug)]
pub enum Upvalue {
    Open(usize),
    Closed(Value),
}

/// The run-time function value: compiled code plus the variables it captured.
#[derive(Debug)]
pub struct Closure {
    pub function: Rc<Function>,
    pub upvalues: Vec<Rc<RefCell<Upvalue>>>,
}
