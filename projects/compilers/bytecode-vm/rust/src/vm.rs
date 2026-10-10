//! The stack virtual machine.

use std::cell::RefCell;
use std::fmt;
use std::io::Write;
use std::rc::Rc;

use crate::ast::Pos;
use crate::chunk::Op;
use crate::compiler::Program;
use crate::value::{Closure, Upvalue, Value};

/// Same limit as the tree-walking interpreter, so both report `stack overflow` at the same depth.
pub const MAX_CALL_DEPTH: usize = 200;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RuntimeError {
    pub message: String,
    pub pos: Pos,
}

impl fmt::Display for RuntimeError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(
            f,
            "[line {}, column {}] runtime error: {}",
            self.pos.line, self.pos.column, self.message
        )
    }
}

// EN: What the machine must remember about a call that is waiting for another one to return:
//     which function it was running, the instruction to continue from, and where its slots start
//     on the value stack. This is the activation record of the language, reduced to three fields.
// PT: O que a máquina precisa lembrar de uma chamada que está esperando outra retornar: qual
//     função ela estava executando, a instrução de onde continuar, e onde suas posições começam
//     na pilha de valores. É o registro de ativação da linguagem, reduzido a três campos.
// ES: Lo que la máquina debe recordar de una llamada que espera que otra retorne: qué función
//     estaba ejecutando, la instrucción desde donde continuar, y dónde empiezan sus posiciones
//     en la pila de valores. Es el registro de activación del lenguaje, reducido a tres campos.
struct Frame {
    closure: Rc<Closure>,
    ip: usize,
    base: usize,
}

pub struct Vm<'out> {
    /// Operands, temporaries, arguments and local variables of every active call.
    stack: Vec<Value>,
    /// One entry per call that is waiting; the running call is kept in local variables of `run`.
    frames: Vec<Frame>,
    /// Global variables by slot number. `None` means "not defined yet".
    globals: Vec<Option<Value>>,
    global_names: Vec<String>,
    /// Captured variables that still live on the stack.
    open_upvalues: Vec<Rc<RefCell<Upvalue>>>,
    output: &'out mut dyn Write,
}

impl<'out> Vm<'out> {
    pub fn new(output: &'out mut dyn Write) -> Self {
        Vm {
            stack: Vec::with_capacity(256),
            frames: Vec::new(),
            globals: Vec::new(),
            global_names: Vec::new(),
            open_upvalues: Vec::new(),
            output,
        }
    }

    #[inline(always)]
    fn pop(&mut self) -> Value {
        self.stack
            .pop()
            .expect("the compiler never pops an empty stack")
    }

    #[inline(always)]
    fn top(&self) -> &Value {
        self.stack
            .last()
            .expect("the compiler never reads an empty stack")
    }

    // EN: Two closures that capture the same variable must share ONE upvalue, otherwise an
    //     assignment made through one would be invisible to the other. So an existing open
    //     upvalue for the slot is reused before a new one is created.
    // PT: Duas closures que capturam a mesma variável precisam compartilhar UM upvalue, senão uma
    //     atribuição feita por uma seria invisível para a outra. Por isso um upvalue aberto que
    //     já exista para a posição é reutilizado antes de se criar um novo.
    // ES: Dos closures que capturan la misma variable deben compartir UN upvalue, o una asignación
    //     hecha por una sería invisible para la otra. Por eso un upvalue abierto que ya exista
    //     para la posición se reutiliza antes de crear uno nuevo.
    fn capture_upvalue(&mut self, slot: usize) -> Rc<RefCell<Upvalue>> {
        let existing = self
            .open_upvalues
            .iter()
            .find(|upvalue| matches!(*upvalue.borrow(), Upvalue::Open(index) if index == slot));
        if let Some(upvalue) = existing {
            return Rc::clone(upvalue);
        }
        let upvalue = Rc::new(RefCell::new(Upvalue::Open(slot)));
        self.open_upvalues.push(Rc::clone(&upvalue));
        upvalue
    }

