//! Rust implementation of the counter-race mini-project: one shared counter, one buggy way
//! to increment it from several threads and three ways to fix it.

use std::cell::UnsafeCell;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::mpsc::{self, Sender};
use std::sync::{Barrier, Mutex};
use std::thread;

/// Something that many threads can increment through a shared reference.
pub trait Counter: Sync {
    fn inc(&self);
    fn value(&self) -> u64;
}

/// DELIBERATELY WRONG. Do not copy this type: it exists only to show the bug.
///
// EN: Safe Rust refuses to compile a data race. A type shared between threads must be `Sync`,
//     and a plain number that is written through `&self` is not. The two `unsafe` pieces below
//     switch that protection off: we promise the compiler something that is false.
//     A data race is undefined behaviour in Rust, so this program has no guaranteed meaning.
// PT: O Rust seguro se recusa a compilar uma corrida de dados. Um tipo compartilhado entre
//     threads precisa ser `Sync`, e um número comum escrito através de `&self` não é. Os dois
//     trechos `unsafe` abaixo desligam essa proteção: prometemos ao compilador algo falso.
//     Corrida de dados é comportamento indefinido em Rust, então este programa não tem
//     significado garantido.
// ES: El Rust seguro se niega a compilar una carrera de datos. Un tipo compartido entre
//     threads debe ser `Sync`, y un número común escrito a través de `&self` no lo es. Los dos
//     fragmentos `unsafe` de abajo desactivan esa protección: le prometemos al compilador algo
//     falso. Una carrera de datos es comportamiento indefinido en Rust, así que este programa no
//     tiene un significado garantizado.
pub struct BuggyCounter {
    n: UnsafeCell<u64>,
}

// DELIBERATELY WRONG: this `unsafe impl` is a lie. `BuggyCounter` is NOT safe to share.
unsafe impl Sync for BuggyCounter {}

impl BuggyCounter {
    pub fn new() -> Self {
        Self {
            n: UnsafeCell::new(0),
        }
    }
}

impl Default for BuggyCounter {
    fn default() -> Self {
        Self::new()
    }
}

impl Counter for BuggyCounter {
    fn inc(&self) {
        // DELIBERATELY WRONG: read, add and write with nothing protecting the three steps.
        // EN: `read_volatile` and `write_volatile` force a real load and a real store on every
        //     call. Without them the optimiser may merge the whole loop into one addition,
        //     which would hide the bug by luck instead of fixing it.
        // PT: `read_volatile` e `write_volatile` forçam uma leitura e uma escrita de verdade a
        //     cada chamada. Sem eles o otimizador pode juntar o laço inteiro em uma única soma,
        //     o que esconderia o bug por sorte em vez de corrigi-lo.
        // ES: `read_volatile` y `write_volatile` fuerzan una lectura y una escritura de verdad en
        //     cada llamada. Sin ellos el optimizador puede juntar el bucle entero en una sola suma,
        //     lo que escondería el bug por suerte en lugar de corregirlo.
        unsafe {
            let pointer = self.n.get();
            let current = pointer.read_volatile();
            pointer.write_volatile(current + 1);
        }
    }

    fn value(&self) -> u64 {
        unsafe { self.n.get().read_volatile() }
    }
}

/// Fix 1: mutual exclusion.
///
// EN: In Rust the mutex owns the data. The only way to reach the number is to lock, and the
//     guard returned by `lock` unlocks when it goes out of scope. Forgetting to lock is a
//     compile error, not a bug found in production.
// PT: Em Rust o mutex é dono do dado. O único jeito de chegar ao número é travar, e a guarda
//     devolvida por `lock` destrava ao sair de escopo. Esquecer de travar é erro de compilação,
//     não um bug achado em produção.
// ES: En Rust el mutex es dueño del dato. La única forma de llegar al número es bloquear, y la
//     guarda devuelta por `lock` desbloquea al salir de ámbito. Olvidar bloquear es un error de
//     compilación, no un bug encontrado en producción.
#[derive(Default)]
pub struct MutexCounter {
    n: Mutex<u64>,
}

impl Counter for MutexCounter {
    fn inc(&self) {
        *self
            .n
            .lock()
            .expect("no thread panics while holding the lock") += 1;
    }

    fn value(&self) -> u64 {
        *self
            .n
            .lock()
            .expect("no thread panics while holding the lock")
    }
}

