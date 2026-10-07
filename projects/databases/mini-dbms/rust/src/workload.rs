use crate::join::Pair;
use crate::table::{Table, Value};

// EN: A linear congruential generator: a tiny pseudo-random number generator. It is written by
//     hand, with the same constants as the Python version, so both languages build exactly the
//     same tables from the same seed and their results can be compared by a checksum.
// PT: Um gerador congruente linear: um gerador de números pseudoaleatórios minúsculo. Ele é
//     escrito à mão, com as mesmas constantes da versão em Python, para que as duas linguagens
//     montem exatamente as mesmas tabelas a partir da mesma semente e seus resultados possam ser
//     comparados por um checksum.
pub struct Lcg(u64);

impl Lcg {
    pub fn new(seed: u64) -> Lcg {
        Lcg(seed)
    }

    pub fn next_below(&mut self, bound: u64) -> u64 {
        self.0 = self
            .0
            .wrapping_mul(6_364_136_223_846_793_005)
            .wrapping_add(1_442_695_040_888_963_407);
        // EN: The high bits of an LCG are more random than the low ones, so the low 33 are dropped.
        // PT: Os bits altos de um LCG são mais aleatórios que os baixos, então os 33 baixos saem.
        (self.0 >> 33) % bound
    }
}

pub const SEED: u64 = 42;
const STEP: u64 = 7919;
const OFFSET: u64 = 13;
const MODULUS: u64 = 1_000_000_007;

// EN: The benchmark workload: R(id, k) and S(k, v), both with n rows. R.k is random in [0, n),
//     so some keys repeat and some never appear. S.k takes each value of [0, n) exactly once, in
//     a scrambled order (i * 7919 + 13 mod n is a permutation because 7919 is prime and does
//     not divide a power of ten). Every row of R therefore matches exactly one row of S, and the
//     join returns n rows. S is scrambled so that sort-merge really has to sort.
// PT: A carga do benchmark: R(id, k) e S(k, v), ambas com n linhas. R.k é aleatório em [0, n),
//     então algumas chaves se repetem e outras nunca aparecem. S.k assume cada valor de [0, n)
//     exatamente uma vez, em ordem embaralhada (i * 7919 + 13 mod n é uma permutação porque 7919
//     é primo e não divide uma potência de dez). Assim cada linha de R casa com exatamente uma
//     linha de S, e a junção devolve n linhas. S é embaralhada para que a junção por ordenação
//     realmente precise ordenar.
pub fn bench_tables(n: usize) -> (Table, Table) {
    let size = n as u64;
    let mut random = Lcg::new(SEED);
    let mut r = Table::new(&["id", "k"]);
    for id in 0..size {
        let key = random.next_below(size);
        r.rows
            .push(vec![Value::Int(id as i64), Value::Int(key as i64)]);
    }
    let mut s = Table::new(&["k", "v"]);
    for position in 0..size {
        let key = (position * STEP + OFFSET) % size;
        let value = random.next_below(1000);
        s.rows
            .push(vec![Value::Int(key as i64), Value::Int(value as i64)]);
    }
    (r, s)
}

// EN: A digest of the join result that does not depend on the order of the pairs: the number of
//     pairs and the sum of R.id * S.v. Two implementations that print the same checksum found
//     the same matches, whatever order they found them in.
// PT: Um resumo do resultado da junção que não depende da ordem dos pares: a quantidade de
//     pares e a soma de R.id * S.v. Duas implementações que imprimem o mesmo checksum acharam os
//     mesmos casamentos, seja qual for a ordem em que os acharam.
pub fn checksum(r: &Table, s: &Table, pairs: &[Pair]) -> String {
    let mut total: u64 = 0;
    for &(i, j) in pairs {
        if let (Value::Int(id), Value::Int(value)) = (&r.rows[i][0], &s.rows[j][1]) {
            total = (total + (*id as u64) * (*value as u64)) % MODULUS;
        }
    }
    format!("{}:{}", pairs.len(), total)
}
