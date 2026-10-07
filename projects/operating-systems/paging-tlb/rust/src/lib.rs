//! EN: Paging in Rust: page replacement algorithms, a page table and a TLB.
//!
//! The TypeScript version uses one class per algorithm. Here the algorithm is an `enum` and the
//! choice of the victim is a `match`, which the compiler checks for missing cases. Counters are
//! unsigned integers, a missing value is an `Option`, and the trace is borrowed, not copied.
//!
//! PT: Paginação em Rust: algoritmos de substituição de páginas, tabela de páginas e TLB.
//!
//! A versão em TypeScript usa uma classe por algoritmo. Aqui o algoritmo é um `enum` e a escolha
//! da vítima é um `match`, que o compilador confere para casos faltando. Os contadores são
//! inteiros sem sinal, um valor ausente é um `Option`, e o traço é emprestado, não copiado.

use std::collections::{HashMap, VecDeque};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Algorithm {
    Fifo,
    Clock,
    Lru,
    Optimal,
}

impl Algorithm {
    pub const ALL: [Algorithm; 4] = [
        Algorithm::Fifo,
        Algorithm::Clock,
        Algorithm::Lru,
        Algorithm::Optimal,
    ];

    pub fn name(self) -> &'static str {
        match self {
            Algorithm::Fifo => "fifo",
            Algorithm::Clock => "clock",
            Algorithm::Lru => "lru",
            Algorithm::Optimal => "optimal",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Access {
    pub fault: bool,
    /// Frame that holds the page after the access.
    pub frame: usize,
    /// Page that was removed to make room, if any.
    pub evicted: Option<u64>,
}

/// EN: Physical memory: a fixed number of frames and the rule that picks a victim when a page
/// fault finds no free frame.
///
/// PT: Memória física: um número fixo de molduras e a regra que escolhe a vítima quando uma
/// falta de página não encontra moldura livre.
pub struct Memory<'a> {
    algorithm: Algorithm,
    capacity: usize,
    /// `frames[i]` is the page loaded in frame i. Frames are filled in order while free.
    frames: Vec<u64>,
    location: HashMap<u64, usize>,
    /// FIFO and clock: the next frame in the circle.
    hand: usize,
    /// Clock: the referenced bit R of each frame.
    referenced: Vec<bool>,
    /// LRU: a stamp of the last use of each frame.
    last_use: Vec<u64>,
    tick: u64,
    /// Optimal: the whole trace, to look into the future.
    trace: &'a [u64],
    position: usize,
}

impl<'a> Memory<'a> {
    /// `trace` is read only by the optimal algorithm. Pass `&[]` for the others.
    ///
    /// # Panics
    /// Panics when `capacity` is zero.
    pub fn new(algorithm: Algorithm, capacity: usize, trace: &'a [u64]) -> Self {
        assert!(capacity > 0, "the number of frames must be positive");
        Memory {
            algorithm,
            capacity,
            frames: Vec::with_capacity(capacity),
            location: HashMap::new(),
            hand: 0,
            referenced: vec![false; capacity],
            last_use: vec![0; capacity],
            tick: 0,
            trace,
            position: 0,
        }
    }

    pub fn access(&mut self, page: u64) -> Access {
        if self.algorithm == Algorithm::Optimal {
            assert_eq!(
                self.trace.get(self.position),
                Some(&page),
                "optimal replacement must be driven by the trace it was created with"
            );
        }
        let access = match self.location.get(&page) {
            Some(&frame) => {
                self.touch(frame);
                Access {
                    fault: false,
                    frame,
                    evicted: None,
                }
            }
            None if self.frames.len() < self.capacity => {
                let frame = self.frames.len();
                self.frames.push(page);
                self.location.insert(page, frame);
                self.touch(frame);
                Access {
                    fault: true,
                    frame,
                    evicted: None,
                }
            }
            None => {
                let frame = self.victim();
                let evicted = self.frames[frame];
                self.location.remove(&evicted);
                self.frames[frame] = page;
                self.location.insert(page, frame);
                self.touch(frame);
                Access {
                    fault: true,
                    frame,
                    evicted: Some(evicted),
                }
            }
        };
        self.position += 1;
        access
    }

