//! EN: The same allocators as cpp/allocator.hpp, in Rust.
//!
//! The algorithms are identical, and the benchmark prints the same table. What changes is the
//! vocabulary: the abstract class becomes a trait, `std::optional` becomes `Option`, and a
//! failed release is a `bool` the compiler asks you to look at (`#[must_use]`). The arena is
//! simulated in both languages: an allocation is an offset and a size, no real byte is touched.
//!
//! PT: Os mesmos alocadores de cpp/allocator.hpp, em Rust.
//!
//! Os algoritmos são idênticos, e o benchmark imprime a mesma tabela. O que muda é o
//! vocabulário: a classe abstrata vira um trait, `std::optional` vira `Option`, e uma liberação
//! que falha é um `bool` que o compilador pede para você olhar (`#[must_use]`). A arena é
//! simulada nas duas linguagens: uma alocação é um deslocamento e um tamanho, e nenhum byte
//! real é tocado.

use std::collections::{BTreeMap, BTreeSet};

#[derive(Debug, Default, Clone, Copy, PartialEq, Eq)]
pub struct Stats {
    pub arena: usize,
    /// Bytes reserved by live blocks (what the allocator handed out).
    pub used: usize,
    /// Bytes the callers actually asked for.
    pub requested: usize,
    pub largest_free: usize,
    pub free_blocks: usize,
    pub live_blocks: usize,
}

impl Stats {
    pub fn free_bytes(&self) -> usize {
        self.arena - self.used
    }

    /// EN: External fragmentation: the share of the free memory that is NOT in the largest
    /// hole. 0 means one free block, and a value near 1 means many small holes.
    ///
    /// PT: Fragmentação externa: a parte da memória livre que NÃO está na maior lacuna. 0
    /// significa um bloco livre só, e um valor perto de 1 significa muitas lacunas pequenas.
    pub fn external_fragmentation(&self) -> f64 {
        let free = self.free_bytes();
        if free == 0 {
            0.0
        } else {
            1.0 - self.largest_free as f64 / free as f64
        }
    }