    // EN: Closing: every captured variable in stack slot `from` or above is about to disappear
    //     (its block ended or its function is returning). Its value is copied into the upvalue,
    //     which from now on owns it. This is how a variable outlives the call that created it
    //     while ordinary locals keep the speed of a plain stack.
    // PT: Fechamento: toda variável capturada na posição `from` da pilha ou acima está prestes a
    //     sumir (seu bloco terminou ou sua função está retornando). Seu valor é copiado para o
    //     upvalue, que a partir de agora é o dono dele. É assim que uma variável sobrevive à
    //     chamada que a criou enquanto os locais comuns mantêm a velocidade de uma pilha simples.
    // ES: Cierre: toda variable capturada en la posición `from` de la pila o por encima está a
    //     punto de desaparecer (su bloque terminó o su función está retornando). Su valor se copia
    //     al upvalue, que desde ahora es su dueño. Así una variable sobrevive a la llamada que la
    //     creó mientras los locales comunes mantienen la velocidad de una pila simple.
    fn close_upvalues(&mut self, from: usize) {
        let stack = &self.stack;
        self.open_upvalues.retain(|upvalue| {
            let slot = match *upvalue.borrow() {
                Upvalue::Open(slot) if slot >= from => slot,
                _ => return true,
            };
            *upvalue.borrow_mut() = Upvalue::Closed(stack[slot].clone());
            false
        });
    }

    #[inline(always)]
    fn number_operands(&mut self, operator: &str, pos: Pos) -> Result<(f64, f64), RuntimeError> {
        let right = self.pop();
        let left = self.pop();
        match (left, right) {
            (Value::Number(left), Value::Number(right)) => Ok((left, right)),
            _ => Err(RuntimeError {
                message: format!("operands of '{operator}' must be numbers"),
                pos,
            }),
        }
    }

    #[inline(always)]
    fn arithmetic(
        &mut self,
        operator: &str,
        pos: Pos,
        compute: impl Fn(f64, f64) -> f64,
    ) -> Result<(), RuntimeError> {
        let (left, right) = self.number_operands(operator, pos)?;
        // Division and remainder by zero are errors of the language, not Infinity or NaN.
        if right == 0.0 && matches!(operator, "/" | "%") {
            return Err(RuntimeError {
                message: "division by zero".to_string(),
                pos,
            });
        }
        self.stack.push(Value::Number(compute(left, right)));
        Ok(())
    }

    #[inline(always)]
    fn comparison(
        &mut self,
        operator: &str,
        pos: Pos,
        compare: impl Fn(&f64, &f64) -> bool,
    ) -> Result<(), RuntimeError> {
        let (left, right) = self.number_operands(operator, pos)?;
        self.stack.push(Value::Bool(compare(&left, &right)));
        Ok(())
    }

