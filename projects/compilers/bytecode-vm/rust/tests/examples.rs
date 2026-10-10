use std::fs;
use std::path::PathBuf;

use bytecode_vm::run_source;

fn examples_dir() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("..")
        .join("examples")
}

fn run(source: &str) -> (String, Option<String>) {
    let mut output = Vec::new();
    let error = run_source(source, &mut output)
        .err()
        .map(|error| error.to_string());
    (
        String::from_utf8(output).expect("the machine only prints UTF-8"),
        error,
    )
}

// EN: The acceptance test of the virtual machine: every example program of the tree-walking
//     interpreter (MP-COMP-2) must print exactly the text in its `.out` file, which was produced
//     by that interpreter. Two implementations that share nothing but the language definition
//     agreeing on every program is strong evidence that both are right.
// PT: O teste de aceite da máquina virtual: todo programa de exemplo do interpretador de árvore
//     (MP-COMP-2) precisa imprimir exatamente o texto do seu arquivo `.out`, que foi produzido
//     por aquele interpretador. Duas implementações que só compartilham a definição da linguagem
//     concordando em todos os programas é uma forte evidência de que ambas estão certas.
// ES: La prueba de aceptación de la máquina virtual: todo programa de ejemplo del intérprete de
//     árbol (MP-COMP-2) debe imprimir exactamente el texto de su archivo `.out`, que produjo ese
//     intérprete. Dos implementaciones que solo comparten la definición del lenguaje y coinciden
//     en todos los programas son una fuerte evidencia de que ambas están correctas.
#[test]
fn every_example_program_prints_the_output_of_the_tree_walking_interpreter() {
    let mut checked = 0;
    for entry in fs::read_dir(examples_dir()).expect("examples folder") {
        let path = entry.expect("directory entry").path();
        if path.extension().is_none_or(|extension| extension != "mini") {
            continue;
        }
        let source = fs::read_to_string(&path).expect("example program");
        let expected = fs::read_to_string(path.with_extension("out")).expect("expected output");
        let (output, error) = run(&source);
        assert_eq!(error, None, "{}", path.display());
        assert_eq!(output, expected, "{}", path.display());
        checked += 1;
    }
    assert!(checked >= 11, "only {checked} example programs were found");
}

#[test]
fn closures_share_a_captured_variable_and_keep_it_after_the_call_returns() {
    let source = r#"
        fn makeAccount() {
            let balance = 0;
            fn deposit(amount) { balance = balance + amount; return balance; }
            fn read() { return balance; }
            deposit(10);
            print read();
            return deposit;
        }
        let deposit = makeAccount();
        print deposit(5);
        print deposit(5);
    "#;
    assert_eq!(run(source), ("10\n15\n20\n".to_string(), None));
}

#[test]
fn a_variable_two_functions_away_is_forwarded_through_the_middle_function() {
    let source = r#"
        fn outer() {
            let x = "captured";
            fn middle() {
                fn inner() { return x; }
                return inner;
            }
            return middle;
        }
        print outer()()();
    "#;
    assert_eq!(run(source), ("captured\n".to_string(), None));
}

#[test]
fn each_loop_iteration_gets_its_own_captured_variable() {
    let source = r#"
        let first = nil;
        let second = nil;
        let i = 0;
        while i < 2 {
            let seen = i * 10;
            fn get() { return seen; }
            if i == 0 { first = get; } else { second = get; }
            i = i + 1;
        }
        print first();
        print second();
    "#;
    assert_eq!(run(source), ("0\n10\n".to_string(), None));
}

#[test]
fn a_local_function_can_call_itself() {
    let source =
        "{ fn fact(n) { if n <= 1 { return 1; } return n * fact(n - 1); } print fact(6); }";
    assert_eq!(run(source), ("720\n".to_string(), None));
}

#[test]
fn declaring_a_name_again_in_the_same_block_reuses_the_variable() {
    let source = "{ let a = 1; fn get() { return a; } let a = 2; print get(); print a; }";
    assert_eq!(run(source), ("2\n2\n".to_string(), None));
}

#[test]
fn return_from_inside_nested_blocks_and_loops_cleans_the_stack() {
    let source = r#"
        fn find(limit) {
            let i = 0;
            while true {
                let double = i * 2;
                { let extra = double + 1; if extra > limit { return i; } }
                i = i + 1;
            }
        }
        print find(10) + find(20);
    "#;
    assert_eq!(run(source), ("15\n".to_string(), None));
}

