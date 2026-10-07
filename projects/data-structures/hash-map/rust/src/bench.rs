use std::time::Instant;

use hash_map::{ChainingMap, ProbingMap, Value, mix64};

// EN: Benchmark of lookups at a chosen load factor. The table is created with a fixed capacity
//     of n / load and never resizes, so when the n keys are in, the load factor is exactly the
//     one requested. Only the lookups are timed: n keys that exist and n keys that do not.
//     Missing keys are the expensive case, because the search walks the whole list or run.
// PT: Benchmark de buscas em um fator de carga escolhido. A tabela nasce com capacidade fixa de
//     n / carga e nunca redimensiona, então, com as n chaves dentro, o fator de carga é
//     exatamente o pedido. Só as buscas são cronometradas: n chaves que existem e n que não
//     existem. Chave ausente é o caso caro, pois a busca percorre a lista ou o bloco inteiro.
fn next(state: &mut u64) -> u64 {
    *state ^= *state << 13;
    *state ^= *state >> 7;
    *state ^= *state << 17;
    *state
}

fn run(n: usize, mut put: impl FnMut(u64, Value), get: impl Fn(u64) -> bool) -> (u64, f64) {
    let mut state = 42;
    for i in 0..n {
        put(next(&mut state) << 1, i as Value);
    }
    let (mut present, mut absent, mut hits) = (42, 4242, 0);
    let start = Instant::now();
    for _ in 0..n {
        // EN: Stored keys are even and absent keys are odd, so a miss is guaranteed.
        // PT: As chaves guardadas são pares e as ausentes são ímpares, então a falha é garantida.
        hits += u64::from(get(next(&mut present) << 1));
        hits += u64::from(get((next(&mut absent) << 1) | 1));
    }
    (hits, start.elapsed().as_secs_f64() * 1000.0)
}

// EN: Linux keeps the peak resident memory of a process in /proc/self/status (VmHWM, in kB).
// PT: O Linux guarda o pico de memória residente de um processo em /proc/self/status (VmHWM, em kB).
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
    let implementation = args.get(1).map_or("chaining", String::as_str);
    let n: usize = args
        .get(2)
        .and_then(|value| value.parse().ok())
        .unwrap_or(100_000);
    let load: f64 = args
        .get(3)
        .and_then(|value| value.parse().ok())
        .unwrap_or(0.75);
    let capacity = (n as f64 / load).ceil() as usize;

    let (hits, elapsed_ms) = if implementation == "probing" {
        let map = std::cell::RefCell::new(ProbingMap::new(capacity, 0.99, mix64));
        run(
            n,
            |key, value| {
                map.borrow_mut().put(key, value);
            },
            |key| map.borrow().get(key).is_some(),
        )
    } else {
        // EN: A huge limit turns resizing off, so the lists really reach the requested load.
        // PT: Um limite enorme desliga o redimensionamento, então as listas chegam mesmo à
        //     carga pedida.
        let map = std::cell::RefCell::new(ChainingMap::new(capacity, 1e18, mix64));
        run(
            n,
            |key, value| {
                map.borrow_mut().put(key, value);
            },
            |key| map.borrow().get(key).is_some(),
        )
    };

    println!(
        "{{\"n\":{n},\"elapsedMs\":{elapsed_ms},\"memoryKb\":{},\"language\":\"rust\",\"implementation\":\"{implementation}\",\"checksum\":\"{hits}\"}}",
        peak_memory_kb()
    );
}