    /// EN: Internal fragmentation: bytes reserved inside blocks that nobody asked for.
    ///
    /// PT: Fragmentação interna: bytes reservados dentro dos blocos que ninguém pediu.
    pub fn internal_fragmentation(&self) -> usize {
        self.used - self.requested
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct LiveBlock {
    pub offset: usize,
    pub size: usize,
}

pub trait Allocator {
    fn name(&self) -> &'static str;
    /// Returns the offset of the new block, or `None` when no free block is large enough.
    fn allocate(&mut self, size: usize) -> Option<usize>;
    /// Returns false when `offset` is not the start of a live block.
    #[must_use]
    fn release(&mut self, offset: usize) -> bool;
    fn stats(&self) -> Stats;
    fn live_blocks(&self) -> Vec<LiveBlock>;
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Fit {
    First,
    Best,
    Worst,
}

#[derive(Debug, Clone, Copy)]
struct Block {
    offset: usize,
    size: usize,
    requested: usize,
    free: bool,
}

/// EN: Free-list allocator: blocks in address order, each free or in use. First fit takes the
/// first hole that is large enough, best fit the smallest one, worst fit the largest one.
///
/// PT: Alocador de lista livre: blocos em ordem de endereço, cada um livre ou em uso. O first
/// fit pega a primeira lacuna grande o bastante, o best fit a menor, o worst fit a maior.
pub struct ListAllocator {
    arena: usize,
    fit: Fit,
    blocks: Vec<Block>,
}

impl ListAllocator {
    /// # Panics
    /// Panics when `arena` is zero.
    pub fn new(arena: usize, fit: Fit) -> Self {
        assert!(arena > 0, "the arena must not be empty");
        ListAllocator {
            arena,
            fit,
            blocks: vec![Block {
                offset: 0,
                size: arena,
                requested: 0,
                free: true,
            }],
        }
    }
}

impl Allocator for ListAllocator {
    fn name(&self) -> &'static str {
        match self.fit {
            Fit::First => "first-fit",
            Fit::Best => "best-fit",
            Fit::Worst => "worst-fit",
        }
    }

    fn allocate(&mut self, size: usize) -> Option<usize> {
        if size == 0 {
            return None;
        }
        let mut chosen: Option<usize> = None;
        for (index, block) in self.blocks.iter().enumerate() {
            if !block.free || block.size < size {
                continue;
            }
            match chosen {
                None => {
                    chosen = Some(index);
                    if self.fit == Fit::First {
                        break;
                    }
                }
                Some(current) => {
                    let better = match self.fit {
                        Fit::First => false,
                        Fit::Best => block.size < self.blocks[current].size,
                        Fit::Worst => block.size > self.blocks[current].size,
                    };
                    if better {
                        chosen = Some(index);
                    }
                }
            }
        }
        let index = chosen?;
        // EN: Split the hole: the first part becomes the new block and the rest, if any, stays
        //     in the list as a smaller hole right after it.
        // PT: Divide a lacuna: a primeira parte vira o bloco novo, e o resto, se houver, fica na
        //     lista como uma lacuna menor logo depois dele.
        let offset = self.blocks[index].offset;
        let leftover = self.blocks[index].size - size;
        self.blocks[index] = Block {
            offset,
            size,
            requested: size,
            free: false,
        };
        if leftover > 0 {
            self.blocks.insert(
                index + 1,
                Block {
                    offset: offset + size,
                    size: leftover,
                    requested: 0,
                    free: true,
                },
            );
        }
        Some(offset)
    }

    fn release(&mut self, offset: usize) -> bool {
        let Ok(mut index) = self
            .blocks
            .binary_search_by_key(&offset, |block| block.offset)
        else {
            return false;
        };
        if self.blocks[index].free {
            return false;
        }
        self.blocks[index].free = true;
        self.blocks[index].requested = 0;
        // EN: Coalescing: merge with a free neighbour on either side, so that adjacent holes
        //     become one hole that can serve a large request again.
        // PT: Coalescência: funde com um vizinho livre de cada lado, para que lacunas vizinhas
        //     virem uma lacuna só, capaz de atender de novo a um pedido grande.
        if index + 1 < self.blocks.len() && self.blocks[index + 1].free {
            self.blocks[index].size += self.blocks[index + 1].size;
            self.blocks.remove(index + 1);
        }
        if index > 0 && self.blocks[index - 1].free {
            self.blocks[index - 1].size += self.blocks[index].size;
            self.blocks.remove(index);
            index -= 1;
        }
        debug_assert!(self.blocks[index].free);
        true
    }

    fn stats(&self) -> Stats {
        let mut stats = Stats {
            arena: self.arena,
            ..Stats::default()
        };
        for block in &self.blocks {
            if block.free {
                stats.free_blocks += 1;
                stats.largest_free = stats.largest_free.max(block.size);
            } else {
                stats.live_blocks += 1;
                stats.used += block.size;
                stats.requested += block.requested;
            }
        }
        stats
    }

    fn live_blocks(&self) -> Vec<LiveBlock> {
        self.blocks
            .iter()
            .filter(|block| !block.free)
            .map(|block| LiveBlock {
                offset: block.offset,
                size: block.size,
            })
            .collect()
    }
}

/// EN: Buddy system: every block is a power of two. A request is rounded up, larger blocks are
/// split in halves, and a freed block merges with its buddy, found at `offset XOR size`.
/// Fast splitting and merging are paid for with internal fragmentation.
///
/// PT: Sistema buddy: todo bloco é uma potência de dois. O pedido é arredondado para cima,
/// blocos maiores são divididos em metades, e um bloco liberado se funde com seu companheiro,
/// que fica em `deslocamento XOR tamanho`. A divisão e a fusão rápidas são pagas com
/// fragmentação interna.
pub struct BuddyAllocator {
    arena: usize,
    min_order: u32,
    max_order: u32,
    /// `free[k]` holds the offsets of the free blocks of size 2^k, in address order.
    free: Vec<BTreeSet<usize>>,
    /// offset -> (order, requested bytes)
    live: BTreeMap<usize, (u32, usize)>,
}

impl BuddyAllocator {
    /// # Panics
    /// Panics when `arena` or `min_block` is not a power of two, or `min_block > arena`.
    pub fn new(arena: usize, min_block: usize) -> Self {
        assert!(
            arena.is_power_of_two() && min_block.is_power_of_two() && min_block <= arena,
            "arena and min_block must be powers of two"
        );
        let max_order = arena.trailing_zeros();
        let mut free = vec![BTreeSet::new(); max_order as usize + 1];
        free[max_order as usize].insert(0);
        BuddyAllocator {
            arena,
            min_order: min_block.trailing_zeros(),
            max_order,
            free,
            live: BTreeMap::new(),
        }
    }
}

impl Allocator for BuddyAllocator {
    fn name(&self) -> &'static str {
        "buddy"
    }

    fn allocate(&mut self, size: usize) -> Option<usize> {
        if size == 0 || size > self.arena {
            return None;
        }
        let wanted = self
            .min_order
            .max(size.next_power_of_two().trailing_zeros());
        let mut order = (wanted..=self.max_order).find(|&k| !self.free[k as usize].is_empty())?;
        let offset = self.free[order as usize].pop_first()?;
        // EN: Split down to the wanted size, leaving the upper half (the buddy) free each time.
        // PT: Divide até o tamanho desejado, deixando a metade de cima (o companheiro) livre a
        //     cada vez.
        while order > wanted {
            order -= 1;
            self.free[order as usize].insert(offset + (1 << order));
        }
        self.live.insert(offset, (wanted, size));
        Some(offset)
    }

    fn release(&mut self, offset: usize) -> bool {
        let Some((mut order, _)) = self.live.remove(&offset) else {
            return false;
        };
        let mut offset = offset;
        // EN: Coalescing: while the buddy is free, take it off its list and merge upwards.
        // PT: Coalescência: enquanto o companheiro está livre, ele sai da lista e a fusão sobe.
        while order < self.max_order {
            let buddy = offset ^ (1 << order);
            if !self.free[order as usize].remove(&buddy) {
                break;
            }
            offset = offset.min(buddy);
            order += 1;
        }
        self.free[order as usize].insert(offset);
        true
    }

    fn stats(&self) -> Stats {
        let mut stats = Stats {
            arena: self.arena,
            live_blocks: self.live.len(),
            ..Stats::default()
        };
        for &(order, requested) in self.live.values() {
            stats.used += 1 << order;
            stats.requested += requested;
        }
        for order in self.min_order..=self.max_order {
            let blocks = self.free[order as usize].len();
            stats.free_blocks += blocks;
            if blocks > 0 {
                stats.largest_free = 1 << order;
            }
        }
        stats
    }

    fn live_blocks(&self) -> Vec<LiveBlock> {
        self.live
            .iter()
            .map(|(&offset, &(order, _))| LiveBlock {
                offset,
                size: 1 << order,
            })
            .collect()
    }
}

/// EN: Linear congruential generator, identical to the C++ one, so both languages run the
/// same sequence of requests.
///
/// PT: Gerador congruente linear, idêntico ao do C++, para que as duas linguagens executem a
/// mesma sequência de pedidos.
pub struct Lcg {
    state: u32,
}

impl Lcg {
    pub fn new(seed: u32) -> Self {
        Lcg { state: seed }
    }

