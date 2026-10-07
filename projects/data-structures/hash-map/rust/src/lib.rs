//! Hash map from scratch: separate chaining and open addressing with linear probing.

pub type Key = u64;
pub type Value = i64;
pub type HashFn = fn(Key) -> u64;

// EN: The hash function scrambles the bits of the key so that keys that look alike (1, 2, 3...)
//     land in unrelated positions. This is the finaliser of SplitMix64. The maps receive the
//     function as a parameter, so a test can pass a deliberately bad one and force collisions.
// PT: A função de espalhamento embaralha os bits da chave para que chaves parecidas (1, 2, 3...)
//     caiam em posições sem relação entre si. Este é o finalizador do SplitMix64. Os mapas
//     recebem a função como parâmetro, então um teste pode passar uma função ruim de propósito
//     e forçar colisões.
pub fn mix64(mut x: Key) -> u64 {
    x ^= x >> 30;
    x = x.wrapping_mul(0xbf58_476d_1ce4_e5b9);
    x ^= x >> 27;
    x = x.wrapping_mul(0x94d0_49bb_1331_11eb);
    x ^= x >> 31;
    x
}

struct Node {
    key: Key,
    value: Value,
    next: Option<Box<Node>>,
}

// EN: Separate chaining. The table is an array of buckets and each bucket is a linked list with
//     every entry whose hash points there. A collision only makes one list longer, so the table
//     keeps working at any load factor, it just gets slower as the lists grow.
// PT: Encadeamento separado. A tabela é um vetor de baldes e cada balde é uma lista encadeada
//     com todas as entradas cujo hash aponta para ele. Uma colisão só deixa uma lista mais
//     longa, então a tabela continua funcionando com qualquer fator de carga, apenas fica mais
//     lenta conforme as listas crescem.
pub struct ChainingMap {
    buckets: Vec<Option<Box<Node>>>,
    len: usize,
    max_load: f64,
    hash: HashFn,
}

impl ChainingMap {
    pub fn new(buckets: usize, max_load: f64, hash: HashFn) -> Self {
        Self {
            buckets: (0..buckets.max(1)).map(|_| None).collect(),
            len: 0,
            max_load,
            hash,
        }
    }

    fn index_of(&self, key: Key) -> usize {
        ((self.hash)(key) % self.buckets.len() as u64) as usize
    }

    /// Returns true when the key is new and false when an existing value was replaced.
    pub fn put(&mut self, key: Key, value: Value) -> bool {
        let index = self.index_of(key);
        let mut node = self.buckets[index].as_deref_mut();
        while let Some(current) = node {
            if current.key == key {
                current.value = value;
                return false;
            }
            node = current.next.as_deref_mut();
        }
        // EN: The load factor is elements divided by buckets, which is also the average length
        //     of a list. Growing before it passes the limit keeps the lists short.
        // PT: O fator de carga é elementos dividido por baldes, que também é o tamanho médio de
        //     uma lista. Crescer antes de passar do limite mantém as listas curtas.
        if (self.len + 1) as f64 > self.max_load * self.buckets.len() as f64 {
            self.resize(self.buckets.len() * 2);
        }
        // EN: The new node goes to the head of the list: O(1), no walk to the end. `take`
        //     moves the old head out of the bucket so the new node can own it as its `next`.
        // PT: O nó novo entra no início da lista: O(1), sem caminhar até o fim. `take` tira a
        //     cabeça antiga do balde para que o nó novo passe a ser dono dela como seu `next`.
        let index = self.index_of(key);
        let next = self.buckets[index].take();
        self.buckets[index] = Some(Box::new(Node { key, value, next }));
        self.len += 1;
        true
    }

    pub fn get(&self, key: Key) -> Option<Value> {
        let mut node = self.buckets[self.index_of(key)].as_deref();
        while let Some(current) = node {
            if current.key == key {
                return Some(current.value);
            }
            node = current.next.as_deref();
        }
        None
    }

    // EN: `link` is a reference to the place that owns the current node: first the bucket head,
    //     then the `next` field of each node. Unlinking is the same assignment in both cases,
    //     so removing the first node of a list needs no special case.
    // PT: `link` é uma referência para o lugar que é dono do nó atual: primeiro a cabeça do
    //     balde, depois o campo `next` de cada nó. Desligar é a mesma atribuição nos dois casos,
    //     então remover o primeiro nó de uma lista não precisa de caso especial.
    pub fn remove(&mut self, key: Key) -> bool {
        let index = self.index_of(key);
        let mut link = &mut self.buckets[index];
        while link.as_ref().is_some_and(|node| node.key != key) {
            link = &mut link.as_mut().expect("checked by the loop condition").next;
        }
        match link.take() {
            Some(node) => {
                *link = node.next;
                self.len -= 1;
                true
            }
            None => false,
        }
    }

    pub fn len(&self) -> usize {
        self.len
    }

    pub fn is_empty(&self) -> bool {
        self.len == 0
    }

    pub fn capacity(&self) -> usize {
        self.buckets.len()
    }

    pub fn load_factor(&self) -> f64 {
        self.len as f64 / self.buckets.len() as f64
    }

    // EN: Rehashing. The bucket of a key is `hash % capacity`, so a new capacity changes the
    //     bucket of almost every key and all nodes have to be moved. It costs O(n), but doubling
    //     makes it rare enough for insertion to stay O(1) amortised.
    // PT: Rehashing. O balde de uma chave é `hash % capacidade`, então uma capacidade nova muda
    //     o balde de quase todas as chaves e todos os nós precisam ser movidos. Custa O(n), mas
    //     dobrar torna isso raro o bastante para a inserção continuar O(1) amortizado.
    fn resize(&mut self, new_buckets: usize) {
        let old = std::mem::replace(&mut self.buckets, (0..new_buckets).map(|_| None).collect());
        for mut head in old {
            while let Some(mut node) = head {
                head = node.next.take();
                let index = self.index_of(node.key);
                node.next = self.buckets[index].take();
                self.buckets[index] = Some(node);
            }
        }
    }
}