#[test]
fn short_circuit_skips_the_right_side() {
    let source = r#"
        fn boom() { print "ran"; return true; }
        print false and boom();
        print true or boom();
        print nil or "default";
        print 1 and 2;
    "#;
    assert_eq!(run(source), ("false\ntrue\ndefault\n2\n".to_string(), None));
}

fn error_of(source: &str) -> String {
    run(source).1.expect("the program must fail")
}

// EN: The same run-time errors the tree-walking interpreter reports, with the same text and the
//     same line and column. The machine no longer has the tree, so the positions come from the
//     table the compiler wrote next to the instructions.
// PT: Os mesmos erros de execução que o interpretador de árvore reporta, com o mesmo texto e a
//     mesma linha e coluna. A máquina não tem mais a árvore, então as posições vêm da tabela que
//     o compilador escreveu ao lado das instruções.
// ES: Los mismos errores de ejecución que reporta el intérprete de árbol, con el mismo texto y la
//     misma línea y columna. La máquina ya no tiene el árbol, así que las posiciones vienen de la
//     tabla que el compilador escribió junto a las instrucciones.
#[test]
fn run_time_errors_match_the_tree_walking_interpreter() {
    assert_eq!(
        error_of("let a = 1;\nprint a + missing;"),
        "[line 2, column 11] runtime error: undefined variable 'missing'"
    );
    assert_eq!(
        error_of("missing = 1;"),
        "[line 1, column 9] runtime error: undefined variable 'missing'"
    );
    assert_eq!(
        error_of("fn add(a, b) { return a + b; }\nprint add(1);"),
        "[line 2, column 10] runtime error: expected 2 arguments but got 1"
    );
    assert_eq!(
        error_of("let d = 0;\nprint 10 /\n  d;"),
        "[line 2, column 10] runtime error: division by zero"
    );
    assert_eq!(
        error_of("print 5 % 0;"),
        "[line 1, column 9] runtime error: division by zero"
    );
    assert_eq!(
        error_of("print 1 + \"a\";"),
        "[line 1, column 9] runtime error: operands of '+' must be two numbers or two strings"
    );
    assert_eq!(
        error_of("print \"a\" < \"b\";"),
        "[line 1, column 11] runtime error: operands of '<' must be numbers"
    );
    assert_eq!(
        error_of("print -true;"),
        "[line 1, column 7] runtime error: operand of '-' must be a number"
    );
    assert_eq!(
        error_of("let f = 3; f();"),
        "[line 1, column 13] runtime error: can only call functions"
    );
    assert_eq!(
        error_of("{ let hidden = 1; } print hidden;"),
        "[line 1, column 27] runtime error: undefined variable 'hidden'"
    );
}

#[test]
fn unbounded_recursion_is_reported_at_the_same_depth_as_the_interpreter() {
    assert_eq!(
        error_of("fn forever(n) { return forever(n + 1); }\nforever(0);"),
        "[line 1, column 31] runtime error: stack overflow"
    );
    let deepest = "fn down(n) { if n == 0 { return 0; } return down(n - 1); } print down(199);";
    assert_eq!(run(deepest), ("0\n".to_string(), None));
}

#[test]
fn output_printed_before_a_run_time_error_is_kept() {
    let (output, error) = run("print \"before\";\nprint 1 / 0;\nprint \"after\";");
    assert_eq!(output, "before\n");
    assert_eq!(
        error.as_deref(),
        Some("[line 2, column 9] runtime error: division by zero")
    );
}

#[test]
fn syntax_errors_stop_before_anything_runs() {
    let (output, error) = run("print \"first\";\nprint ;");
    assert_eq!(output, "");
    assert_eq!(
        error.as_deref(),
        Some("[line 2, column 7] syntax error: expected an expression, found ';'")
    );
    assert_eq!(
        error_of("print \"open;"),
        "[line 1, column 7] syntax error: unterminated string"
    );
    assert_eq!(
        error_of("print 1 @ 2;"),
        "[line 1, column 9] syntax error: unexpected character '@'"
    );
    assert_eq!(
        error_of("1 = 2;"),
        "[line 1, column 3] syntax error: the left side of '=' must be a variable name, found '='"
    );
}