    pub fn next_value(&mut self) -> u32 {
        self.state = self
            .state
            .wrapping_mul(1_664_525)
            .wrapping_add(1_013_904_223);
        self.state >> 16
    }

    pub fn between(&mut self, low: usize, high: usize) -> usize {
        low + self.next_value() as usize % (high - low + 1)
    }
}

pub struct Workload {
    pub name: &'static str,
    pub arena: usize,
    pub steps: usize,
    pub seed: u32,
}

pub const MIN_BUDDY_BLOCK: usize = 16;

pub const WORKLOADS: [Workload; 2] = [
    Workload {
        name: "mixed",
        arena: 1 << 20,
        steps: 20000,
        seed: 2026,
    },
    Workload {
        name: "small",
        arena: 1 << 16,
        steps: 20000,
        seed: 2026,
    },
];

pub struct WorkloadResult {
    pub strategy: &'static str,
    pub attempts: usize,
    pub failures: usize,
    pub peak_used: usize,
    pub external_fragmentation: f64,
    pub internal_fragmentation: f64,
}

fn pick_size(workload: &str, random: &mut Lcg) -> usize {
    if workload == "small" {
        return random.between(8, 256);
    }
    let dice = random.between(1, 100);
    if dice <= 70 {
        random.between(16, 512)
    } else if dice <= 95 {
        random.between(513, 8192)
    } else {
        random.between(8193, 65536)
    }
}

pub fn make_allocators(arena: usize) -> Vec<Box<dyn Allocator>> {
    vec![
        Box::new(ListAllocator::new(arena, Fit::First)),
        Box::new(ListAllocator::new(arena, Fit::Best)),
        Box::new(ListAllocator::new(arena, Fit::Worst)),
        Box::new(BuddyAllocator::new(arena, MIN_BUDDY_BLOCK)),
    ]
}

/// EN: The benchmark: at every step allocate a random size (55% of the time) or free a random
/// live block. The arena fills up, and from then on requests fail when no hole is large enough.
///
/// PT: O benchmark: a cada passo, aloca um tamanho aleatório (55% das vezes) ou libera um bloco
/// vivo aleatório. A arena enche, e daí em diante os pedidos falham quando nenhuma lacuna é
/// grande o bastante.
pub fn run_workload(allocator: &mut dyn Allocator, workload: &Workload) -> WorkloadResult {
    let mut random = Lcg::new(workload.seed);
    let mut live: Vec<usize> = Vec::new();
    let mut result = WorkloadResult {
        strategy: allocator.name(),
        attempts: 0,
        failures: 0,
        peak_used: 0,
        external_fragmentation: 0.0,
        internal_fragmentation: 0.0,
    };
    let mut external = 0.0;
    let mut internal = 0.0;
    for _ in 0..workload.steps {
        if live.is_empty() || random.between(1, 100) <= 55 {
            let size = pick_size(workload.name, &mut random);
            result.attempts += 1;
            match allocator.allocate(size) {
                Some(offset) => live.push(offset),
                None => result.failures += 1,
            }
        } else {
            let index = random.next_value() as usize % live.len();
            let offset = live.swap_remove(index);
            let released = allocator.release(offset);
            debug_assert!(released);
        }
        let stats = allocator.stats();
        result.peak_used = result.peak_used.max(stats.used);
        external += stats.external_fragmentation();
        if stats.used > 0 {
            internal += stats.internal_fragmentation() as f64 / stats.used as f64;
        }
    }
    let steps = workload.steps as f64;
    result.external_fragmentation = 100.0 * external / steps;
    result.internal_fragmentation = 100.0 * internal / steps;
    result
}

#[cfg(test)]
mod tests {
    use super::*;