#[derive(Clone, Copy, PartialEq)]
enum Slot {
    Empty,
    Full(Key, Value),
    Tombstone,
}

// EN: Open addressing with linear probing. Every entry lives in the array itself. When the slot
//     given by the hash is taken, the next one is tried, then the next, wrapping at the end.
//     A search follows the same sequence and stops at the key or at a slot that was never used.
// PT: Endereçamento aberto com sondagem linear. Toda entrada mora no próprio vetor. Quando a
//     posição dada pelo hash está ocupada, tenta-se a seguinte, depois a seguinte, dando a volta
//     no fim. A busca segue a mesma sequência e para na chave ou em uma posição nunca usada.
pub struct ProbingMap {
    slots: Vec<Slot>,
    len: usize,
    // EN: Full slots plus tombstones. Tombstones still lengthen every probe, so they count
    //     towards the limit.
    // PT: Posições cheias mais lápides. Lápides continuam alongando toda sondagem, então contam
    //     para o limite.
    used: usize,
    max_load: f64,
    hash: HashFn,
}

impl ProbingMap {
    pub fn new(capacity: usize, max_load: f64, hash: HashFn) -> Self {
        Self {
            slots: vec![Slot::Empty; capacity.max(2)],
            len: 0,
            used: 0,
            // EN: At least one slot must stay empty, or a search for a missing key never ends.
            // PT: Ao menos uma posição precisa ficar vazia, senão a busca por uma chave ausente
            //     nunca termina.
            max_load: max_load.min(0.99),
            hash,
        }
    }

    fn index_of(&self, key: Key) -> usize {
        ((self.hash)(key) % self.slots.len() as u64) as usize
    }

    fn find(&self, key: Key) -> Option<usize> {
        let mut index = self.index_of(key);
        loop {
            match self.slots[index] {
                Slot::Empty => return None,
                Slot::Full(stored, _) if stored == key => return Some(index),
                _ => index = (index + 1) % self.slots.len(),
            }
        }
    }

    pub fn put(&mut self, key: Key, value: Value) -> bool {
        if (self.used + 1) as f64 > self.max_load * self.slots.len() as f64 {
            self.grow();
        }
        let mut index = self.index_of(key);
        let mut first_tombstone = None;
        loop {
            match self.slots[index] {
                Slot::Empty => break,
                Slot::Full(stored, _) if stored == key => {
                    self.slots[index] = Slot::Full(key, value);
                    return false;
                }
                // EN: A tombstone can be reused, but only after the whole probe sequence was
                //     checked: the key may still be stored further ahead.
                // PT: Uma lápide pode ser reaproveitada, mas só depois de conferir a sequência
                //     de sondagem inteira: a chave ainda pode estar guardada mais adiante.
                Slot::Tombstone if first_tombstone.is_none() => first_tombstone = Some(index),
                _ => {}
            }
            index = (index + 1) % self.slots.len();
        }
        match first_tombstone {
            Some(tombstone) => index = tombstone,
            None => self.used += 1,
        }
        self.slots[index] = Slot::Full(key, value);
        self.len += 1;
        true
    }

    pub fn get(&self, key: Key) -> Option<Value> {
        match self.slots[self.find(key)?] {
            Slot::Full(_, value) => Some(value),
            _ => None,
        }
    }

    // EN: Deletion leaves a tombstone instead of an empty slot. An empty slot means "no key ever
    //     probed past here", so emptying it would hide every colliding key stored after it.
    // PT: A remoção deixa uma lápide em vez de uma posição vazia. Posição vazia significa
    //     "nenhuma chave passou por aqui", então esvaziá-la esconderia toda chave que colidiu e
    //     foi guardada depois dela.
    pub fn remove(&mut self, key: Key) -> bool {
        match self.find(key) {
            Some(index) => {
                self.slots[index] = Slot::Tombstone;
                self.len -= 1;
                true
            }
            None => false,
        }
    }

    pub fn len(&self) -> usize {
        self.len
    }

    pub fn is_empty(&self) -> bool {
        self.len == 0
    }

    pub fn capacity(&self) -> usize {
        self.slots.len()
    }

    pub fn tombstones(&self) -> usize {
        self.used - self.len
    }

    pub fn load_factor(&self) -> f64 {
        self.len as f64 / self.slots.len() as f64
    }

    // EN: Rebuilding the table throws every tombstone away. The capacity doubles only when the
    //     live entries alone justify it, otherwise the rebuild is a clean-up at the same size.
    // PT: Reconstruir a tabela joga todas as lápides fora. A capacidade só dobra quando as
    //     entradas vivas sozinhas justificam, senão a reconstrução é uma limpeza no mesmo tamanho.
    fn grow(&mut self) {
        let crowded = (self.len + 1) as f64 > self.max_load * self.slots.len() as f64 / 2.0;
        let capacity = if crowded {
            self.slots.len() * 2
        } else {
            self.slots.len()
        };
        let old = std::mem::replace(&mut self.slots, vec![Slot::Empty; capacity]);
        self.len = 0;
        self.used = 0;
        for slot in old {
            if let Slot::Full(key, value) = slot {
                self.put(key, value);
            }
        }
    }
}
