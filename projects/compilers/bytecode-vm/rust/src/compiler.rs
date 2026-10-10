//! The compiler: syntax tree to stack bytecode.

use std::rc::Rc;

use crate::ast::{BinaryOp, Expr, Literal, Pos, Stmt, UnaryOp};
use crate::chunk::{Chunk, Op};
use crate::value::{Function, UpvalueRef, Value};

/// A compiled program: the top-level code and the names of the global variable slots.
#[derive(Debug)]
pub struct Program {
    pub script: Rc<Function>,
    pub global_names: Vec<String>,
}

struct Local {
    name: String,
    /// Nesting level of the block that declared it.
    depth: usize,
    /// Set when an inner function uses it, so leaving the scope must keep it alive.
    captured: bool,
}

/// Everything known about one function while its body is being compiled.
struct FunctionState {
    name: String,
    arity: usize,
    chunk: Chunk,
    upvalues: Vec<UpvalueRef>,
    locals: Vec<Local>,
    scope_depth: usize,
}

/// Where a name lives, decided at compile time.
enum Target {
    Local(u32),
    Upvalue(u32),
    Global(u32),
}

fn index(value: usize) -> u32 {
    u32::try_from(value).expect("the program is too large for 32-bit operands")
}

// EN: The compiler walks the tree once, in the same order the tree-walking interpreter would, but
//     instead of DOING the work of each node it WRITES the instructions that will do it. The
//     lesson is in what it decides ahead of time, so the machine does not have to at run time:
//       - which variable a name means: a slot number, never a search by name;
//       - where control flow goes: `if` and `while` become jumps to known instruction indexes.
//     `states` is a stack with one entry per function being compiled, the innermost last.
// PT: O compilador percorre a árvore uma vez, na mesma ordem que o interpretador de árvore
//     percorreria, mas em vez de FAZER o trabalho de cada nó ele ESCREVE as instruções que o
//     farão. A lição está no que ele decide com antecedência, para a máquina não precisar decidir
//     durante a execução:
//       - a qual variável um nome se refere: um número de posição, nunca uma busca por nome;
//       - para onde o fluxo de controle vai: `if` e `while` viram saltos para índices conhecidos.
//     `states` é uma pilha com uma entrada por função em compilação, a mais interna por último.
// ES: El compilador recorre el árbol una vez, en el mismo orden en que lo recorrería el
//     intérprete de árbol, pero en lugar de HACER el trabajo de cada nodo ESCRIBE las
//     instrucciones que lo harán. La lección está en lo que decide por adelantado, para que la
//     máquina no tenga que decidir durante la ejecución:
//       - a qué variable se refiere un nombre: un número de posición, nunca una búsqueda por nombre;
//       - a dónde va el flujo de control: `if` y `while` se vuelven saltos a índices conocidos.
//     `states` es una pila con una entrada por función en compilación, la más interna al final.
struct Compiler {
    states: Vec<FunctionState>,
    global_names: Vec<String>,
    /// Position recorded next to each emitted instruction.
    pos: Pos,
}

impl Compiler {
    fn state(&mut self) -> &mut FunctionState {
        self.states
            .last_mut()
            .expect("there is always a function being compiled")
    }

    fn emit(&mut self, op: Op) -> usize {
        let pos = self.pos;
        let chunk = &mut self.state().chunk;
        chunk.code.push(op);
        chunk.positions.push(pos);
        chunk.code.len() - 1
    }

    fn emit_at(&mut self, op: Op, pos: Pos) -> usize {
        self.pos = pos;
        self.emit(op)
    }

    // EN: Backpatching. When the compiler emits a forward jump (over the `then` branch, out of a
    //     loop) it does not know yet where the jump lands, because that code has not been
    //     generated. It emits the jump with a placeholder, compiles what comes next, and then
    //     comes back to write the real target.
    // PT: Backpatching (remendo posterior). Quando o compilador emite um salto para frente (por
    //     cima do ramo `then`, para fora de um laço), ele ainda não sabe onde o salto cai, porque
    //     aquele código não foi gerado. Ele emite o salto com um valor provisório, compila o que
    //     vem depois, e então volta para escrever o destino real.
    // ES: Backpatching (parcheo posterior). Cuando el compilador emite un salto hacia adelante (por
    //     encima de la rama `then`, hacia fuera de un bucle), aún no sabe dónde cae el salto,
    //     porque ese código no se ha generado. Emite el salto con un valor provisional, compila lo
    //     que viene después, y luego vuelve para escribir el destino real.
    fn patch_jump(&mut self, jump: usize) {
        let chunk = &mut self.state().chunk;
        let target = index(chunk.code.len());
        chunk.code[jump] = match chunk.code[jump] {
            Op::Jump(_) => Op::Jump(target),
            Op::JumpIfFalse(_) => Op::JumpIfFalse(target),
            Op::JumpIfFalseOrPop(_) => Op::JumpIfFalseOrPop(target),
            Op::JumpIfTrueOrPop(_) => Op::JumpIfTrueOrPop(target),
            other => other,
        };
    }