    // EN: The heart of the machine: fetch the instruction at `ip`, advance `ip`, execute, repeat.
    //     Compare it with the tree-walking interpreter. There, running `a + b` meant three
    //     recursive calls and two searches by name through a chain of hash tables. Here it is
    //     three steps of this loop over a flat array, and each variable is one indexed read.
    //     The state of the running call (`closure`, `ip`, `base`) is kept in local variables and
    //     saved in a `Frame` only when another function is called.
    // PT: O coração da máquina: busque a instrução em `ip`, avance `ip`, execute, repita. Compare
    //     com o interpretador de árvore. Lá, executar `a + b` significava três chamadas
    //     recursivas e duas buscas por nome em uma cadeia de tabelas hash. Aqui são três passos
    //     deste laço sobre um vetor plano, e cada variável é uma leitura indexada. O estado da
    //     chamada em execução (`closure`, `ip`, `base`) fica em variáveis locais e só é salvo em
    //     um `Frame` quando outra função é chamada.
    // ES: El corazón de la máquina: busca la instrucción en `ip`, avanza `ip`, ejecuta, repite.
    //     Compáralo con el intérprete de árbol. Allí, ejecutar `a + b` significaba tres llamadas
    //     recursivas y dos búsquedas por nombre en una cadena de tablas hash. Aquí son tres pasos
    //     de este bucle sobre un vector plano, y cada variable es una lectura indexada. El estado
    //     de la llamada en ejecución (`closure`, `ip`, `base`) queda en variables locales y solo
    //     se guarda en un `Frame` cuando se llama a otra función.
    pub fn run(&mut self, program: &Program) -> Result<(), RuntimeError> {
        self.global_names.clone_from(&program.global_names);
        self.globals.resize(program.global_names.len(), None);
        let script = Closure {
            function: Rc::clone(&program.script),
            upvalues: Vec::new(),
        };
        let mut closure = Rc::new(script);
        let mut ip = 0;
        let mut base = self.stack.len();

        loop {
            let chunk = &closure.function.chunk;
            let op = chunk.code[ip];
            let pos = chunk.positions[ip];
            ip += 1;
            match op {
                Op::Constant(index) => self.stack.push(chunk.constants[index as usize].clone()),
                Op::Nil => self.stack.push(Value::Nil),
                Op::True => self.stack.push(Value::Bool(true)),
                Op::False => self.stack.push(Value::Bool(false)),
                Op::Pop => {
                    self.pop();
                }

                // EN: A local variable is a slot of the stack, at a fixed distance from the
                //     start of the current call. No name is involved at run time.
                // PT: Uma variável local é uma posição da pilha, a uma distância fixa do início
                //     da chamada atual. Nenhum nome participa durante a execução.
                // ES: Una variable local es una posición de la pila, a una distancia fija del inicio
                //     de la llamada actual. Ningún nombre participa durante la ejecución.
                Op::GetLocal(slot) => self.stack.push(self.stack[base + slot as usize].clone()),
                Op::SetLocal(slot) => self.stack[base + slot as usize] = self.top().clone(),

                Op::GetGlobal(slot) => match &self.globals[slot as usize] {
                    Some(value) => self.stack.push(value.clone()),
                    None => return Err(self.undefined(slot, pos)),
                },
                Op::DefineGlobal(slot) => self.globals[slot as usize] = Some(self.pop()),
                Op::SetGlobal(slot) => {
                    if self.globals[slot as usize].is_none() {
                        return Err(self.undefined(slot, pos));
                    }
                    self.globals[slot as usize] = Some(self.top().clone());
                }

                Op::GetUpvalue(index) => {
                    let value = match &*closure.upvalues[index as usize].borrow() {
                        Upvalue::Open(slot) => self.stack[*slot].clone(),
                        Upvalue::Closed(value) => value.clone(),
                    };
                    self.stack.push(value);
                }
                Op::SetUpvalue(index) => {
                    let value = self.top().clone();
                    match &mut *closure.upvalues[index as usize].borrow_mut() {
                        Upvalue::Open(slot) => self.stack[*slot] = value,
                        Upvalue::Closed(closed) => *closed = value,
                    }
                }
                Op::CloseUpvalue => {
                    self.close_upvalues(self.stack.len() - 1);
                    self.pop();
                }

                Op::Add => {
                    let right = self.pop();
                    let left = self.pop();
                    self.stack.push(match (left, right) {
                        (Value::Number(left), Value::Number(right)) => Value::Number(left + right),
                        (Value::Str(left), Value::Str(right)) => {
                            Value::Str(Rc::from(format!("{left}{right}")))
                        }
                        _ => {
                            let message = "operands of '+' must be two numbers or two strings";
                            return Err(RuntimeError {
                                message: message.to_string(),
                                pos,
                            });
                        }
                    });
                }
                Op::Subtract => self.arithmetic("-", pos, |a, b| a - b)?,
                Op::Multiply => self.arithmetic("*", pos, |a, b| a * b)?,
                Op::Divide => self.arithmetic("/", pos, |a, b| a / b)?,
                Op::Modulo => self.arithmetic("%", pos, |a, b| a % b)?,
                Op::Less => self.comparison("<", pos, f64::lt)?,
                Op::LessEqual => self.comparison("<=", pos, f64::le)?,
                Op::Greater => self.comparison(">", pos, f64::gt)?,
                Op::GreaterEqual => self.comparison(">=", pos, f64::ge)?,
                Op::Negate => match self.pop() {
                    Value::Number(value) => self.stack.push(Value::Number(-value)),
                    _ => {
                        let message = "operand of '-' must be a number".to_string();
                        return Err(RuntimeError { message, pos });
                    }
                },
                Op::Not => {
                    let value = self.pop();
                    self.stack.push(Value::Bool(!value.is_truthy()));
                }
                Op::Equal | Op::NotEqual => {
                    let right = self.pop();
                    let left = self.pop();
                    self.stack
                        .push(Value::Bool((left == right) == (op == Op::Equal)));
                }

                Op::Print => {
                    let value = self.pop();
                    if writeln!(self.output, "{value}").is_err() {
                        return Err(RuntimeError {
                            message: "cannot write the output".into(),
                            pos,
                        });
                    }
                }

                // EN: Control flow is nothing more than assigning to the instruction pointer.
                // PT: Fluxo de controle nada mais é que atribuir ao ponteiro de instrução.
                // ES: El flujo de control no es más que asignar al puntero de instrucción.
                Op::Jump(target) => ip = target as usize,
                Op::JumpIfFalse(target) => {
                    if !self.pop().is_truthy() {
                        ip = target as usize;
                    }
                }
                Op::JumpIfFalseOrPop(target) | Op::JumpIfTrueOrPop(target) => {
                    let jump_when = matches!(op, Op::JumpIfTrueOrPop(_));
                    if self.top().is_truthy() == jump_when {
                        ip = target as usize;
                    } else {
                        self.pop();
                    }
                }

                Op::Closure(index) => {
                    let function = Rc::clone(&chunk.functions[index as usize]);
                    let upvalues = function
                        .upvalues
                        .iter()
                        .map(|reference| {
                            if reference.from_local {
                                self.capture_upvalue(base + reference.index as usize)
                            } else {
                                Rc::clone(&closure.upvalues[reference.index as usize])
                            }
                        })
                        .collect();
                    self.stack
                        .push(Value::Closure(Rc::new(Closure { function, upvalues })));
                }

                // EN: A call does not copy the arguments anywhere. They are already on top of
                //     the stack, in order, so the new call simply declares that its slots start
                //     there: argument 0 is its local 0. The caller's state goes to `frames`.
                // PT: Uma chamada não copia os argumentos para lugar algum. Eles já estão no topo
                //     da pilha, em ordem, então a nova chamada apenas declara que suas posições
                //     começam ali: o argumento 0 é o seu local 0. O estado de quem chamou vai
                //     para `frames`.
                // ES: Una llamada no copia los argumentos a ningún lugar. Ya están en el tope de la
                //     pila, en orden, así que la nueva llamada solo declara que sus posiciones
                //     empiezan ahí: el argumento 0 es su local 0. El estado de quien llamó va a
                //     `frames`.
                Op::Call(count) => {
                    let count = count as usize;
                    let callee_slot = self.stack.len() - 1 - count;
                    let Value::Closure(callee) = &self.stack[callee_slot] else {
                        let message = "can only call functions".to_string();
                        return Err(RuntimeError { message, pos });
                    };
                    let callee = Rc::clone(callee);
                    let arity = callee.function.arity;
                    if count != arity {
                        let message = format!("expected {arity} arguments but got {count}");
                        return Err(RuntimeError { message, pos });
                    }
                    if self.frames.len() >= MAX_CALL_DEPTH {
                        return Err(RuntimeError {
                            message: "stack overflow".to_string(),
                            pos,
                        });
                    }
                    let caller = std::mem::replace(&mut closure, callee);
                    self.frames.push(Frame {
                        closure: caller,
                        ip,
                        base,
                    });
                    ip = 0;
                    base = callee_slot + 1;
                }

                // EN: Returning undoes the call: the result is taken from the top, everything
                //     the call put on the stack (its locals, its arguments and the function
                //     value itself) is dropped in one cut, and the result is pushed for the
                //     caller, whose saved state is restored. With no caller left, the program
                //     has ended.
                // PT: Retornar desfaz a chamada: o resultado é retirado do topo, tudo o que a
                //     chamada pôs na pilha (seus locais, seus argumentos e o próprio valor
                //     função) é descartado em um corte só, e o resultado é empilhado para quem
                //     chamou, cujo estado salvo é restaurado. Sem ninguém para quem voltar, o
                //     programa terminou.
                // ES: Retornar deshace la llamada: el resultado se retira del tope, todo lo que la
                //     llamada puso en la pila (sus locales, sus argumentos y el propio valor
                //     función) se descarta de un solo corte, y el resultado se apila para quien
                //     llamó, cuyo estado guardado se restaura. Sin nadie a quien volver, el
                //     programa terminó.
                Op::Return => {
                    let result = self.pop();
                    self.close_upvalues(base);
                    let Some(frame) = self.frames.pop() else {
                        self.stack.truncate(base);
                        return Ok(());
                    };
                    self.stack.truncate(base - 1);
                    self.stack.push(result);
                    closure = frame.closure;
                    ip = frame.ip;
                    base = frame.base;
                }
            }
        }
    }

    fn undefined(&self, slot: u32, pos: Pos) -> RuntimeError {
        let name = &self.global_names[slot as usize];
        RuntimeError {
            message: format!("undefined variable '{name}'"),
            pos,
        }
    }
}
