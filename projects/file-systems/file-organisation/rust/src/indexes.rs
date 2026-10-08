use crate::record_file::{CITY_SIZE, NO_SLOT, get_u32, put_u32, trimmed};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Entry {
    pub id: u32,
    pub rrn: u32,
}

// EN: The primary index: fixed-length entries (key, RRN) kept sorted by key, while the data
//     file stays in arrival order. Sorted entries of the same size are what binary search
//     needs, so finding a key among n records costs about log2(n) comparisons in memory and
//     then a single seek in the data file.
// PT: O índice primário: entradas de tamanho fixo (chave, RRN) mantidas em ordem de chave,
//     enquanto o arquivo de dados fica em ordem de chegada. Entradas ordenadas e de mesmo
//     tamanho são o que a busca binária precisa, então achar uma chave entre n registros custa
//     cerca de log2(n) comparações na memória e depois um único seek no arquivo de dados.
#[derive(Debug, Default)]
pub struct PrimaryIndex {
    entries: Vec<Entry>,
    last_probes: u32,
    max_probes: u32,
}

impl PrimaryIndex {
    pub fn find(&mut self, id: u32) -> Option<u32> {
        let at = self.lower_bound(id);
        self.entries
            .get(at)
            .filter(|entry| entry.id == id)
            .map(|entry| entry.rrn)
    }

    pub fn insert(&mut self, id: u32, rrn: u32) -> bool {
        let at = self.lower_bound(id);
        if self.entries.get(at).is_some_and(|entry| entry.id == id) {
            return false;
        }
        self.entries.insert(at, Entry { id, rrn });
        true
    }

    pub fn erase(&mut self, id: u32) -> bool {
        let at = self.lower_bound(id);
        if self.entries.get(at).is_some_and(|entry| entry.id == id) {
            self.entries.remove(at);
            return true;
        }
        false
    }

    pub fn clear(&mut self) {
        self.entries.clear();
    }

    pub fn len(&self) -> usize {
        self.entries.len()
    }

    pub fn is_empty(&self) -> bool {
        self.entries.is_empty()
    }

    pub fn entries(&self) -> &[Entry] {
        &self.entries
    }

    // EN: Entries examined by the last search, and the largest value seen so far.
    // PT: Entradas examinadas pela última busca, e o maior valor visto até agora.
    pub fn last_probes(&self) -> u32 {
        self.last_probes
    }

    pub fn max_probes(&self) -> u32 {
        self.max_probes
    }

    // EN: Index file: "PIDX", the out-of-date flag, the number of entries, then the entries.
    // PT: Arquivo de índice: "PIDX", o indicador de desatualizado, o número de entradas e as entradas.
    pub fn to_bytes(&self, stale: bool) -> Vec<u8> {
        let mut bytes = vec![0u8; 12 + self.entries.len() * 8];
        bytes[0..4].copy_from_slice(b"PIDX");
        put_u32(&mut bytes, 4, u32::from(stale));
        put_u32(&mut bytes, 8, self.entries.len() as u32);
        for (i, entry) in self.entries.iter().enumerate() {
            put_u32(&mut bytes, 12 + i * 8, entry.id);
            put_u32(&mut bytes, 16 + i * 8, entry.rrn);
        }
        bytes
    }

    // EN: Returns false when the file is missing, damaged or flagged as out of date. In all
    //     three cases the caller rebuilds the index from the data file.
    // PT: Devolve false quando o arquivo não existe, está danificado ou está marcado como
    //     desatualizado. Nos três casos quem chamou reconstrói o índice a partir dos dados.
    pub fn load_bytes(&mut self, bytes: &[u8]) -> bool {
        self.entries.clear();
        if bytes.len() < 12 || &bytes[0..4] != b"PIDX" || get_u32(bytes, 4) != 0 {
            return false;
        }
        let count = get_u32(bytes, 8) as usize;
        if bytes.len() != 12 + count * 8 {
            return false;
        }
        for i in 0..count {
            self.entries.push(Entry {
                id: get_u32(bytes, 12 + i * 8),
                rrn: get_u32(bytes, 16 + i * 8),
            });
        }
        true
    }

    // EN: Binary search written by hand so that the probes can be counted: each step compares
    //     with the middle entry and throws away half of what is left.
    // PT: Busca binária escrita à mão para que as sondagens possam ser contadas: cada passo
    //     compara com a entrada do meio e descarta metade do que resta.
    fn lower_bound(&mut self, id: u32) -> usize {
        let mut low = 0;
        let mut high = self.entries.len();
        self.last_probes = 0;
        while low < high {
            let middle = low + (high - low) / 2;
            self.last_probes += 1;
            if self.entries[middle].id < id {
                low = middle + 1;
            } else {
                high = middle;
            }
        }
        self.max_probes = self.max_probes.max(self.last_probes);
        low
    }
}

#[derive(Debug, Clone, Copy)]
struct Node {
    id: u32,
    next: i32,
}

// EN: A secondary index with inverted lists. The key table has one entry per secondary key
//     (a city, a year), with the position of the first node of a linked list. The nodes live
//     in a second file, each one holding a PRIMARY KEY and the position of the next node. The
//     index stores primary keys, not addresses (late binding): when a record moves or is
//     deleted, only the primary index changes. Each list is kept in increasing order of
//     primary key, so that two lists can be matched in a single pass.
// PT: Um índice secundário com listas invertidas. A tabela de chaves tem uma entrada por chave
//     secundária (uma cidade, um ano), com a posição do primeiro nó de uma lista encadeada. Os
//     nós ficam em um segundo arquivo, cada um com uma CHAVE PRIMÁRIA e a posição do próximo
//     nó. O índice guarda chaves primárias, e não endereços (ligação tardia): quando um
//     registro muda de lugar ou é removido, só o índice primário muda. Cada lista é mantida em
//     ordem crescente de chave primária, para que duas listas sejam combinadas em uma passada.
#[derive(Debug, Default)]
pub struct SecondaryIndex {
    keys: Vec<(String, i32)>,
    nodes: Vec<Node>,
}