    fn global_slot(&mut self, name: &str) -> u32 {
        let found = self.global_names.iter().position(|global| global == name);
        index(found.unwrap_or_else(|| {
            self.global_names.push(name.to_string());
            self.global_names.len() - 1
        }))
    }

    // --- name resolution ---

    fn resolve_local(&self, state: usize, name: &str) -> Option<usize> {
        // The innermost declaration wins, so search from the most recent local backwards.
        self.states[state]
            .locals
            .iter()
            .rposition(|local| local.name == name)
    }

    // EN: A name that is not a local of the current function may be a local of an enclosing one.
    //     Then it becomes an upvalue: the enclosing local is marked as captured, and the current
    //     function records where to fetch it when its closure is created. When the variable is
    //     two or more functions away, every function in between forwards it through an upvalue
    //     of its own, which is what the recursive call builds.
    // PT: Um nome que não é local da função atual pode ser local de uma função ao redor. Nesse
    //     caso ele vira um upvalue: o local externo é marcado como capturado, e a função atual
    //     registra onde buscá-lo quando sua closure for criada. Quando a variável está a duas ou
    //     mais funções de distância, cada função no caminho a repassa por um upvalue próprio, e
    //     é isso que a chamada recursiva constrói.
    // ES: Un nombre que no es local de la función actual puede ser local de una función que la
    //     rodea. En ese caso se convierte en un upvalue: el local externo se marca como capturado,
    //     y la función actual registra dónde buscarlo cuando se cree su closure. Cuando la
    //     variable está a dos o más funciones de distancia, cada función en el camino la pasa por
    //     un upvalue propio, y eso es lo que construye la llamada recursiva.
    fn resolve_upvalue(&mut self, state: usize, name: &str) -> Option<usize> {
        let enclosing = state.checked_sub(1)?;
        let reference = if let Some(slot) = self.resolve_local(enclosing, name) {
            self.states[enclosing].locals[slot].captured = true;
            UpvalueRef {
                from_local: true,
                index: index(slot),
            }
        } else {
            let outer = self.resolve_upvalue(enclosing, name)?;
            UpvalueRef {
                from_local: false,
                index: index(outer),
            }
        };
        let upvalues = &mut self.states[state].upvalues;
        Some(
            upvalues
                .iter()
                .position(|existing| *existing == reference)
                .unwrap_or_else(|| {
                    upvalues.push(reference);
                    upvalues.len() - 1
                }),
        )
    }

    // EN: The order of the three questions IS the scope rule: innermost block of this function
    //     first, then the enclosing functions, and finally the globals.
    // PT: A ordem das três perguntas É a regra de escopo: primeiro o bloco mais interno desta
    //     função, depois as funções ao redor, e por fim as globais.
    // ES: El orden de las tres preguntas ES la regla de ámbito: primero el bloque más interno de
    //     esta función, luego las funciones que la rodean, y por último las globales.
    fn resolve(&mut self, name: &str) -> Target {
        let current = self.states.len() - 1;
        if let Some(slot) = self.resolve_local(current, name) {
            Target::Local(index(slot))
        } else if let Some(upvalue) = self.resolve_upvalue(current, name) {
            Target::Upvalue(index(upvalue))
        } else {
            Target::Global(self.global_slot(name))
        }
    }

    /// The slot of `name` when the current block itself already declares it.
    fn declared_in_current_scope(&mut self, name: &str) -> Option<usize> {
        let depth = self.state().scope_depth;
        self.state()
            .locals
            .iter()
            .rposition(|local| local.depth == depth && local.name == name)
    }

