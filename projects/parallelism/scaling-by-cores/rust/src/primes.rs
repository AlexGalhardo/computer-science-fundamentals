//! Prime counting by trial division, sequential and parallel.

use std::ops::Range;
use std::sync::atomic::{AtomicU64, Ordering};
use std::thread;

use crate::schedule::{Schedule, split_static};

/// Numbers handed to a worker at a time by the dynamic schedule.
pub const DYNAMIC_CHUNK: u64 = 10_000;

// EN: The result is a pair of integers. Integer addition is associative and commutative, so
//     the partial results of the workers can be added in any order and grouping and the total
//     is always the same. That is why the parallel answer equals the sequential one exactly.
// PT: O resultado é um par de inteiros. A soma de inteiros é associativa e comutativa, então
//     os resultados parciais dos trabalhadores podem ser somados em qualquer ordem e
//     agrupamento e o total é sempre o mesmo. Por isso a resposta paralela é exatamente igual
//     à sequencial.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub struct PrimeStats {
    pub count: u64,
    pub sum: u64,
}

impl PrimeStats {
    pub fn merge(self, other: Self) -> Self {
        Self {
            count: self.count + other.count,
            sum: self.sum + other.sum,
        }
    }
}

// EN: Trial division by odd numbers up to the square root. It is deliberately simple and
//     CPU-bound, and its cost depends on the value: proving that n is prime takes about
//     sqrt(n) / 2 divisions, while most composites leave after a few. Larger numbers are
//     therefore more expensive, which makes equal blocks of numbers unequal amounts of work.
// PT: Divisão por tentativa por ímpares até a raiz quadrada. É propositalmente simples e
//     limitada por CPU, e o custo depende do valor: provar que n é primo leva cerca de
//     sqrt(n) / 2 divisões, enquanto a maioria dos compostos sai depois de poucas. Números
//     maiores são, portanto, mais caros, o que faz blocos iguais de números serem quantidades
//     desiguais de trabalho.
pub fn is_prime(n: u64) -> bool {
    if n < 2 {
        return false;
    }
    if n < 4 {
        return true;
    }
    if n.is_multiple_of(2) {
        return false;
    }
    let mut divisor = 3;
    while divisor * divisor <= n {
        if n.is_multiple_of(divisor) {
            return false;
        }
        divisor += 2;
    }
    true
}

// EN: The unit of work shared by every version: scan one range and accumulate in a local
//     variable. Nothing here is shared between threads, so this function is the same in the
//     sequential and in the parallel code.
// PT: A unidade de trabalho comum a todas as versões: percorrer um intervalo e acumular em
//     uma variável local. Nada aqui é compartilhado entre threads, então esta função é a mesma
//     no código sequencial e no paralelo.
pub fn count_range(range: Range<u64>) -> PrimeStats {
    let mut stats = PrimeStats::default();
    for n in range {
        if is_prime(n) {
            stats.count += 1;
            stats.sum += n;
        }
    }
    stats
}

/// Counts the primes in `0..=limit` on the calling thread.
pub fn count_sequential(limit: u64) -> PrimeStats {
    count_range(0..limit + 1)
}

/// Counts the primes in `0..=limit` with `workers` threads.
pub fn count_parallel(limit: u64, workers: usize, schedule: Schedule) -> PrimeStats {
    let total = limit + 1;
    let workers = workers.max(1);
    // EN: Fork-join. `thread::scope` forks the workers and joins all of them before it
    //     returns, so the partial results are complete when they are read. Each worker
    //     returns its own partial result: no shared counter is written in the hot loop, which
    //     avoids both a data race and cache-line contention (true or false sharing).
    // PT: Fork-join. O `thread::scope` cria os trabalhadores e espera todos terminarem antes
    //     de retornar, então os resultados parciais estão completos quando são lidos. Cada
    //     trabalhador devolve o seu próprio parcial: nenhum contador compartilhado é escrito
    //     no laço quente, o que evita tanto a corrida de dados quanto a disputa de linha de
    //     cache (compartilhamento verdadeiro ou falso).
    let partials: Vec<PrimeStats> = match schedule {
        Schedule::Static => thread::scope(|scope| {
            let handles: Vec<_> = split_static(total, workers)
                .into_iter()
                .map(|range| scope.spawn(move || count_range(range)))
                .collect();
            handles
                .into_iter()
                .map(|handle| handle.join().expect("worker panicked"))
                .collect()
        }),
        Schedule::Dynamic => {
            // EN: The only shared state is this counter: "the next number nobody took yet".
            //     `fetch_add` is atomic, so two workers can never receive the same chunk.
            //     It is touched once per 10 000 numbers, not once per number, so the cost of
            //     sharing it is diluted.
            // PT: O único estado compartilhado é este contador: "o próximo número que ninguém
            //     pegou ainda". O `fetch_add` é atômico, então dois trabalhadores nunca
            //     recebem o mesmo pedaço. Ele é tocado uma vez a cada 10 000 números, e não a
            //     cada número, então o custo de compartilhá-lo fica diluído.
            let next = AtomicU64::new(0);
            thread::scope(|scope| {
                let handles: Vec<_> = (0..workers)
                    .map(|_| {
                        scope.spawn(|| {
                            let mut local = PrimeStats::default();
                            loop {
                                let start = next.fetch_add(DYNAMIC_CHUNK, Ordering::Relaxed);
                                if start >= total {
                                    break;
                                }
                                let end = (start + DYNAMIC_CHUNK).min(total);
                                local = local.merge(count_range(start..end));
                            }
                            local
                        })
                    })
                    .collect();
                handles
                    .into_iter()
                    .map(|handle| handle.join().expect("worker panicked"))
                    .collect()
            })
        }
    };
    // EN: The reduction: combine one partial result per worker into the final answer.
    // PT: A redução: combinar um resultado parcial por trabalhador na resposta final.
    partials
        .into_iter()
        .fold(PrimeStats::default(), PrimeStats::merge)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn known_values() {
        assert_eq!(
            count_sequential(100),
            PrimeStats {
                count: 25,
                sum: 1060
            }
        );
        assert_eq!(
            count_sequential(100_000),
            PrimeStats {
                count: 9592,
                sum: 454_396_537
            }
        );
    }

    #[test]
    fn small_numbers() {
        let primes: Vec<u64> = (0..20).filter(|&n| is_prime(n)).collect();
        assert_eq!(primes, [2, 3, 5, 7, 11, 13, 17, 19]);
    }

    // EN: The acceptance test of the mini-project: for every worker count and both schedules,
    //     the parallel result is exactly the sequential one. The limits include cases with
    //     fewer numbers than workers and a limit that is not a multiple of the chunk.
    // PT: O teste de aceitação do mini-projeto: para toda quantidade de trabalhadores e para
    //     os dois escalonamentos, o resultado paralelo é exatamente o sequencial. Os limites
    //     incluem casos com menos números que trabalhadores e um limite que não é múltiplo do
    //     pedaço.
    #[test]
    fn parallel_equals_sequential() {
        for limit in [0, 1, 2, 3, 10, 9_999, 10_000, 10_001, 123_457] {
            let expected = count_sequential(limit);
            for workers in [1, 2, 3, 4, 8] {
                for schedule in [Schedule::Static, Schedule::Dynamic] {
                    assert_eq!(
                        count_parallel(limit, workers, schedule),
                        expected,
                        "limit {limit}, {workers} workers, {schedule:?}"
                    );
                }
            }
        }
    }
}