    fn no_overlap(allocator: &dyn Allocator, arena: usize) -> bool {
        let mut live = allocator.live_blocks();
        live.sort_by_key(|block| block.offset);
        let mut cursor = 0;
        for block in live {
            if block.offset < cursor {
                return false;
            }
            cursor = block.offset + block.size;
        }
        cursor <= arena
    }

    /// Holes of 12, 5, 30, 8 and 20 at offsets 0, 13, 19, 50 and 59.
    fn with_holes(fit: Fit) -> ListAllocator {
        let mut allocator = ListAllocator::new(80, fit);
        let mut holes = Vec::new();
        for size in [12, 5, 30, 8, 20] {
            holes.push(allocator.allocate(size).unwrap());
            allocator.allocate(1).unwrap();
        }
        for offset in holes {
            assert!(allocator.release(offset));
        }
        allocator
    }

    #[test]
    fn fit_strategies_choose_the_documented_hole() {
        assert_eq!(with_holes(Fit::First).allocate(7), Some(0));
        assert_eq!(with_holes(Fit::Best).allocate(7), Some(50));
        assert_eq!(with_holes(Fit::Worst).allocate(7), Some(19));
    }

    #[test]
    fn external_fragmentation_blocks_a_request_that_would_fit_in_total() {
        let mut allocator = ListAllocator::new(100, Fit::First);
        let offsets: Vec<usize> = (0..10).map(|_| allocator.allocate(10).unwrap()).collect();
        for offset in offsets.iter().step_by(2) {
            assert!(allocator.release(*offset));
        }
        let stats = allocator.stats();
        assert_eq!(
            (stats.free_bytes(), stats.largest_free, stats.free_blocks),
            (50, 10, 5)
        );
        assert!((stats.external_fragmentation() - 0.8).abs() < 1e-9);
        assert_eq!(allocator.allocate(20), None);
        assert!(!allocator.release(3));
    }