    // EN: Gives a name to the value on top of the stack. At the top level it is popped into a
    //     global slot. Inside a block nothing is emitted at all: the value simply stays where it
    //     is, and the compiler remembers that this stack slot now has a name. That is the whole
    //     cost of a local variable. Declaring a name again in the same block reuses its slot.
    // PT: Dá um nome ao valor no topo da pilha. No nível superior ele é desempilhado para uma
    //     posição global. Dentro de um bloco nada é emitido: o valor simplesmente fica onde está,
    //     e o compilador lembra que essa posição da pilha agora tem nome. Esse é todo o custo de
    //     uma variável local. Declarar de novo um nome no mesmo bloco reutiliza a posição dele.
    // ES: Le da un nombre al valor en el tope de la pila. En el nivel superior se desapila hacia
    //     una posición global. Dentro de un bloque no se emite nada: el valor simplemente queda
    //     donde está, y el compilador recuerda que esa posición de la pila ahora tiene nombre. Ese
    //     es todo el costo de una variable local. Declarar de nuevo un nombre en el mismo bloque
    //     reutiliza su posición.
    fn define_variable(&mut self, name: &str) {
        if self.state().scope_depth == 0 {
            let slot = self.global_slot(name);
            self.emit(Op::DefineGlobal(slot));
        } else if let Some(slot) = self.declared_in_current_scope(name) {
            self.emit(Op::SetLocal(index(slot)));
            self.emit(Op::Pop);
        } else {
            let depth = self.state().scope_depth;
            self.state().locals.push(Local {
                name: name.to_string(),
                depth,
                captured: false,
            });
        }
    }

    fn begin_scope(&mut self) {
        self.state().scope_depth += 1;
    }

    // EN: Leaving a block removes its locals from the stack. A local that some closure captured
    //     cannot just be popped: CLOSE_UPVALUE first moves its value to the heap.
    // PT: Sair de um bloco remove os locais dele da pilha. Um local que alguma closure capturou
    //     não pode simplesmente ser desempilhado: CLOSE_UPVALUE primeiro move o valor para o heap.
    // ES: Salir de un bloque quita sus locales de la pila. Un local que alguna closure capturó no
    //     puede simplemente desapilarse: CLOSE_UPVALUE primero mueve el valor al heap.
    fn end_scope(&mut self) {
        self.state().scope_depth -= 1;
        let depth = self.state().scope_depth;
        while let Some(local) = self.state().locals.pop_if(|local| local.depth > depth) {
            self.emit(if local.captured {
                Op::CloseUpvalue
            } else {
                Op::Pop
            });
        }
    }

    // --- statements ---

    fn block(&mut self, body: &[Stmt]) {
        self.begin_scope();
        for statement in body {
            self.statement(statement);
        }
        self.end_scope();
    }

    fn statement(&mut self, statement: &Stmt) {
        match statement {
            Stmt::Let { name, initializer } => {
                // The initializer is compiled first, so `let x = x + 1;` reads the outer `x`.
                self.expression(initializer);
                self.define_variable(name);
            }
            Stmt::Fn { name, params, body } => self.function(name, params, body),
            Stmt::Print(value) => {
                self.expression(value);
                self.emit(Op::Print);
            }
            Stmt::Expression(expression) => {
                self.expression(expression);
                self.emit(Op::Pop);
            }
            Stmt::Block(body) => self.block(body),
            // EN: `if c { A } else { B }` becomes:
            //         c, JUMP_IF_FALSE else, A, JUMP end, else: B, end:
            // PT: `if c { A } else { B }` vira:
            //         c, JUMP_IF_FALSE else, A, JUMP end, else: B, end:
            // ES: `if c { A } else { B }` se convierte en:
            //         c, JUMP_IF_FALSE else, A, JUMP end, else: B, end:
            Stmt::If {
                condition,
                then_branch,
                else_branch,
            } => {
                self.expression(condition);
                let to_else = self.emit(Op::JumpIfFalse(0));
                self.block(then_branch);
                if let Some(else_branch) = else_branch {
                    let to_end = self.emit(Op::Jump(0));
                    self.patch_jump(to_else);
                    self.block(else_branch);
                    self.patch_jump(to_end);
                } else {
                    self.patch_jump(to_else);
                }
            }
            // EN: `while c { A }` becomes:
            //         start: c, JUMP_IF_FALSE exit, A, JUMP start, exit:
            //     The backward jump needs no patching: its target already exists.
            // PT: `while c { A }` vira:
            //         start: c, JUMP_IF_FALSE exit, A, JUMP start, exit:
            //     O salto para trás não precisa de remendo: o destino dele já existe.
            // ES: `while c { A }` se convierte en:
            //         start: c, JUMP_IF_FALSE exit, A, JUMP start, exit:
            //     El salto hacia atrás no necesita parche: su destino ya existe.
            Stmt::While { condition, body } => {
                let start = index(self.state().chunk.code.len());
                self.expression(condition);
                let to_exit = self.emit(Op::JumpIfFalse(0));
                self.block(body);
                self.emit(Op::Jump(start));
                self.patch_jump(to_exit);
            }
            Stmt::Return(value) => {
                match value {
                    Some(value) => self.expression(value),
                    None => {
                        self.emit(Op::Nil);
                    }
                }
                self.emit(Op::Return);
            }
        }
    }

