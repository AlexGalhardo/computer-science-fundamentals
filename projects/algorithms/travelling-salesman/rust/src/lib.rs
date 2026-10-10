//! EN: The travelling salesman solvers in Rust: brute force, Held-Karp, nearest neighbour and
//!     2-opt. Same algorithms and same decisions as the TypeScript reference in `ts/src/`, where
//!     each one is explained in detail. What changes here is the constant factor: compiled code
//!     over flat vectors pushes the wall of brute force one city further, and no further. A
//!     faster language buys one more city, a better algorithm buys ten.
//! PT: Os resolvedores do caixeiro-viajante em Rust: força bruta, Held-Karp, vizinho mais
//!     próximo e 2-opt. Mesmos algoritmos e mesmas decisões da referência em TypeScript em
//!     `ts/src/`, onde cada um é explicado em detalhe. O que muda aqui é o fator constante:
//!     código compilado sobre vetores planos empurra o muro da força bruta uma cidade adiante,
//!     e só. Uma linguagem mais rápida compra uma cidade a mais, um algoritmo melhor compra dez.
//! ES: Los solucionadores del viajante de comercio en Rust: fuerza bruta, Held-Karp, vecino más
//!     cercano y 2-opt. Mismos algoritmos y mismas decisiones que la referencia en TypeScript en
//!     `ts/src/`, donde cada uno se explica en detalle. Lo que cambia aquí es el factor constante:
//!     código compilado sobre vectores planos empuja el muro de la fuerza bruta una ciudad más
//!     allá, y nada más. Un lenguaje más rápido compra una ciudad más, un algoritmo mejor
//!     compra diez.

use std::time::{Duration, Instant};

pub const GRID: u64 = 1000;
pub const HELD_KARP_MAX_CITIES: usize = 22;

/// Square matrix of integer distances, stored row by row in one vector.
pub struct Instance {
    pub n: usize,
    dist: Vec<i32>,
}

/// Visiting order starting at city 0 (the return to city 0 is implied) and its length.
#[derive(Debug, PartialEq, Eq)]
pub struct Solution {
    pub tour: Vec<usize>,
    pub length: i32,
}

impl Instance {
    // EN: Same Lehmer generator and same rounding as the TypeScript side, so both languages
    //     build the same cities and the same integer distances from the same seed.
    // PT: Mesmo gerador de Lehmer e mesmo arredondamento do lado TypeScript, então as duas
    //     linguagens montam as mesmas cidades e as mesmas distâncias inteiras da mesma semente.
    // ES: Mismo generador de Lehmer y mismo redondeo que el lado TypeScript, así los dos
    //     lenguajes construyen las mismas ciudades y las mismas distancias enteras con la
    //     misma semilla.
    pub fn random(n: usize, seed: u64) -> Self {
        let mut state = (seed * 1000 + n as u64) % 2_147_483_646 + 1;
        let mut next = || {
            state = state * 48_271 % 2_147_483_647;
            state
        };
        let cities: Vec<(f64, f64)> = (0..n)
            .map(|_| {
                let x = next() % GRID;
                let y = next() % GRID;
                (x as f64, y as f64)
            })
            .collect();
        Self::from_points(&cities)
    }

    pub fn from_points(cities: &[(f64, f64)]) -> Self {
        let n = cities.len();
        let mut dist = Vec::with_capacity(n * n);
        for a in cities {
            for b in cities {
                dist.push((a.0 - b.0).hypot(a.1 - b.1).round() as i32);
            }
        }
        Self { n, dist }
    }

    #[inline]
    pub fn d(&self, from: usize, to: usize) -> i32 {
        self.dist[from * self.n + to]
    }

    pub fn tour_length(&self, tour: &[usize]) -> i32 {
        (0..tour.len())
            .map(|i| self.d(tour[i], tour[(i + 1) % tour.len()]))
            .sum()
    }

    // EN: A tour is valid when it starts at city 0 and visits every city exactly once.
    // PT: Um passeio é válido quando começa na cidade 0 e visita cada cidade exatamente uma vez.
    // ES: Un recorrido es válido cuando empieza en la ciudad 0 y visita cada ciudad
    //     exactamente una vez.
    pub fn is_valid_tour(&self, tour: &[usize]) -> bool {
        let mut seen = vec![false; self.n];
        tour.len() == self.n
            && (self.n == 0 || tour[0] == 0)
            && tour
                .iter()
                .all(|&city| city < self.n && !std::mem::replace(&mut seen[city], true))
    }
}

