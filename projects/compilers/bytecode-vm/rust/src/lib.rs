//! A bytecode compiler and stack virtual machine for the mini language of MP-COMP-1.

pub mod ast;
pub mod chunk;
pub mod compiler;
pub mod lexer;
pub mod parser;
pub mod value;
pub mod vm;

use std::fmt;
use std::io::Write;

use crate::lexer::SyntaxError;
use crate::vm::{RuntimeError, Vm};

/// Either kind of failure, already carrying its line and column.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum MiniError {
    Syntax(SyntaxError),
    Runtime(RuntimeError),
}

impl fmt::Display for MiniError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            MiniError::Syntax(error) => error.fmt(f),
            MiniError::Runtime(error) => error.fmt(f),
        }
    }
}

// EN: The whole pipeline, one stage per line: text -> tree -> bytecode -> execution. The first
//     three stages happen once, before the program starts. Only the last one repeats work, and
//     it never looks at the text or at the tree again.
// PT: O pipeline inteiro, um estágio por linha: texto -> árvore -> bytecode -> execução. Os três
//     primeiros estágios acontecem uma vez, antes de o programa começar. Só o último repete
//     trabalho, e ele nunca mais olha para o texto nem para a árvore.
pub fn run_source(source: &str, output: &mut dyn Write) -> Result<(), MiniError> {
    let tree = parser::parse(source).map_err(MiniError::Syntax)?;
    let program = compiler::compile(&tree);
    Vm::new(output).run(&program).map_err(MiniError::Runtime)
}

/// Compiles `source` and returns the readable listing of its bytecode.
pub fn disassemble_source(source: &str) -> Result<String, MiniError> {
    let tree = parser::parse(source).map_err(MiniError::Syntax)?;
    let program = compiler::compile(&tree);
    Ok(chunk::disassemble(&program.script, &program.global_names))
}