/// Fix 2: an atomic operation.
///
// EN: `fetch_add` reads, adds and writes as one indivisible processor step. `Relaxed` is
//     enough here: we only need each addition to be atomic, and the final read happens after
//     every thread was joined, which already orders it after all the additions.
// PT: `fetch_add` lê, soma e grava como um passo indivisível do processador. `Relaxed` basta
//     aqui: só precisamos que cada soma seja atômica, e a leitura final acontece depois do
//     join de todas as threads, o que já a coloca depois de todas as somas.
// ES: `fetch_add` lee, suma y escribe como un paso indivisible del procesador. `Relaxed` basta
//     aquí: solo necesitamos que cada suma sea atómica, y la lectura final ocurre después del
//     join de todos los threads, lo que ya la coloca después de todas las sumas.
#[derive(Default)]
pub struct AtomicCounter {
    n: AtomicU64,
}

impl Counter for AtomicCounter {
    fn inc(&self) {
        self.n.fetch_add(1, Ordering::Relaxed);
    }

    fn value(&self) -> u64 {
        self.n.load(Ordering::Relaxed)
    }
}

enum Message {
    Inc,
    Get(Sender<u64>),
}

/// Fix 3: message passing.
///
// EN: One thread owns the number and nobody else can touch it. The other threads send
//     messages through a channel, and the owner handles them one at a time, in order.
//     Nothing is shared, so there is nothing to race on.
// PT: Uma thread é dona do número e ninguém mais consegue tocá-lo. As outras threads mandam
//     mensagens por um canal, e a dona as trata uma por vez, em ordem.
//     Nada é compartilhado, então não há sobre o que disputar.
// ES: Un thread es dueño del número y nadie más puede tocarlo. Los otros threads envían
//     mensajes por un canal, y el dueño los atiende uno por uno, en orden.
//     Nada se comparte, así que no hay por qué disputar.
pub struct ChannelCounter {
    inbox: Sender<Message>,
}

impl ChannelCounter {
    pub fn new() -> Self {
        let (inbox, messages) = mpsc::channel();
        thread::spawn(move || {
            let mut n: u64 = 0;
            // EN: The loop ends by itself when every sender is dropped.
            // PT: O laço termina sozinho quando todos os remetentes são descartados.
            // ES: El bucle termina solo cuando todos los remitentes se descartan.
            for message in messages {
                match message {
                    Message::Inc => n += 1,
                    Message::Get(reply) => {
                        let _ = reply.send(n);
                    }
                }
            }
        });
        Self { inbox }
    }
}

impl Default for ChannelCounter {
    fn default() -> Self {
        Self::new()
    }
}

impl Counter for ChannelCounter {
    fn inc(&self) {
        self.inbox
            .send(Message::Inc)
            .expect("the owner thread is alive");
    }

    fn value(&self) -> u64 {
        let (reply, answer) = mpsc::channel();
        self.inbox
            .send(Message::Get(reply))
            .expect("the owner thread is alive");
        answer.recv().expect("the owner thread answers")
    }
}

/// Names of the implementations, in teaching order.
pub const VARIANTS: [&str; 4] = ["buggy", "mutex", "atomic", "channel"];

pub fn new_counter(variant: &str) -> Option<Box<dyn Counter>> {
    match variant {
        "buggy" => Some(Box::new(BuggyCounter::new())),
        "mutex" => Some(Box::new(MutexCounter::default())),
        "atomic" => Some(Box::new(AtomicCounter::default())),
        "channel" => Some(Box::new(ChannelCounter::new())),
        _ => None,
    }
}

/// Increments `per_worker` times from each of `workers` threads and returns the final value.
///
// EN: The barrier is a starting gate: every thread waits there until all of them arrived.
//     Without it the first thread could finish before the last one starts, hiding the bug.
// PT: A barreira é um portão de largada: cada thread espera ali até todas chegarem.
//     Sem ela a primeira thread poderia terminar antes de a última começar, escondendo o bug.
// ES: La barrera es una puerta de salida: cada thread espera ahí hasta que todos lleguen.
//     Sin ella el primer thread podría terminar antes de que el último empiece, escondiendo el bug.
pub fn run(counter: &dyn Counter, workers: usize, per_worker: u64) -> u64 {
    let gate = Barrier::new(workers);
    thread::scope(|scope| {
        for _ in 0..workers {
            scope.spawn(|| {
                gate.wait();
                for _ in 0..per_worker {
                    counter.inc();
                }
            });
        }
    });
    counter.value()
}