    // EN: A function body is compiled into its own chunk, by a new entry on the `states` stack.
    //     Its parameters are its first locals: the caller pushes the arguments in order, so they
    //     are already sitting in slots 0, 1, 2... when the body starts. The enclosing function
    //     only gets one instruction, CLOSURE, which builds the function value at run time.
    // PT: O corpo de uma função é compilado em um chunk próprio, por uma nova entrada na pilha
    //     `states`. Seus parâmetros são seus primeiros locais: quem chama empilha os argumentos
    //     em ordem, então eles já estão nas posições 0, 1, 2... quando o corpo começa. A função
    //     ao redor recebe uma única instrução, CLOSURE, que monta o valor função na execução.
    // ES: El cuerpo de una función se compila en un chunk propio, por una nueva entrada en la pila
    //     `states`. Sus parámetros son sus primeros locales: quien llama apila los argumentos en
    //     orden, así que ya están en las posiciones 0, 1, 2... cuando comienza el cuerpo. La
    //     función que la rodea recibe una única instrucción, CLOSURE, que arma el valor función en
    //     la ejecución.
    fn function(&mut self, name: &str, params: &[String], body: &[Stmt]) {
        // EN: Inside a block the name is declared BEFORE the body is compiled, so the function
        //     can refer to itself (recursion) through an upvalue to its own slot.
        // PT: Dentro de um bloco o nome é declarado ANTES de o corpo ser compilado, para que a
        //     função consiga se referir a si mesma (recursão) por um upvalue para a própria posição.
        // ES: Dentro de un bloque el nombre se declara ANTES de compilar el cuerpo, para que la
        //     función pueda referirse a sí misma (recursión) por un upvalue a su propia posición.
        let is_new_local =
            self.state().scope_depth > 0 && self.declared_in_current_scope(name).is_none();
        if is_new_local {
            self.define_variable(name);
        }

        let locals = params.iter().map(|param| Local {
            name: param.clone(),
            depth: 1,
            captured: false,
        });
        self.states.push(FunctionState {
            name: name.to_string(),
            arity: params.len(),
            chunk: Chunk::default(),
            upvalues: Vec::new(),
            locals: locals.collect(),
            scope_depth: 1,
        });
        for statement in body {
            self.statement(statement);
        }
        let function = self.finish_function();

        let functions = &mut self.state().chunk.functions;
        functions.push(Rc::new(function));
        let function_index = index(functions.len() - 1);
        self.emit(Op::Closure(function_index));
        if !is_new_local {
            self.define_variable(name);
        }
    }

    /// Ends the innermost function with the implicit `return nil;` and takes it off the stack.
    fn finish_function(&mut self) -> Function {
        self.emit(Op::Nil);
        self.emit(Op::Return);
        let state = self
            .states
            .pop()
            .expect("there is always a function being compiled");
        Function {
            name: state.name,
            arity: state.arity,
            chunk: state.chunk,
            upvalues: state.upvalues,
        }
    }

    // --- expressions ---