struct Search<'a> {
    instance: &'a Instance,
    current: Vec<usize>,
    best: i32,
    best_tour: Vec<usize>,
    leaves: u64,
    deadline: Option<Instant>,
    timed_out: bool,
}

impl Search<'_> {
    // EN: Positions 0..depth-1 are fixed. Each remaining city takes position `depth` in turn
    //     (swap in, recurse, swap back). There is no pruning on purpose: (n - 1)! orders.
    // PT: As posições 0..depth-1 estão fixas. Cada cidade restante ocupa a posição `depth` por
    //     vez (troca, recursão, destroca). Não há poda de propósito: (n - 1)! ordens.
    // ES: Las posiciones 0..depth-1 están fijas. Cada ciudad restante ocupa la posición `depth`
    //     por turno (intercambia, recursión, deshace). No hay poda a propósito: (n - 1)! órdenes.
    fn permute(&mut self, depth: usize, length: i32) {
        if self.timed_out {
            return;
        }
        let n = self.instance.n;
        let last = self.current[depth - 1];
        if depth == n {
            let total = length + self.instance.d(last, 0);
            if total < self.best {
                self.best = total;
                self.best_tour.clone_from(&self.current);
            }
            // EN: Reading the clock is slow, so it is checked once every 2^20 complete tours.
            // PT: Ler o relógio é lento, então ele é conferido uma vez a cada 2^20 passeios.
            // ES: Leer el reloj es lento, así que se comprueba una vez cada 2^20 recorridos.
            self.leaves += 1;
            if self.leaves & 0xf_ffff == 0 && self.deadline.is_some_and(|d| Instant::now() > d) {
                self.timed_out = true;
            }
            return;
        }
        for i in depth..n {
            self.current.swap(depth, i);
            let city = self.current[depth];
            self.permute(depth + 1, length + self.instance.d(last, city));
            self.current.swap(depth, i);
        }
    }
}

/// Tries every visiting order. Returns `None` when the optional deadline is reached.
pub fn brute_force(instance: &Instance, deadline: Option<Duration>) -> Option<Solution> {
    let n = instance.n;
    if n == 0 {
        return Some(Solution {
            tour: vec![],
            length: 0,
        });
    }
    let mut search = Search {
        instance,
        current: (0..n).collect(),
        best: i32::MAX,
        best_tour: (0..n).collect(),
        leaves: 0,
        deadline: deadline.map(|limit| Instant::now() + limit),
        timed_out: false,
    };
    search.permute(1, 0);
    if search.timed_out {
        return None;
    }
    Some(Solution {
        tour: search.best_tour,
        length: search.best,
    })
}

