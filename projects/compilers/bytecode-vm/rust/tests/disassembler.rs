use std::fs;
use std::path::PathBuf;

use bytecode_vm::disassemble_source;

// EN: Snapshot tests. Each `tests/snapshots/<name>.mini` has a `<name>.txt` with the bytecode
//     listing it must compile to, reviewed by a person and committed. Any change in the compiler
//     that alters the generated code shows up here as a readable difference. To accept an
//     intended change, regenerate the file with `bytecode-vm disasm <name>.mini > <name>.txt`.
// PT: Testes de snapshot. Cada `tests/snapshots/<nome>.mini` tem um `<nome>.txt` com a listagem
//     de bytecode que ele deve gerar, revisada por uma pessoa e versionada. Qualquer mudança no
//     compilador que altere o código gerado aparece aqui como uma diferença legível. Para aceitar
//     uma mudança intencional, gere o arquivo de novo com
//     `bytecode-vm disasm <nome>.mini > <nome>.txt`.
// ES: Pruebas de snapshot. Cada `tests/snapshots/<nombre>.mini` tiene un `<nombre>.txt` con el
//     listado de bytecode que debe generar, revisado por una persona y versionado. Cualquier
//     cambio en el compilador que altere el código generado aparece aquí como una diferencia
//     legible. Para aceptar un cambio intencional, genera el archivo de nuevo con
//     `bytecode-vm disasm <nombre>.mini > <nombre>.txt`.
fn check(name: &str) {
    let folder = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("tests")
        .join("snapshots");
    let source = fs::read_to_string(folder.join(format!("{name}.mini"))).expect("snapshot source");
    let expected = fs::read_to_string(folder.join(format!("{name}.txt"))).expect("snapshot");
    let listing = disassemble_source(&source).expect("the snapshot source compiles");
    assert_eq!(listing, expected, "bytecode of {name}.mini changed");
}

#[test]
fn arithmetic_is_emitted_in_postfix_order() {
    check("arithmetic");
}

#[test]
fn if_and_while_become_jumps() {
    check("control-flow");
}

#[test]
fn parameters_and_locals_are_stack_slots() {
    check("function");
}

#[test]
fn a_closure_reaches_its_captured_variable_through_an_upvalue() {
    check("closure");
}

#[test]
fn the_listing_is_readable_without_the_source() {
    let listing = disassemble_source("let x = 2;\nprint x * 3;").expect("compiles");
    let expected = "\
== script ==
0000    1  CONSTANT                0  ; 2
0001    |  DEFINE_GLOBAL           0  ; x
0002    2  GET_GLOBAL              0  ; x
0003    |  CONSTANT                1  ; 3
0004    |  MULTIPLY
0005    |  PRINT
0006    |  NIL
0007    |  RETURN
";
    assert_eq!(listing, expected);
}