    // EN: Post-order: the code of the operands comes first and the operator last. This is the
    //     tree written in postfix (reverse Polish) notation, and it is exactly the order a stack
    //     machine needs: when ADD runs, both of its operands are already on top of the stack.
    // PT: Pós-ordem: o código dos operandos vem primeiro e o operador por último. É a árvore
    //     escrita em notação pós-fixa (polonesa reversa), e é exatamente a ordem de que uma
    //     máquina de pilha precisa: quando ADD roda, seus dois operandos já estão no topo da pilha.
    // ES: Postorden: el código de los operandos va primero y el operador al final. Es el árbol
    //     escrito en notación postfija (polaca inversa), y es exactamente el orden que necesita
    //     una máquina de pila: cuando corre ADD, sus dos operandos ya están en el tope de la pila.
    fn expression(&mut self, expression: &Expr) {
        match expression {
            Expr::Literal(literal, pos) => {
                let op = match literal {
                    Literal::Nil => Op::Nil,
                    Literal::Bool(true) => Op::True,
                    Literal::Bool(false) => Op::False,
                    Literal::Number(value) => self.constant(Value::Number(*value)),
                    Literal::Str(value) => self.constant(Value::Str(Rc::from(value.as_str()))),
                };
                self.emit_at(op, *pos);
            }
            Expr::Variable { name, pos } => {
                let op = match self.resolve(name) {
                    Target::Local(slot) => Op::GetLocal(slot),
                    Target::Upvalue(slot) => Op::GetUpvalue(slot),
                    Target::Global(slot) => Op::GetGlobal(slot),
                };
                self.emit_at(op, *pos);
            }
            Expr::Assign { name, value, pos } => {
                self.expression(value);
                let op = match self.resolve(name) {
                    Target::Local(slot) => Op::SetLocal(slot),
                    Target::Upvalue(slot) => Op::SetUpvalue(slot),
                    Target::Global(slot) => Op::SetGlobal(slot),
                };
                self.emit_at(op, *pos);
            }
            Expr::Unary { op, operand, pos } => {
                self.expression(operand);
                let op = match op {
                    UnaryOp::Negate => Op::Negate,
                    UnaryOp::Not => Op::Not,
                };
                self.emit_at(op, *pos);
            }
            Expr::Binary {
                op,
                left,
                right,
                pos,
            } => {
                self.expression(left);
                self.expression(right);
                let op = match op {
                    BinaryOp::Add => Op::Add,
                    BinaryOp::Subtract => Op::Subtract,
                    BinaryOp::Multiply => Op::Multiply,
                    BinaryOp::Divide => Op::Divide,
                    BinaryOp::Modulo => Op::Modulo,
                    BinaryOp::Equal => Op::Equal,
                    BinaryOp::NotEqual => Op::NotEqual,
                    BinaryOp::Less => Op::Less,
                    BinaryOp::LessEqual => Op::LessEqual,
                    BinaryOp::Greater => Op::Greater,
                    BinaryOp::GreaterEqual => Op::GreaterEqual,
                };
                self.emit_at(op, *pos);
            }
            // EN: Short circuit is a jump: when the left side already decides the result, the
            //     code of the right side is skipped and the left value stays as the answer.
            // PT: Curto-circuito é um salto: quando o lado esquerdo já decide o resultado, o
            //     código do lado direito é pulado e o valor esquerdo fica como resposta.
            // ES: El cortocircuito es un salto: cuando el lado izquierdo ya decide el resultado, el
            //     código del lado derecho se salta y el valor izquierdo queda como respuesta.
            Expr::Logical {
                is_and,
                left,
                right,
                pos,
            } => {
                self.expression(left);
                let jump = if *is_and {
                    Op::JumpIfFalseOrPop(0)
                } else {
                    Op::JumpIfTrueOrPop(0)
                };
                let to_end = self.emit_at(jump, *pos);
                self.expression(right);
                self.patch_jump(to_end);
            }
            Expr::Call { callee, args, pos } => {
                self.expression(callee);
                for argument in args {
                    self.expression(argument);
                }
                self.emit_at(Op::Call(index(args.len())), *pos);
            }
        }
    }

    /// Adds a value to the constant table, reusing an equal one, and returns the instruction.
    fn constant(&mut self, value: Value) -> Op {
        let constants = &mut self.state().chunk.constants;
        let found = constants.iter().position(|existing| *existing == value);
        Op::Constant(index(found.unwrap_or_else(|| {
            constants.push(value);
            constants.len() - 1
        })))
    }
}

/// Compiles a whole program. The top-level statements become a function named `script`.
pub fn compile(program: &[Stmt]) -> Program {
    let script = FunctionState {
        name: "script".to_string(),
        arity: 0,
        chunk: Chunk::default(),
        upvalues: Vec::new(),
        locals: Vec::new(),
        scope_depth: 0,
    };
    let mut compiler = Compiler {
        states: vec![script],
        global_names: Vec::new(),
        pos: Pos { line: 1, column: 1 },
    };
    for statement in program {
        compiler.statement(statement);
    }
    let script = Rc::new(compiler.finish_function());
    Program {
        script,
        global_names: compiler.global_names,
    }
}