    #[test]
    fn buddy_rounds_up_splits_and_merges() {
        let mut allocator = BuddyAllocator::new(1024, 16);
        assert_eq!(allocator.allocate(70), Some(0));
        let stats = allocator.stats();
        assert_eq!(
            (
                stats.used,
                stats.internal_fragmentation(),
                stats.free_blocks
            ),
            (128, 58, 3)
        );
        assert_eq!(allocator.allocate(100), Some(128));
        assert_eq!(allocator.allocate(1), Some(256));
        for offset in [0, 128, 256] {
            assert!(allocator.release(offset));
        }
        let stats = allocator.stats();
        assert_eq!((stats.free_blocks, stats.largest_free), (1, 1024));
        assert_eq!(allocator.allocate(2000), None);
        assert!(!allocator.release(64));
    }

    // EN: The randomised test of the acceptance criteria: no two live blocks ever overlap, and
    //     freeing everything in random order leaves a single free block.
    // PT: O teste aleatório dos critérios de aceite: dois blocos vivos nunca se sobrepõem, e
    //     liberar tudo em ordem aleatória deixa um único bloco livre.
    #[test]
    fn random_operations_never_overlap_and_everything_coalesces() {
        let arena = 1 << 14;
        for seed in 1..=5 {
            for mut allocator in make_allocators(arena) {
                let mut random = Lcg::new(seed);
                let mut live: Vec<usize> = Vec::new();
                let mut refused = 0;
                for _ in 0..3000 {
                    if live.is_empty() || random.between(1, 100) <= 60 {
                        match allocator.allocate(random.between(1, 700)) {
                            Some(offset) => live.push(offset),
                            None => refused += 1,
                        }
                    } else {
                        let index = random.next_value() as usize % live.len();
                        assert!(allocator.release(live.swap_remove(index)));
                    }
                    assert!(no_overlap(allocator.as_ref(), arena));
                }
                assert!(refused > 0);
                assert_eq!(allocator.stats().live_blocks, live.len());
                while !live.is_empty() {
                    let index = random.next_value() as usize % live.len();
                    assert!(allocator.release(live.swap_remove(index)));
                }
                let stats = allocator.stats();
                assert_eq!(
                    (stats.used, stats.free_blocks, stats.largest_free),
                    (0, 1, arena)
                );
            }
        }
    }

    #[test]
    fn generator_matches_the_cpp_version() {
        let mut random = Lcg::new(1);
        assert_eq!((random.next_value(), random.next_value()), (15496, 24200));
    }

    #[test]
    fn only_the_buddy_system_has_internal_fragmentation() {
        let workload = &WORKLOADS[0];
        let mut first = ListAllocator::new(workload.arena, Fit::First);
        let result = run_workload(&mut first, workload);
        assert!(result.failures > 0);
        assert_eq!(result.internal_fragmentation, 0.0);
        let mut buddy = BuddyAllocator::new(workload.arena, MIN_BUDDY_BLOCK);
        assert!(run_workload(&mut buddy, workload).internal_fragmentation > 0.0);
    }
}
