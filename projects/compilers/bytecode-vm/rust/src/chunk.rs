//! The instruction set, the compiled chunk and the disassembler.

use std::fmt::Write;
use std::rc::Rc;

use crate::ast::Pos;
use crate::value::{Function, Value};

// EN: The instruction set of a stack machine. No instruction names its operands: an operator
//     pops them from the stack and pushes its result, so `1 + 2` is "push 1, push 2, ADD". The
//     number carried by some instructions is an index (a constant, a variable slot) or the
//     position of the instruction to jump to. Every instruction has the same small size, so a
//     function is one flat array that the machine reads from left to right.
// PT: O conjunto de instruções de uma máquina de pilha. Nenhuma instrução nomeia seus operandos:
//     um operador os desempilha e empilha o resultado, então `1 + 2` é "empilhe 1, empilhe 2,
//     ADD". O número que algumas instruções carregam é um índice (uma constante, uma posição de
//     variável) ou a posição da instrução para onde saltar. Toda instrução tem o mesmo tamanho
//     pequeno, então uma função é um vetor plano que a máquina lê da esquerda para a direita.
// ES: El conjunto de instrucciones de una máquina de pila. Ninguna instrucción nombra sus
//     operandos: un operador los desapila y apila el resultado, así que `1 + 2` es "apila 1,
//     apila 2, ADD". El número que llevan algunas instrucciones es un índice (una constante, una
//     posición de variable) o la posición de la instrucción a la que saltar. Toda instrucción
//     tiene el mismo tamaño pequeño, así que una función es un vector plano que la máquina lee de
//     izquierda a derecha.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Op {
    /// Push `constants[n]`.
    Constant(u32),
    Nil,
    True,
    False,
    Pop,
    /// Push a copy of stack slot `n` of the current call.
    GetLocal(u32),
    /// Store the top of the stack in slot `n`, without popping it.
    SetLocal(u32),
    GetGlobal(u32),
    /// Pop the top of the stack into global `n`, creating the variable.
    DefineGlobal(u32),
    SetGlobal(u32),
    GetUpvalue(u32),
    SetUpvalue(u32),
    Add,
    Subtract,
    Multiply,
    Divide,
    Modulo,
    Negate,
    Not,
    Equal,
    NotEqual,
    Less,
    LessEqual,
    Greater,
    GreaterEqual,
    Print,
    /// Continue at instruction `n`.
    Jump(u32),
    /// Pop the condition; continue at `n` when it is false.
    JumpIfFalse(u32),
    /// `and`: when the top is false, jump and keep it as the result; otherwise pop it.
    JumpIfFalseOrPop(u32),
    /// `or`: when the top is true, jump and keep it as the result; otherwise pop it.
    JumpIfTrueOrPop(u32),
    /// Call the function sitting below its `n` arguments.
    Call(u32),
    /// Push a closure of `functions[n]`, capturing its variables.
    Closure(u32),
    /// Move the captured local on top of the stack to the heap, then pop it.
    CloseUpvalue,
    Return,
}

// EN: A chunk is the compiled body of one function: the instructions, the position in the source
//     of each one (same index), and the two tables the instructions point into.
// PT: Um chunk é o corpo compilado de uma função: as instruções, a posição no código-fonte de
//     cada uma (mesmo índice), e as duas tabelas para as quais as instruções apontam.
// ES: Un chunk es el cuerpo compilado de una función: las instrucciones, la posición en el código
//     fuente de cada una (mismo índice), y las dos tablas a las que apuntan las instrucciones.
#[derive(Debug, Default)]
pub struct Chunk {
    pub code: Vec<Op>,
    pub positions: Vec<Pos>,
    pub constants: Vec<Value>,
    pub functions: Vec<Rc<Function>>,
}

