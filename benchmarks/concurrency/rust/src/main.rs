// EN: Concurrency workload in Rust: n tasks wait at a gate, the gate opens, each task sends
//     its number through a channel, and the sum is the checksum.
//     Rust model: async tasks on tokio. An `async` block compiles to a state machine (a
//     stackless coroutine) that stores only what lives across an `.await`. The language has no
//     built-in runtime, so tokio, the usual one, provides it: a pool of OS threads, one per
//     core, that polls ready tasks and steals work between threads. A parked task costs a
//     small heap allocation, not a stack.
// PT: Carga de concorrência em Rust: n tarefas esperam em um portão, o portão abre, cada tarefa
//     envia seu número por um canal, e a soma é o checksum.
//     Modelo do Rust: tarefas assíncronas no tokio. Um bloco `async` é compilado para uma
//     máquina de estados (uma corrotina sem pilha) que guarda só o que vive através de um
//     `.await`. A linguagem não traz runtime embutido, então o tokio, o usual, fornece: um pool
//     de threads do SO, uma por núcleo, que executa as tarefas prontas e rouba trabalho entre
//     as threads. Uma tarefa parada custa uma pequena alocação no heap, não uma pilha.

use std::time::Instant;
use tokio::sync::{mpsc, watch};

async fn run(n: u64) -> u64 {
    // EN: A watch channel holds one value that every task can observe: here, "is the gate open".
    // PT: Um canal watch guarda um valor que toda tarefa pode observar: aqui, "o portão abriu".
    let (open_gate, gate) = watch::channel(false);
    let (sender, mut mailbox) = mpsc::unbounded_channel::<u64>();

    for id in 0..n {
        let mut gate = gate.clone();
        let sender = sender.clone();
        tokio::spawn(async move {
            if gate.wait_for(|open| *open).await.is_ok() {
                let _ = sender.send(id);
            }
        });
    }
    // EN: Dropping the last sender held here lets the receive loop end when the tasks finish.
    // PT: Soltar o último sender mantido aqui deixa o laço de recebimento acabar quando as
    //     tarefas terminam.
    drop(sender);
    open_gate.send(true).expect("tasks are listening");

    let mut sum = 0;
    while let Some(id) = mailbox.recv().await {
        sum += id;
    }
    sum
}

// EN: VmHWM in /proc/self/status is the peak resident memory, in kibibytes.
// PT: VmHWM em /proc/self/status é o pico de memória residente, em kibibytes.
fn peak_memory_kb() -> u64 {
    std::fs::read_to_string("/proc/self/status")
        .ok()
        .and_then(|status| {
            status
                .lines()
                .find(|line| line.starts_with("VmHWM:"))
                .and_then(|line| line.split_whitespace().nth(1)?.parse().ok())
        })
        .unwrap_or(0)
}

fn main() {
    let args: Vec<String> = std::env::args().collect();
    let implementation = args.get(1).map(String::as_str).unwrap_or("tokio-tasks");
    let n: u64 = args
        .get(2)
        .and_then(|value| value.parse().ok())
        .unwrap_or(1000);

    let start = Instant::now();
    let runtime = tokio::runtime::Builder::new_multi_thread()
        .build()
        .expect("runtime");
    let sum = runtime.block_on(run(n));
    let elapsed_ms = start.elapsed().as_secs_f64() * 1000.0;

    println!(
        "{{\"n\":{n},\"elapsedMs\":{elapsed_ms:.3},\"memoryKb\":{},\"language\":\"rust\",\"implementation\":\"{implementation}\",\"checksum\":\"{sum}\"}}",
        peak_memory_kb()
    );
}