    // EN: Every use of a page, hit or load, sets the referenced bit (for clock) and renews the
    //     stamp (for LRU). FIFO and optimal ignore both.
    // PT: Todo uso de uma página, acerto ou carga, liga o bit de referência (para o relógio) e
    //     renova o carimbo (para o LRU). FIFO e ótimo ignoram os dois.
    fn touch(&mut self, frame: usize) {
        self.tick += 1;
        self.referenced[frame] = true;
        self.last_use[frame] = self.tick;
    }

    fn victim(&mut self) -> usize {
        match self.algorithm {
            // EN: FIFO: the oldest page is the next frame in the circle, used or not.
            // PT: FIFO: a página mais antiga é a próxima moldura do círculo, usada ou não.
            Algorithm::Fifo => {
                let frame = self.hand;
                self.hand = (self.hand + 1) % self.capacity;
                frame
            }
            // EN: Clock: a frame with R = 1 gets a second chance (R is cleared and the hand
            //     moves on). The first frame found with R = 0 is the victim.
            // PT: Relógio: a moldura com R = 1 ganha uma segunda chance (R é zerado e o ponteiro
            //     avança). A primeira moldura encontrada com R = 0 é a vítima.
            Algorithm::Clock => {
                while self.referenced[self.hand] {
                    self.referenced[self.hand] = false;
                    self.hand = (self.hand + 1) % self.capacity;
                }
                let frame = self.hand;
                self.hand = (self.hand + 1) % self.capacity;
                frame
            }
            // EN: LRU: the frame whose last use is the oldest.
            // PT: LRU: a moldura cujo último uso é o mais antigo.
            Algorithm::Lru => {
                let mut oldest = 0;
                for frame in 1..self.capacity {
                    if self.last_use[frame] < self.last_use[oldest] {
                        oldest = frame;
                    }
                }
                oldest
            }
            // EN: Optimal: the page whose next use is farthest away, or that is never used
            //     again. It needs the future, so it only works on a recorded trace.
            // PT: Ótimo: a página cujo próximo uso está mais distante, ou que nunca mais é
            //     usada. Precisa do futuro, então só funciona sobre um traço gravado.
            Algorithm::Optimal => {
                let future = &self.trace[self.position + 1..];
                let mut best = 0;
                let mut best_distance = None;
                for (frame, page) in self.frames.iter().enumerate() {
                    let distance = future
                        .iter()
                        .position(|next| next == page)
                        .unwrap_or(usize::MAX);
                    if best_distance.is_none_or(|current| distance > current) {
                        best = frame;
                        best_distance = Some(distance);
                    }
                }
                best
            }
        }
    }
}

pub fn count_faults(algorithm: Algorithm, trace: &[u64], frames: usize) -> usize {
    let mut memory = Memory::new(algorithm, frames, trace);
    trace
        .iter()
        .filter(|&&page| memory.access(page).fault)
        .count()
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Translation {
    pub physical: u64,
    pub page: u64,
    pub frame: usize,
    pub offset: u64,
    pub tlb_hit: bool,
    pub page_fault: bool,
}

#[derive(Debug, Default, Clone, Copy, PartialEq, Eq)]
pub struct Counters {
    pub accesses: u64,
    pub tlb_hits: u64,
    pub tlb_misses: u64,
    pub page_faults: u64,
}

/// EN: A memory management unit in miniature. The virtual address is split into page number
/// and offset. The translation is looked up in the TLB first, then in the page table, and a
/// page that is not in memory causes a page fault.
///
/// PT: Uma unidade de gerenciamento de memória em miniatura. O endereço virtual se divide em
/// número de página e deslocamento. A tradução é procurada primeiro na TLB, depois na tabela
/// de páginas, e uma página que não está na memória causa uma falta de página.
pub struct Mmu {
    page_size: u64,
    tlb_entries: usize,
    memory: Memory<'static>,
    page_table: HashMap<u64, usize>,
    /// Translations from least to most recently used.
    tlb: VecDeque<(u64, usize)>,
    pub counters: Counters,
}

impl Mmu {
    /// # Panics
    /// Panics when `page_size` is not a power of two, when `tlb_entries` is zero, or when the
    /// optimal algorithm is requested (it needs the future).
    pub fn new(page_size: u64, frames: usize, tlb_entries: usize, algorithm: Algorithm) -> Self {
        assert!(
            page_size.is_power_of_two(),
            "page_size must be a power of two"
        );
        assert!(tlb_entries > 0, "tlb_entries must be positive");
        assert!(
            algorithm != Algorithm::Optimal,
            "the optimal algorithm cannot run online"
        );
        Mmu {
            page_size,
            tlb_entries,
            memory: Memory::new(algorithm, frames, &[]),
            page_table: HashMap::new(),
            tlb: VecDeque::new(),
            counters: Counters::default(),
        }
    }

    pub fn translate(&mut self, virtual_address: u64) -> Translation {
        let page = virtual_address / self.page_size;
        let offset = virtual_address % self.page_size;
        self.counters.accesses += 1;

        let cached = self.tlb.iter().position(|&(entry, _)| entry == page);
        let access = self.memory.access(page);
        let mut page_fault = false;
        match cached {
            Some(index) => {
                self.counters.tlb_hits += 1;
                self.tlb.remove(index);
            }
            None => {
                self.counters.tlb_misses += 1;
                if access.fault {
                    page_fault = true;
                    self.counters.page_faults += 1;
                    if let Some(evicted) = access.evicted {
                        // EN: The evicted page must leave the page table AND the TLB. A stale
                        //     TLB entry would point to a frame that now holds another page.
                        // PT: A página retirada precisa sair da tabela de páginas E da TLB. Uma
                        //     entrada velha na TLB apontaria para uma moldura que agora guarda
                        //     outra página.
                        self.page_table.remove(&evicted);
                        self.tlb.retain(|&(entry, _)| entry != evicted);
                    }
                    self.page_table.insert(page, access.frame);
                }
                if self.tlb.len() >= self.tlb_entries {
                    self.tlb.pop_front();
                }
            }
        }
        let frame = self.page_table[&page];
        self.tlb.push_back((page, frame));
        Translation {
            physical: frame as u64 * self.page_size + offset,
            page,
            frame,
            offset,
            tlb_hit: cached.is_some(),
            page_fault,
        }
    }
}

/// EN: Weighted average of a TLB hit (TLB lookup plus one memory access) and a TLB miss (TLB
/// lookup, one memory access per page table level, then the access itself).
///
/// PT: Média ponderada do acerto na TLB (consulta à TLB mais um acesso à memória) e da falta
/// (consulta à TLB, um acesso à memória por nível da tabela de páginas e depois o acesso em si).
pub fn effective_access_time(hit_ratio: f64, memory_ns: f64, tlb_ns: f64, levels: u32) -> f64 {
    let hit = tlb_ns + memory_ns;
    let miss = tlb_ns + f64::from(levels) * memory_ns + memory_ns;
    hit_ratio * hit + (1.0 - hit_ratio) * miss
}

pub const CLASSIC: [u64; 20] = [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1];
pub const BELADY: [u64; 12] = [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5];

#[cfg(test)]
mod tests {
    use super::*;

    // EN: The expected counts are the ones documented in docs/en/operating-systems/paging-tlb.md.
    // PT: As contagens esperadas são as documentadas em docs/pt/operating-systems/paging-tlb.md.

    #[test]
    fn classic_string_with_three_frames() {
        assert_eq!(count_faults(Algorithm::Fifo, &CLASSIC, 3), 15);
        assert_eq!(count_faults(Algorithm::Clock, &CLASSIC, 3), 14);
        assert_eq!(count_faults(Algorithm::Lru, &CLASSIC, 3), 12);
        assert_eq!(count_faults(Algorithm::Optimal, &CLASSIC, 3), 9);
    }

    #[test]
    fn small_hand_traced_strings() {
        let first = [1, 2, 3, 1, 4, 2, 5, 1, 2, 3];
        assert_eq!(count_faults(Algorithm::Fifo, &first, 3), 8);
        assert_eq!(count_faults(Algorithm::Optimal, &first, 3), 6);
        let second = [4, 1, 4, 2, 3, 4, 1, 2];
        assert_eq!(count_faults(Algorithm::Fifo, &second, 3), 7);
        assert_eq!(count_faults(Algorithm::Lru, &second, 3), 6);
        assert_eq!(count_faults(Algorithm::Optimal, &second, 3), 5);
    }

    #[test]
    fn clock_gives_a_second_chance() {
        let trace = [1, 2, 3, 4, 2, 5, 2];
        assert_eq!(count_faults(Algorithm::Fifo, &trace, 3), 6);
        assert_eq!(count_faults(Algorithm::Clock, &trace, 3), 5);
        let mut memory = Memory::new(Algorithm::Clock, 3, &[]);
        let evicted: Vec<Option<u64>> = trace
            .iter()
            .map(|&page| memory.access(page).evicted)
            .collect();
        assert_eq!(evicted, [None, None, None, Some(1), None, Some(3), None]);
    }

    #[test]
    fn belady_anomaly_fifo_faults_more_with_more_frames() {
        assert_eq!(count_faults(Algorithm::Fifo, &BELADY, 3), 9);
        assert_eq!(count_faults(Algorithm::Fifo, &BELADY, 4), 10);
        // EN: LRU is a stack algorithm: more frames never means more faults.
        // PT: O LRU é um algoritmo de pilha: mais molduras nunca significam mais faltas.
        for frames in 1..6 {
            assert!(
                count_faults(Algorithm::Lru, &BELADY, frames + 1)
                    <= count_faults(Algorithm::Lru, &BELADY, frames)
            );
        }
    }

    #[test]
    fn no_algorithm_beats_optimal() {
        for algorithm in Algorithm::ALL {
            for frames in 1..8 {
                assert!(
                    count_faults(algorithm, &CLASSIC, frames)
                        >= count_faults(Algorithm::Optimal, &CLASSIC, frames)
                );
            }
        }
    }

    #[test]
    fn mmu_reference_trace_counts() {
        let mut mmu = Mmu::new(4096, 3, 2, Algorithm::Lru);
        let results: Vec<Translation> = [0, 1, 0, 2, 0, 3, 1, 0]
            .iter()
            .map(|page| mmu.translate(page * 4096 + 20))
            .collect();
        let hits: Vec<bool> = results.iter().map(|r| r.tlb_hit).collect();
        let faults: Vec<bool> = results.iter().map(|r| r.page_fault).collect();
        assert_eq!(hits, [false, false, true, false, true, false, false, false]);
        assert_eq!(faults, [true, true, false, true, false, true, true, false]);
        assert_eq!(
            mmu.counters,
            Counters {
                accesses: 8,
                tlb_hits: 2,
                tlb_misses: 6,
                page_faults: 5
            }
        );
        assert_eq!((results[5].frame, results[5].physical), (1, 4116));
        assert_eq!((results[7].frame, results[7].physical), (0, 20));
    }

    #[test]
    fn address_translation_and_stale_tlb_entries() {
        let mut mmu = Mmu::new(4096, 8, 4, Algorithm::Fifo);
        for page in [9, 8, 7] {
            mmu.translate(page * 4096);
        }
        let translation = mmu.translate(20500);
        assert_eq!(
            (
                translation.page,
                translation.offset,
                translation.frame,
                translation.physical
            ),
            (5, 20, 3, 12308)
        );

        let mut tiny = Mmu::new(4096, 1, 4, Algorithm::Fifo);
        tiny.translate(0);
        tiny.translate(4096);
        let again = tiny.translate(0);
        assert!(!again.tlb_hit && again.page_fault);
    }

    #[test]
    fn effective_access_time_example() {
        assert!((effective_access_time(0.8, 100.0, 10.0, 1) - 130.0).abs() < 1e-9);
    }

    #[test]
    #[should_panic(expected = "power of two")]
    fn page_size_must_be_a_power_of_two() {
        let _ = Mmu::new(1000, 4, 4, Algorithm::Lru);
    }
}