fn operand(op: Op) -> (&'static str, Option<u32>) {
    match op {
        Op::Constant(n) => ("CONSTANT", Some(n)),
        Op::Nil => ("NIL", None),
        Op::True => ("TRUE", None),
        Op::False => ("FALSE", None),
        Op::Pop => ("POP", None),
        Op::GetLocal(n) => ("GET_LOCAL", Some(n)),
        Op::SetLocal(n) => ("SET_LOCAL", Some(n)),
        Op::GetGlobal(n) => ("GET_GLOBAL", Some(n)),
        Op::DefineGlobal(n) => ("DEFINE_GLOBAL", Some(n)),
        Op::SetGlobal(n) => ("SET_GLOBAL", Some(n)),
        Op::GetUpvalue(n) => ("GET_UPVALUE", Some(n)),
        Op::SetUpvalue(n) => ("SET_UPVALUE", Some(n)),
        Op::Add => ("ADD", None),
        Op::Subtract => ("SUBTRACT", None),
        Op::Multiply => ("MULTIPLY", None),
        Op::Divide => ("DIVIDE", None),
        Op::Modulo => ("MODULO", None),
        Op::Negate => ("NEGATE", None),
        Op::Not => ("NOT", None),
        Op::Equal => ("EQUAL", None),
        Op::NotEqual => ("NOT_EQUAL", None),
        Op::Less => ("LESS", None),
        Op::LessEqual => ("LESS_EQUAL", None),
        Op::Greater => ("GREATER", None),
        Op::GreaterEqual => ("GREATER_EQUAL", None),
        Op::Print => ("PRINT", None),
        Op::Jump(n) => ("JUMP", Some(n)),
        Op::JumpIfFalse(n) => ("JUMP_IF_FALSE", Some(n)),
        Op::JumpIfFalseOrPop(n) => ("JUMP_IF_FALSE_OR_POP", Some(n)),
        Op::JumpIfTrueOrPop(n) => ("JUMP_IF_TRUE_OR_POP", Some(n)),
        Op::Call(n) => ("CALL", Some(n)),
        Op::Closure(n) => ("CLOSURE", Some(n)),
        Op::CloseUpvalue => ("CLOSE_UPVALUE", None),
        Op::Return => ("RETURN", None),
    }
}

// EN: The disassembler turns a chunk back into text a person can read: the index of each
//     instruction, its source line (`|` when it is the same as the line above), its name and
//     its operand, with a comment saying what the operand refers to. Nested functions follow
//     the function that creates them.
// PT: O disassembler transforma um chunk de volta em texto que uma pessoa consegue ler: o índice
//     de cada instrução, sua linha no código-fonte (`|` quando é a mesma da linha acima), seu
//     nome e seu operando, com um comentário dizendo a que o operando se refere. Funções
//     aninhadas vêm depois da função que as cria.
// ES: El desensamblador convierte un chunk de vuelta en texto que una persona puede leer: el
//     índice de cada instrucción, su línea en el código fuente (`|` cuando es la misma de la
//     línea de arriba), su nombre y su operando, con un comentario que dice a qué se refiere el
//     operando. Las funciones anidadas vienen después de la función que las crea.
pub fn disassemble(function: &Function, global_names: &[String]) -> String {
    let mut out = String::new();
    write_function(&mut out, function, global_names);
    out
}

fn write_function(out: &mut String, function: &Function, global_names: &[String]) {
    let chunk = &function.chunk;
    let _ = writeln!(out, "== {} ==", function.name);
    let mut previous_line = 0;
    for (index, op) in chunk.code.iter().enumerate() {
        let line = chunk.positions[index].line;
        let line_text = if line == previous_line {
            "   |".to_string()
        } else {
            format!("{line:4}")
        };
        previous_line = line;
        let (name, number) = operand(*op);
        let comment = match *op {
            Op::Constant(n) => match &chunk.constants[n as usize] {
                Value::Str(text) => format!("\"{text}\""),
                other => other.to_string(),
            },
            Op::GetGlobal(n) | Op::DefineGlobal(n) | Op::SetGlobal(n) => {
                global_names[n as usize].clone()
            }
            Op::Closure(n) => {
                let inner = &chunk.functions[n as usize];
                let captures: Vec<String> = inner
                    .upvalues
                    .iter()
                    .map(|up| {
                        format!(
                            "{} {}",
                            if up.from_local { "local" } else { "upvalue" },
                            up.index
                        )
                    })
                    .collect();
                if captures.is_empty() {
                    format!("<fn {}>", inner.name)
                } else {
                    format!("<fn {}> captures {}", inner.name, captures.join(", "))
                }
            }
            Op::Jump(n) | Op::JumpIfFalse(n) | Op::JumpIfFalseOrPop(n) | Op::JumpIfTrueOrPop(n) => {
                format!("-> {n:04}")
            }
            _ => String::new(),
        };
        let text = match number {
            Some(n) if comment.is_empty() => format!("{index:04} {line_text}  {name:<21}{n:>4}"),
            Some(n) => format!("{index:04} {line_text}  {name:<21}{n:>4}  ; {comment}"),
            None => format!("{index:04} {line_text}  {name}"),
        };
        let _ = writeln!(out, "{text}");
    }
    for inner in &chunk.functions {
        out.push('\n');
        write_function(out, inner, global_names);
    }
}