impl SecondaryIndex {
    pub fn add(&mut self, key: &str, id: u32) {
        let at = self
            .keys
            .iter()
            .position(|(name, _)| name.as_str() >= key)
            .unwrap_or(self.keys.len());
        if self.keys.get(at).is_none_or(|(name, _)| name != key) {
            self.keys.insert(at, (key.to_string(), NO_SLOT));
        }
        // EN: Walk the list to the insertion point. The new node is appended to the list file
        //     and two links change. Nothing is shifted, whatever the length of the list.
        // PT: Percorre a lista até o ponto de inserção. O nó novo vai para o fim do arquivo de
        //     listas e dois elos mudam. Nada é deslocado, qualquer que seja o tamanho da lista.
        let mut previous = NO_SLOT;
        let mut current = self.keys[at].1;
        while current != NO_SLOT && self.nodes[current as usize].id < id {
            previous = current;
            current = self.nodes[current as usize].next;
        }
        if current != NO_SLOT && self.nodes[current as usize].id == id {
            return;
        }
        let added = self.nodes.len() as i32;
        self.nodes.push(Node { id, next: current });
        if previous == NO_SLOT {
            self.keys[at].1 = added;
        } else {
            self.nodes[previous as usize].next = added;
        }
    }

    pub fn ids(&self, key: &str) -> Vec<u32> {
        let mut found = Vec::new();
        if let Some((_, head)) = self.keys.iter().find(|(name, _)| name == key) {
            let mut at = *head;
            while at != NO_SLOT {
                found.push(self.nodes[at as usize].id);
                at = self.nodes[at as usize].next;
            }
        }
        found
    }

    pub fn clear(&mut self) {
        self.keys.clear();
        self.nodes.clear();
    }

    pub fn key_count(&self) -> usize {
        self.keys.len()
    }

    pub fn node_count(&self) -> usize {
        self.nodes.len()
    }

    // EN: Key table file: count, then entries of 24 bytes (key padded to 20 bytes, head).
    // PT: Arquivo da tabela de chaves: quantidade e entradas de 24 bytes (chave em 20 bytes, cabeça).
    pub fn keys_to_bytes(&self) -> Vec<u8> {
        let mut bytes = vec![b' '; 4 + self.keys.len() * 24];
        put_u32(&mut bytes, 0, self.keys.len() as u32);
        for (i, (key, head)) in self.keys.iter().enumerate() {
            let size = key.len().min(CITY_SIZE);
            bytes[4 + i * 24..4 + i * 24 + size].copy_from_slice(&key.as_bytes()[..size]);
            put_u32(&mut bytes, 4 + i * 24 + 20, *head as u32);
        }
        bytes
    }

    // EN: List file: count, then nodes of 8 bytes (primary key, next).
    // PT: Arquivo de listas: quantidade e nós de 8 bytes (chave primária, próximo).
    pub fn nodes_to_bytes(&self) -> Vec<u8> {
        let mut bytes = vec![0u8; 4 + self.nodes.len() * 8];
        put_u32(&mut bytes, 0, self.nodes.len() as u32);
        for (i, node) in self.nodes.iter().enumerate() {
            put_u32(&mut bytes, 4 + i * 8, node.id);
            put_u32(&mut bytes, 8 + i * 8, node.next as u32);
        }
        bytes
    }

    pub fn load_bytes(&mut self, keys: &[u8], nodes: &[u8]) -> bool {
        self.clear();
        if keys.len() < 4 || nodes.len() < 4 {
            return false;
        }
        let key_count = get_u32(keys, 0) as usize;
        let node_count = get_u32(nodes, 0) as usize;
        if keys.len() != 4 + key_count * 24 || nodes.len() != 4 + node_count * 8 {
            return false;
        }
        for i in 0..key_count {
            let at = 4 + i * 24;
            self.keys.push((
                trimmed(&keys[at..at + CITY_SIZE]),
                get_u32(keys, at + 20) as i32,
            ));
        }
        for i in 0..node_count {
            self.nodes.push(Node {
                id: get_u32(nodes, 4 + i * 8),
                next: get_u32(nodes, 8 + i * 8) as i32,
            });
        }
        true
    }
}

// EN: Cosequential matching: two lists sorted by the same key are walked together, always
//     advancing the one with the smaller current item. Equal items belong to both lists. One
//     pass over each list is enough, with no searching.
// PT: Matching cossequencial: duas listas ordenadas pela mesma chave são percorridas juntas,
//     avançando sempre a que tem o menor item atual. Itens iguais pertencem às duas listas.
//     Basta uma passada em cada lista, sem nenhuma busca.
pub fn match_lists(left: &[u32], right: &[u32]) -> Vec<u32> {
    let mut both = Vec::new();
    let (mut i, mut j) = (0, 0);
    while i < left.len() && j < right.len() {
        if left[i] < right[j] {
            i += 1;
        } else if right[j] < left[i] {
            j += 1;
        } else {
            both.push(left[i]);
            i += 1;
            j += 1;
        }
    }
    both
}