// EN: Held-Karp: cost(S, j) is the shortest path that starts at city 0, visits exactly the set
//     S and ends at j. A set is a bit mask over cities 1..n-1. Masks are filled in increasing
//     order, because removing a city always gives a smaller mask. O(n² · 2^n) time and
//     O(n · 2^n) memory.
// PT: Held-Karp: cost(S, j) é o menor caminho que parte da cidade 0, visita exatamente o
//     conjunto S e termina em j. Um conjunto é uma máscara de bits sobre as cidades 1..n-1. As
//     máscaras são preenchidas em ordem crescente, porque remover uma cidade sempre dá uma
//     máscara menor. Tempo O(n² · 2^n) e memória O(n · 2^n).
// ES: Held-Karp: cost(S, j) es el camino más corto que parte de la ciudad 0, visita exactamente el
//     conjunto S y termina en j. Un conjunto es una máscara de bits sobre las ciudades 1..n-1. Las
//     máscaras se llenan en orden creciente, porque quitar una ciudad siempre da una
//     máscara menor. Tiempo O(n² · 2^n) y memoria O(n · 2^n).
pub fn held_karp(instance: &Instance) -> Solution {
    let n = instance.n;
    if n < 2 {
        return Solution {
            tour: (0..n).collect(),
            length: 0,
        };
    }
    assert!(
        n <= HELD_KARP_MAX_CITIES,
        "Held-Karp needs O(n * 2^n) memory: at most {HELD_KARP_MAX_CITIES} cities"
    );
    const UNREACHED: i32 = i32::MAX;
    let m = n - 1;
    let full = (1usize << m) - 1;
    let mut cost = vec![UNREACHED; (full + 1) * m];
    let mut parent = vec![-1i8; (full + 1) * m];

    for j in 0..m {
        cost[(1 << j) * m + j] = instance.d(0, j + 1);
    }
    for mask in 1..=full {
        for j in 0..m {
            if mask & (1 << j) == 0 {
                continue;
            }
            let previous = mask ^ (1 << j);
            if previous == 0 {
                continue;
            }
            let mut best = UNREACHED;
            let mut best_k = -1i8;
            for k in 0..m {
                if previous & (1 << k) == 0 {
                    continue;
                }
                let candidate = cost[previous * m + k] + instance.d(k + 1, j + 1);
                if candidate < best {
                    best = candidate;
                    best_k = k as i8;
                }
            }
            cost[mask * m + j] = best;
            parent[mask * m + j] = best_k;
        }
    }

    let mut length = UNREACHED;
    let mut end = -1i8;
    for j in 0..m {
        let candidate = cost[full * m + j] + instance.d(j + 1, 0);
        if candidate < length {
            length = candidate;
            end = j as i8;
        }
    }

    // EN: Walk the parents backwards from the last city to rebuild the tour.
    // PT: Percorre os pais de trás para frente, a partir da última cidade, para remontar o passeio.
    // ES: Recorre los padres hacia atrás, desde la última ciudad, para reconstruir el recorrido.
    let mut tour = Vec::with_capacity(n);
    let mut mask = full;
    while end >= 0 {
        let j = end as usize;
        tour.push(j + 1);
        end = parent[mask * m + j];
        mask ^= 1 << j;
    }
    tour.push(0);
    tour.reverse();
    Solution { tour, length }
}

// EN: Nearest neighbour: always go to the closest city not visited yet. O(n²), a valid tour,
//     no guarantee of quality. The strict `<` keeps the lowest index on a tie.
// PT: Vizinho mais próximo: vai sempre à cidade ainda não visitada mais próxima. O(n²), um
//     passeio válido, sem garantia de qualidade. O `<` estrito mantém o menor índice no empate.
// ES: Vecino más cercano: va siempre a la ciudad aún no visitada más próxima. O(n²), un
//     recorrido válido, sin garantía de calidad. El `<` estricto mantiene el menor índice en
//     el empate.
pub fn nearest_neighbour(instance: &Instance) -> Solution {
    let n = instance.n;
    if n == 0 {
        return Solution {
            tour: vec![],
            length: 0,
        };
    }
    let mut visited = vec![false; n];
    let mut tour = vec![0];
    visited[0] = true;
    for step in 1..n {
        let from = tour[step - 1];
        let mut next: Option<usize> = None;
        for (city, &seen) in visited.iter().enumerate() {
            if !seen && next.is_none_or(|best| instance.d(from, city) < instance.d(from, best)) {
                next = Some(city);
            }
        }
        let city = next.expect("an unvisited city exists while the tour is incomplete");
        visited[city] = true;
        tour.push(city);
    }
    let length = instance.tour_length(&tour);
    Solution { tour, length }
}

// EN: 2-opt: replace the legs a→b and c→e with a→c and b→e, which reverses the stretch between
//     b and c, whenever that shortens the tour. Repeat until no pair of legs improves it. The
//     result is a local optimum. It starts from the nearest-neighbour tour.
// PT: 2-opt: troca os trechos a→b e c→e por a→c e b→e, o que inverte o pedaço entre b e c,
//     sempre que isso encurta o passeio. Repete até nenhum par de trechos melhorar. O resultado
//     é um ótimo local. Parte do passeio do vizinho mais próximo.
// ES: 2-opt: cambia los tramos a→b y c→e por a→c y b→e, lo que invierte el pedazo entre b y c,
//     siempre que eso acorte el recorrido. Repite hasta que ningún par de tramos mejore. El
//     resultado es un óptimo local. Parte del recorrido del vecino más cercano.
pub fn two_opt(instance: &Instance) -> Solution {
    let mut tour = nearest_neighbour(instance).tour;
    let n = tour.len();
    let mut improved = n >= 4;
    while improved {
        improved = false;
        for i in 0..n - 1 {
            for j in i + 2..n {
                if i == 0 && j == n - 1 {
                    continue;
                }
                let (a, b, c, e) = (tour[i], tour[i + 1], tour[j], tour[(j + 1) % n]);
                if instance.d(a, c) + instance.d(b, e) < instance.d(a, b) + instance.d(c, e) {
                    tour[i + 1..=j].reverse();
                    improved = true;
                }
            }
        }
    }
    let length = instance.tour_length(&tour);
    Solution { tour, length }
}

