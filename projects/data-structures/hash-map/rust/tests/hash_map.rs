use std::collections::HashMap;

use hash_map::{ChainingMap, HashFn, Key, ProbingMap, Value, mix64};

// EN: A weak hash that sends every key to one of four positions. It makes collisions the rule
//     instead of the exception, so the collision code is what the tests actually exercise.
// PT: Um hash fraco que manda toda chave para uma de quatro posições. Ele faz da colisão a
//     regra em vez da exceção, então o código de colisão é o que os testes realmente exercitam.
fn weak_hash(key: Key) -> u64 {
    key % 4
}

// EN: Small deterministic generator (xorshift). A fixed seed makes a failing run reproducible.
// PT: Gerador determinístico pequeno (xorshift). Uma semente fixa torna uma falha reproduzível.
struct Random(u64);

impl Random {
    fn next(&mut self) -> u64 {
        self.0 ^= self.0 << 13;
        self.0 ^= self.0 >> 7;
        self.0 ^= self.0 << 17;
        self.0
    }
}

// EN: Both maps expose the same operations, so one trait lets a single property test drive
//     the two strategies.
// PT: Os dois mapas expõem as mesmas operações, então um trait deixa um único teste de
//     propriedade exercitar as duas estratégias.
trait Map {
    fn create(hash: HashFn) -> Self;
    fn put(&mut self, key: Key, value: Value) -> bool;
    fn get(&self, key: Key) -> Option<Value>;
    fn remove(&mut self, key: Key) -> bool;
    fn len(&self) -> usize;
}

macro_rules! impl_map {
    ($name:ty) => {
        impl Map for $name {
            fn create(hash: HashFn) -> Self {
                <$name>::new(8, 0.6, hash)
            }
            fn put(&mut self, key: Key, value: Value) -> bool {
                <$name>::put(self, key, value)
            }
            fn get(&self, key: Key) -> Option<Value> {
                <$name>::get(self, key)
            }
            fn remove(&mut self, key: Key) -> bool {
                <$name>::remove(self, key)
            }
            fn len(&self) -> usize {
                <$name>::len(self)
            }
        }
    };
}

impl_map!(ChainingMap);
impl_map!(ProbingMap);

// EN: Property test. Thousands of random operations run on our map and on the standard library
//     map at the same time, and every single answer must match. The property is "our map is
//     indistinguishable from the reference", which covers cases nobody thought of listing.
// PT: Teste de propriedade. Milhares de operações aleatórias rodam no nosso mapa e no mapa da
//     biblioteca padrão ao mesmo tempo, e cada resposta precisa ser igual. A propriedade é
//     "nosso mapa é indistinguível da referência", o que cobre casos que ninguém pensou em listar.
fn property_test<M: Map>(hash: HashFn) {
    for seed in 1..=5 {
        let mut map = M::create(hash);
        let mut reference: HashMap<Key, Value> = HashMap::new();
        let mut random = Random(seed);
        for step in 0..20_000 {
            let key = random.next() % 512;
            let value = (random.next() % 1000) as Value;
            match random.next() % 3 {
                0 => assert_eq!(
                    map.put(key, value),
                    reference.insert(key, value).is_none(),
                    "put, seed {seed}, step {step}"
                ),
                1 => assert_eq!(
                    map.get(key),
                    reference.get(&key).copied(),
                    "get, seed {seed}, step {step}"
                ),
                _ => assert_eq!(
                    map.remove(key),
                    reference.remove(&key).is_some(),
                    "remove, seed {seed}, step {step}"
                ),
            }
            assert_eq!(map.len(), reference.len(), "len, seed {seed}, step {step}");
        }
        for (key, value) in &reference {
            assert_eq!(map.get(*key), Some(*value));
        }
    }
}

#[test]
fn chaining_matches_std_hash_map_with_a_good_hash() {
    property_test::<ChainingMap>(mix64);
}

#[test]
fn chaining_matches_std_hash_map_with_a_weak_hash() {
    property_test::<ChainingMap>(weak_hash);
}

#[test]
fn probing_matches_std_hash_map_with_a_good_hash() {
    property_test::<ProbingMap>(mix64);
}

#[test]
fn probing_matches_std_hash_map_with_a_weak_hash() {
    property_test::<ProbingMap>(weak_hash);
}

#[test]
fn chaining_grows_when_the_load_factor_passes_the_limit() {
    let mut map = ChainingMap::new(8, 0.75, mix64);
    for key in 0..10_000 {
        map.put(key, key as Value * 2);
        assert!(map.load_factor() <= 0.75);
    }
    assert!(map.capacity() > 8);
    for key in 0..10_000 {
        assert_eq!(map.get(key), Some(key as Value * 2));
    }
}

#[test]
fn probing_grows_when_the_load_factor_passes_the_limit() {
    let mut map = ProbingMap::new(8, 0.5, mix64);
    for key in 0..10_000 {
        map.put(key, key as Value * 2);
        assert!(map.load_factor() <= 0.5);
    }
    assert!(map.capacity() > 8);
    for key in 0..10_000 {
        assert_eq!(map.get(key), Some(key as Value * 2));
    }
}

// EN: The three keys below collide under the weak hash (4, 8 and 12 are all 0 modulo 4), so
//     they sit in consecutive slots. Deleting the first one must not hide the others, and a new
//     colliding key must not overwrite or shadow them.
// PT: As três chaves abaixo colidem com o hash fraco (4, 8 e 12 valem 0 módulo 4), então ficam
//     em posições consecutivas. Remover a primeira não pode esconder as outras, e uma nova chave
//     que colide não pode sobrescrevê-las nem escondê-las.
#[test]
fn get_after_delete_then_insert_of_colliding_keys() {
    let mut map = ProbingMap::new(16, 0.9, weak_hash);
    map.put(4, 40);
    map.put(8, 80);
    assert!(map.remove(4));
    assert_eq!(map.tombstones(), 1);
    assert_eq!(map.get(8), Some(80));
    map.put(12, 120);
    assert_eq!(map.tombstones(), 0);
    assert_eq!(map.get(8), Some(80));
    assert_eq!(map.get(12), Some(120));
    assert_eq!(map.get(4), None);
    assert!(!map.put(8, 81));
    assert_eq!(map.len(), 2);
}