#[cfg(test)]
mod tests {
    use super::*;

    // EN: The documented factors (see the README), the same as in the TypeScript tests.
    // PT: Os fatores documentados (veja o README), os mesmos dos testes em TypeScript.
    // ES: Los factores documentados (mira el README), los mismos de las pruebas en TypeScript.
    const NEAREST_NEIGHBOUR_FACTOR: f64 = 1.6;
    const TWO_OPT_FACTOR: f64 = 1.2;

    #[test]
    fn known_instance() {
        // EN: A square of side 10 with a city in the middle of one edge: the best tour is 40.
        // PT: Um quadrado de lado 10 com uma cidade no meio de uma aresta: o melhor passeio é 40.
        // ES: Un cuadrado de lado 10 con una ciudad en medio de una arista: el mejor recorrido
        //     es 40.
        let square = Instance::from_points(&[
            (0.0, 0.0),
            (5.0, 0.0),
            (10.0, 0.0),
            (10.0, 10.0),
            (0.0, 10.0),
        ]);
        assert_eq!(brute_force(&square, None).unwrap().length, 40);
        assert_eq!(held_karp(&square).length, 40);
    }

    #[test]
    fn brute_force_and_held_karp_agree_up_to_10_cities() {
        for n in 0..=10 {
            let seeds = if n <= 8 { 20 } else { 4 };
            for seed in 1..=seeds {
                let instance = Instance::random(n, seed);
                let brute = brute_force(&instance, None).unwrap();
                let dp = held_karp(&instance);
                assert_eq!(brute.length, dp.length, "n={n} seed={seed}");
                assert!(instance.is_valid_tour(&brute.tour));
                assert!(instance.is_valid_tour(&dp.tour));
                assert_eq!(instance.tour_length(&brute.tour), brute.length);
                assert_eq!(instance.tour_length(&dp.tour), dp.length);
            }
        }
    }

    #[test]
    fn brute_force_stops_at_its_deadline() {
        let instance = Instance::random(14, 1);
        assert!(brute_force(&instance, Some(Duration::from_millis(20))).is_none());
    }

    #[test]
    fn heuristics_stay_within_the_documented_factor_up_to_12_cities() {
        for n in 5..=12 {
            for seed in 1..=8 {
                let instance = Instance::random(n, seed);
                let optimum = f64::from(held_karp(&instance).length);
                let greedy = nearest_neighbour(&instance);
                let local = two_opt(&instance);
                assert!(instance.is_valid_tour(&greedy.tour));
                assert!(instance.is_valid_tour(&local.tour));
                assert!(local.length <= greedy.length);
                assert!(f64::from(greedy.length) >= optimum);
                assert!(f64::from(greedy.length) <= optimum * NEAREST_NEIGHBOUR_FACTOR);
                assert!(f64::from(local.length) <= optimum * TWO_OPT_FACTOR);
            }
        }
    }

    // EN: Lengths printed by the TypeScript reference for the same instances (seed 1). Equal
    //     numbers prove that both languages build the same cities and agree on the answers.
    // PT: Comprimentos impressos pela referência em TypeScript para as mesmas instâncias
    //     (semente 1). Números iguais provam que as duas linguagens montam as mesmas cidades e
    //     concordam nas respostas.
    // ES: Longitudes impresas por la referencia en TypeScript para las mismas instancias
    //     (semilla 1). Números iguales prueban que los dos lenguajes construyen las mismas ciudades
    //     y coinciden en las respuestas.
    #[test]
    fn agrees_with_the_typescript_reference() {
        assert_eq!(held_karp(&Instance::random(18, 1)).length, 3108);
        assert_eq!(two_opt(&Instance::random(200, 1)).length, 11209);
        let small = Instance::random(9, 1);
        assert_eq!(
            brute_force(&small, None).unwrap().length,
            held_karp(&small).length
        );
    }
}
