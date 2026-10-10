use std::io;
use std::path::Path;

use crate::pager::{PAGE_SIZE, Page, PageId, Pager, get_u64, put_u64};

pub type Key = u64;
pub type Value = u64;

// EN: The minimum degree t fixes the size of a node: every node except the root has between
//     t - 1 and 2t - 1 keys. 2t - 1 = 169 is the most that fits in a 4096-byte page with this
//     layout. Tests use t = 2 so that splits and merges happen all the time.
// PT: O grau mínimo t fixa o tamanho de um nó: todo nó, menos a raiz, tem entre t - 1 e 2t - 1
//     chaves. 2t - 1 = 169 é o máximo que cabe em uma página de 4096 bytes com este layout. Os
//     testes usam t = 2 para que divisões e fusões aconteçam o tempo todo.
// ES: El grado mínimo t fija el tamaño de un nodo: todo nodo, menos la raíz, tiene entre t - 1 y
//     2t - 1 claves. 2t - 1 = 169 es el máximo que cabe en una página de 4096 bytes con este
//     layout. Las pruebas usan t = 2 para que divisiones y fusiones ocurran todo el tiempo.
pub const MAX_DEGREE: usize = 85;
pub const MAX_KEYS: usize = 2 * MAX_DEGREE - 1;

const MAGIC: u64 = 0x4545_5254_4246_4553; // "SEFBTREE"
const KEYS_OFFSET: usize = 16;
const VALUES_OFFSET: usize = KEYS_OFFSET + 8 * MAX_KEYS;
const CHILDREN_OFFSET: usize = VALUES_OFFSET + 8 * MAX_KEYS;
const _: () = assert!(CHILDREN_OFFSET + 8 * (MAX_KEYS + 1) <= PAGE_SIZE);

struct Node {
    id: PageId,
    leaf: bool,
    keys: Vec<Key>,
    values: Vec<Value>,
    children: Vec<PageId>,
}

// EN: A B-tree stored in a file, one node per page. A node of a binary tree holds one key and
//     has two children. A node of a B-tree fills a whole page with keys: here up to 169 keys
//     and 170 children. Each page read therefore discards 169/170 of the remaining keys instead
//     of half, and a million keys fit in a tree only 3 levels tall. That is why databases and
//     file systems use wide trees: the cost of a search is the number of pages read.
// PT: Uma árvore B guardada em um arquivo, um nó por página. Um nó de árvore binária guarda uma
//     chave e tem dois filhos. Um nó de árvore B enche uma página inteira de chaves: aqui até
//     169 chaves e 170 filhos. Cada página lida descarta então 169/170 das chaves restantes em
//     vez de metade, e um milhão de chaves cabe em uma árvore de só 3 níveis. É por isso que
//     bancos de dados e sistemas de arquivos usam árvores largas: o custo de uma busca é o
//     número de páginas lidas.
// ES: Un árbol B guardado en un archivo, un nodo por página. Un nodo de árbol binario guarda una
//     clave y tiene dos hijos. Un nodo de árbol B llena una página entera de claves: aquí hasta
//     169 claves y 170 hijos. Cada página leída descarta entonces 169/170 de las claves restantes
//     en vez de la mitad, y un millón de claves cabe en un árbol de solo 3 niveles. Por eso las
//     bases de datos y los sistemas de archivos usan árboles anchos: el costo de una búsqueda es
//     el número de páginas leídas.
pub struct BTree {
    pager: Pager,
    t: usize,
    root: PageId,
    count: u64,
    height: u64,
    free_head: PageId,
    dirty: bool,
}

impl BTree {
    /// Creates a new, empty tree, replacing any file at `path`.
    pub fn create(path: &Path, min_degree: usize) -> io::Result<Self> {
        if !(2..=MAX_DEGREE).contains(&min_degree) {
            return Err(io::Error::new(
                io::ErrorKind::InvalidInput,
                "the minimum degree must be between 2 and 85",
            ));
        }
        let mut pager = Pager::create(path)?;
        pager.append(); // page 0 is the header
        let root = pager.append();
        let mut tree = Self {
            pager,
            t: min_degree,
            root,
            count: 0,
            height: 1,
            free_head: 0,
            dirty: false,
        };
        tree.store(&Node {
            id: root,
            leaf: true,
            keys: Vec::new(),
            values: Vec::new(),
            children: Vec::new(),
        })?;
        tree.write_header()?;
        Ok(tree)
    }

    /// Opens a tree written earlier.
    pub fn open(path: &Path) -> io::Result<Self> {
        let mut pager = Pager::open(path)?;
        let header = pager.read(0)?;
        if get_u64(&header, 0) != MAGIC {
            return Err(io::Error::new(
                io::ErrorKind::InvalidData,
                "not a B-tree file",
            ));
        }
        Ok(Self {
            pager,
            t: get_u64(&header, 8) as usize,
            root: get_u64(&header, 16),
            count: get_u64(&header, 24),
            height: get_u64(&header, 32),
            free_head: get_u64(&header, 40),
            dirty: false,
        })
    }

    // EN: Search reads one page per level, from the root down, and stops as soon as the key is
    //     found. Inside the page the keys are sorted, so a binary search picks the child.
    // PT: A busca lê uma página por nível, da raiz para baixo, e para assim que acha a chave.
    //     Dentro da página as chaves estão ordenadas, então uma busca binária escolhe o filho.
    // ES: La búsqueda lee una página por nivel, de la raíz hacia abajo, y se detiene en cuanto
    //     encuentra la clave. Dentro de la página las claves están ordenadas, así que una búsqueda
    //     binaria elige el hijo.
    pub fn search(&mut self, key: Key) -> io::Result<Option<Value>> {
        let mut id = self.root;
        loop {
            let node = self.load(id)?;
            let i = node.keys.partition_point(|&stored| stored < key);
            if i < node.keys.len() && node.keys[i] == key {
                return Ok(Some(node.values[i]));
            }
            if node.leaf {
                return Ok(None);
            }
            id = node.children[i];
        }
    }

    // EN: Insertion in one pass, top down. Before going into a child that is full, the child
    //     is split, so there is always room when the leaf is reached and nothing has to climb
    //     back. The tree only grows at the top: when the root is full it is split under a new
    //     root, and every leaf gets one level deeper at the same time. That is how all leaves
    //     stay at the same depth. Returns true for a new key, false when a value was replaced.
    // PT: Inserção em uma passada, de cima para baixo. Antes de entrar em um filho cheio, o
    //     filho é dividido, então sempre há espaço ao chegar na folha e nada precisa subir de
    //     volta. A árvore só cresce por cima: quando a raiz está cheia ela é dividida sob uma
    //     raiz nova, e todas as folhas ficam um nível mais fundas ao mesmo tempo. É assim que
    //     todas as folhas ficam na mesma profundidade. Devolve true para chave nova e false
    //     quando um valor foi trocado.
    // ES: Inserción en una pasada, de arriba hacia abajo. Antes de entrar a un hijo lleno, el
    //     hijo se divide, así que siempre hay espacio al llegar a la hoja y nada necesita subir
    //     de vuelta. El árbol solo crece por arriba: cuando la raíz está llena se divide bajo una
    //     raíz nueva, y todas las hojas quedan un nivel más hondas a la vez. Así todas las hojas
    //     quedan a la misma profundidad. Devuelve true para clave nueva y false cuando se
    //     reemplazó un valor.
    pub fn insert(&mut self, key: Key, value: Value) -> io::Result<bool> {
        let mut node = self.load(self.root)?;
        if node.keys.len() == self.max_keys() {
            let mut new_root = Node {
                id: self.allocate()?,
                leaf: false,
                keys: Vec::new(),
                values: Vec::new(),
                children: vec![node.id],
            };
            self.split_child(&mut new_root, 0, &mut node)?;
            self.root = new_root.id;
            self.height += 1;
            self.dirty = true;
            node = new_root;
        }
        loop {
            let i = node.keys.partition_point(|&stored| stored < key);
            if i < node.keys.len() && node.keys[i] == key {
                node.values[i] = value;
                self.store(&node)?;
                return Ok(false);
            }
            if node.leaf {
                node.keys.insert(i, key);
                node.values.insert(i, value);
                self.store(&node)?;
                self.count += 1;
                self.dirty = true;
                return Ok(true);
            }
            let mut child = self.load(node.children[i])?;
            if child.keys.len() == self.max_keys() {
                let sibling = self.split_child(&mut node, i, &mut child)?;
                if key == node.keys[i] {
                    node.values[i] = value;
                    self.store(&node)?;
                    return Ok(false);
                }
                if key > node.keys[i] {
                    child = sibling;
                }
            }
            node = child;
        }
    }

    // EN: Removal in one pass, top down. Before going into a child that has only the minimum
    //     of t - 1 keys, the child is refilled, so removing a key down there can never leave a
    //     node too empty. A key found in an internal node is replaced by its predecessor or
    //     successor, which lives in a leaf, and that one is removed instead.
    // PT: Remoção em uma passada, de cima para baixo. Antes de entrar em um filho que tem só o
    //     mínimo de t - 1 chaves, o filho é reabastecido, então remover uma chave lá embaixo
    //     nunca deixa um nó vazio demais. Uma chave achada em um nó interno é trocada pelo seu
    //     antecessor ou sucessor, que mora em uma folha, e é esse que acaba removido.
    // ES: Eliminación en una pasada, de arriba hacia abajo. Antes de entrar a un hijo que tiene
    //     solo el mínimo de t - 1 claves, el hijo se reabastece, así que quitar una clave allá
    //     abajo nunca deja un nodo demasiado vacío. Una clave hallada en un nodo interno se
    //     cambia por su antecesor o sucesor, que vive en una hoja, y ese es el que termina
    //     eliminado.
    pub fn remove(&mut self, mut key: Key) -> io::Result<bool> {
        let mut node = self.load(self.root)?;
        loop {
            let i = node.keys.partition_point(|&stored| stored < key);
            if i < node.keys.len() && node.keys[i] == key {
                if node.leaf {
                    node.keys.remove(i);
                    node.values.remove(i);
                    self.store(&node)?;
                    self.count -= 1;
                    self.dirty = true;
                    return Ok(true);
                }
                let mut left = self.load(node.children[i])?;
                if left.keys.len() >= self.t {
                    let (k, v) = self.edge_entry(&left, true)?;
                    node.keys[i] = k;
                    node.values[i] = v;
                    self.store(&node)?;
                    node = left;
                    key = k;
                    continue;
                }
                let right = self.load(node.children[i + 1])?;
                if right.keys.len() >= self.t {
                    let (k, v) = self.edge_entry(&right, false)?;
                    node.keys[i] = k;
                    node.values[i] = v;
                    self.store(&node)?;
                    node = right;
                    key = k;
                    continue;
                }
                self.merge(&mut node, i, &mut left, right)?;
                node = left;
                continue;
            }
            if node.leaf {
                return Ok(false);
            }
            let child = self.load(node.children[i])?;
            node = if child.keys.len() < self.t {
                self.refill(&mut node, i, child)?
            } else {
                child
            };
        }
    }

    // EN: Walks the whole tree and checks the three invariants of a B-tree: every node has a
    //     legal number of keys, the keys are in order (inside each node and against the keys of
    //     its ancestors), and every leaf is at the same depth.
    // PT: Percorre a árvore inteira e confere as três invariantes de uma árvore B: todo nó tem
    //     um número legal de chaves, as chaves estão em ordem (dentro de cada nó e em relação às
    //     chaves dos ancestrais), e toda folha está na mesma profundidade.
    // ES: Recorre el árbol entero y verifica las tres invariantes de un árbol B: todo nodo tiene
    //     un número legal de claves, las claves están en orden (dentro de cada nodo y respecto a
    //     las claves de los ancestros), y toda hoja está a la misma profundidad.
    pub fn check(&mut self) -> Result<(), String> {
        let mut keys = 0;
        self.check_node(self.root, 1, None, None, &mut keys)?;
        if keys != self.count {
            return Err(format!(
                "the header counts {} keys, the tree has {keys}",
                self.count
            ));
        }
        Ok(())
    }

    pub fn flush(&mut self) -> io::Result<()> {
        if self.dirty {
            self.write_header()?;
        }
        Ok(())
    }

    pub fn len(&self) -> u64 {
        self.count
    }

    pub fn is_empty(&self) -> bool {
        self.count == 0
    }

    /// Number of levels: 1 for a tree whose root is a leaf.
    pub fn height(&self) -> u64 {
        self.height
    }

    pub fn page_reads(&self) -> u64 {
        self.pager.reads()
    }

    pub fn page_writes(&self) -> u64 {
        self.pager.writes()
    }

    pub fn page_count(&self) -> u64 {
        self.pager.page_count()
    }

    fn max_keys(&self) -> usize {
        2 * self.t - 1
    }

    // EN: Page layout of a node: leaf flag, key count, then three fixed areas for keys, values
    //     and child page numbers. Children are page numbers, not memory addresses: a pointer
    //     means nothing after the program ends, a page number is valid for as long as the file
    //     exists.
    // PT: Layout de página de um nó: marca de folha, quantidade de chaves e três áreas fixas
    //     para chaves, valores e números de página dos filhos. Os filhos são números de página,
    //     não endereços de memória: um ponteiro não significa nada depois que o programa
    //     termina, um número de página vale enquanto o arquivo existir.
    // ES: Layout de página de un nodo: marca de hoja, cantidad de claves y tres áreas fijas
    //     para claves, valores y números de página de los hijos. Los hijos son números de página,
    //     no direcciones de memoria: un puntero no significa nada después de que el programa
    //     termina, un número de página vale mientras el archivo exista.
    fn load(&mut self, id: PageId) -> io::Result<Node> {
        let page = self.pager.read(id)?;
        let leaf = get_u64(&page, 0) == 1;
        let count = get_u64(&page, 8) as usize;
        let keys = (0..count)
            .map(|i| get_u64(&page, KEYS_OFFSET + 8 * i))
            .collect();
        let values = (0..count)
            .map(|i| get_u64(&page, VALUES_OFFSET + 8 * i))
            .collect();
        let children = if leaf {
            Vec::new()
        } else {
            (0..=count)
                .map(|i| get_u64(&page, CHILDREN_OFFSET + 8 * i))
                .collect()
        };
        Ok(Node {
            id,
            leaf,
            keys,
            values,
            children,
        })
    }

    fn store(&mut self, node: &Node) -> io::Result<()> {
        let mut page = [0u8; PAGE_SIZE];
        put_u64(&mut page, 0, u64::from(node.leaf));
        put_u64(&mut page, 8, node.keys.len() as u64);
        for (i, (key, value)) in node.keys.iter().zip(&node.values).enumerate() {
            put_u64(&mut page, KEYS_OFFSET + 8 * i, *key);
            put_u64(&mut page, VALUES_OFFSET + 8 * i, *value);
        }
        for (i, child) in node.children.iter().enumerate() {
            put_u64(&mut page, CHILDREN_OFFSET + 8 * i, *child);
        }
        self.pager.write(node.id, &page)
    }

    fn write_header(&mut self) -> io::Result<()> {
        let mut page = [0u8; PAGE_SIZE];
        put_u64(&mut page, 0, MAGIC);
        put_u64(&mut page, 8, self.t as u64);
        put_u64(&mut page, 16, self.root);
        put_u64(&mut page, 24, self.count);
        put_u64(&mut page, 32, self.height);
        put_u64(&mut page, 40, self.free_head);
        self.pager.write(0, &page)?;
        self.dirty = false;
        Ok(())
    }

    // EN: Pages released by merges form a linked list inside the file itself: each free page
    //     stores the number of the next one. A new node reuses a free page before the file
    //     grows, so deleting does not leave the file full of dead pages.
    // PT: As páginas liberadas pelas fusões formam uma lista encadeada dentro do próprio
    //     arquivo: cada página livre guarda o número da próxima. Um nó novo reaproveita uma
    //     página livre antes de o arquivo crescer, então remover não deixa o arquivo cheio de
    //     páginas mortas.
    // ES: Las páginas liberadas por las fusiones forman una lista enlazada dentro del propio
    //     archivo: cada página libre guarda el número de la siguiente. Un nodo nuevo reutiliza una
    //     página libre antes de que el archivo crezca, así que eliminar no deja el archivo lleno
    //     de páginas muertas.
    fn allocate(&mut self) -> io::Result<PageId> {
        if self.free_head == 0 {
            return Ok(self.pager.append());
        }
        let id = self.free_head;
        self.free_head = get_u64(&self.pager.read(id)?, 0);
        self.dirty = true;
        Ok(id)
    }

    fn release(&mut self, id: PageId) -> io::Result<()> {
        let mut page: Page = [0u8; PAGE_SIZE];
        put_u64(&mut page, 0, self.free_head);
        self.pager.write(id, &page)?;
        self.free_head = id;
        self.dirty = true;
        Ok(())
    }

    // EN: Split. A full child has 2t - 1 keys. The middle key goes up to the parent and the
    //     t - 1 keys after it move to a new sibling page. The child keeps the first t - 1.
    // PT: Divisão (split). Um filho cheio tem 2t - 1 chaves. A chave do meio sobe para o pai e
    //     as t - 1 chaves depois dela vão para uma nova página irmã. O filho fica com as
    //     primeiras t - 1.
    // ES: División (split). Un hijo lleno tiene 2t - 1 claves. La clave del medio sube al padre y
    //     las t - 1 claves después de ella van a una nueva página hermana. El hijo se queda con
    //     las primeras t - 1.
    fn split_child(&mut self, parent: &mut Node, i: usize, child: &mut Node) -> io::Result<Node> {
        let sibling = Node {
            id: self.allocate()?,
            leaf: child.leaf,
            keys: child.keys.split_off(self.t),
            values: child.values.split_off(self.t),
            children: if child.leaf {
                Vec::new()
            } else {
                child.children.split_off(self.t)
            },
        };
        let up_key = child.keys.pop().expect("a full node has a middle key");
        let up_value = child.values.pop().expect("a full node has a middle value");
        parent.keys.insert(i, up_key);
        parent.values.insert(i, up_value);
        parent.children.insert(i + 1, sibling.id);
        self.store(child)?;
        self.store(&sibling)?;
        self.store(parent)?;
        Ok(sibling)
    }

    // EN: Merge, the opposite of a split. Two neighbouring children with t - 1 keys each and
    //     the parent key between them become one full node of 2t - 1 keys. The page of the
    //     right child is released. If the root is left with no key, the merged node becomes the
    //     new root and the tree gets one level shorter, again for every leaf at the same time.
    // PT: Fusão (merge), o oposto da divisão. Dois filhos vizinhos com t - 1 chaves cada e a
    //     chave do pai que fica entre eles viram um único nó cheio, de 2t - 1 chaves. A página
    //     do filho direito é liberada. Se a raiz ficar sem nenhuma chave, o nó fundido vira a
    //     nova raiz e a árvore fica um nível mais baixa, de novo para todas as folhas de uma vez.
    // ES: Fusión (merge), lo opuesto de la división. Dos hijos vecinos con t - 1 claves cada uno y
    //     la clave del padre que queda entre ellos se vuelven un único nodo lleno, de 2t - 1
    //     claves. La página del hijo derecho se libera. Si la raíz se queda sin ninguna clave, el
    //     nodo fusionado pasa a ser la nueva raíz y el árbol queda un nivel más bajo, de nuevo
    //     para todas las hojas a la vez.
    fn merge(
        &mut self,
        parent: &mut Node,
        i: usize,
        left: &mut Node,
        right: Node,
    ) -> io::Result<()> {
        left.keys.push(parent.keys.remove(i));
        left.values.push(parent.values.remove(i));
        left.keys.extend(right.keys);
        left.values.extend(right.values);
        left.children.extend(right.children);
        parent.children.remove(i + 1);
        self.release(right.id)?;
        self.store(left)?;
        if parent.id == self.root && parent.keys.is_empty() {
            self.release(parent.id)?;
            self.root = left.id;
            self.height -= 1;
            self.dirty = true;
            Ok(())
        } else {
            self.store(parent)
        }
    }

    // EN: Redistribution. A child with only t - 1 keys borrows one through the parent: the
    //     parent key between the two siblings goes down to the child, and the nearest key of
    //     the richer sibling goes up to take its place. Keys rotate through the parent so that
    //     the order is preserved. Only when no sibling can lend a key are two nodes merged.
    // PT: Redistribuição. Um filho com só t - 1 chaves pega uma emprestada por meio do pai: a
    //     chave do pai que fica entre os dois irmãos desce para o filho, e a chave mais próxima
    //     do irmão mais cheio sobe para ocupar o lugar dela. As chaves giram pelo pai para que
    //     a ordem seja preservada. Só quando nenhum irmão pode emprestar é que dois nós se fundem.
    // ES: Redistribución. Un hijo con solo t - 1 claves pide una prestada por medio del padre: la
    //     clave del padre que queda entre los dos hermanos baja al hijo, y la clave más cercana
    //     del hermano más lleno sube a ocupar su lugar. Las claves giran por el padre para que
    //     el orden se preserve. Solo cuando ningún hermano puede prestar es que dos nodos se
    //     fusionan.
    fn refill(&mut self, parent: &mut Node, i: usize, mut child: Node) -> io::Result<Node> {
        let mut left_sibling = None;
        if i > 0 {
            let mut left = self.load(parent.children[i - 1])?;
            if left.keys.len() >= self.t {
                let borrowed_key = left.keys.pop().expect("the sibling has keys to lend");
                let borrowed_value = left.values.pop().expect("the sibling has values to lend");
                child
                    .keys
                    .insert(0, std::mem::replace(&mut parent.keys[i - 1], borrowed_key));
                child.values.insert(
                    0,
                    std::mem::replace(&mut parent.values[i - 1], borrowed_value),
                );
                if let Some(grandchild) = left.children.pop() {
                    child.children.insert(0, grandchild);
                }
                self.store(&left)?;
                self.store(&child)?;
                self.store(parent)?;
                return Ok(child);
            }
            left_sibling = Some(left);
        }
        if i < parent.keys.len() {
            let mut right = self.load(parent.children[i + 1])?;
            if right.keys.len() >= self.t {
                child
                    .keys
                    .push(std::mem::replace(&mut parent.keys[i], right.keys.remove(0)));
                child.values.push(std::mem::replace(
                    &mut parent.values[i],
                    right.values.remove(0),
                ));
                if !right.children.is_empty() {
                    child.children.push(right.children.remove(0));
                }
                self.store(&right)?;
                self.store(&child)?;
                self.store(parent)?;
                return Ok(child);
            }
            self.merge(parent, i, &mut child, right)?;
            return Ok(child);
        }
        let mut left = left_sibling.expect("an internal node has at least two children");
        self.merge(parent, i - 1, &mut left, child)?;
        Ok(left)
    }

    // EN: The predecessor of a key in an internal node is the last key of the rightmost leaf
    //     of its left subtree. The successor is the first key of the leftmost leaf on the right.
    // PT: O antecessor de uma chave em um nó interno é a última chave da folha mais à direita
    //     da subárvore esquerda. O sucessor é a primeira chave da folha mais à esquerda da direita.
    // ES: El antecesor de una clave en un nodo interno es la última clave de la hoja más a la
    //     derecha del subárbol izquierdo. El sucesor es la primera clave de la hoja más a la
    //     izquierda del derecho.
    fn edge_entry(&mut self, start: &Node, last: bool) -> io::Result<(Key, Value)> {
        let pick = |node: &Node| {
            let index = if last { node.keys.len() - 1 } else { 0 };
            (node.keys[index], node.values[index])
        };
        if start.leaf {
            return Ok(pick(start));
        }
        let mut id = if last {
            start.children[start.children.len() - 1]
        } else {
            start.children[0]
        };
        loop {
            let node = self.load(id)?;
            if node.leaf {
                return Ok(pick(&node));
            }
            id = if last {
                node.children[node.children.len() - 1]
            } else {
                node.children[0]
            };
        }
    }

    fn check_node(
        &mut self,
        id: PageId,
        depth: u64,
        low: Option<Key>,
        high: Option<Key>,
        keys: &mut u64,
    ) -> Result<(), String> {
        let node = self
            .load(id)
            .map_err(|error| format!("page {id}: {error}"))?;
        let is_root = id == self.root;
        if node.keys.len() > self.max_keys() || (!is_root && node.keys.len() < self.t - 1) {
            return Err(format!(
                "page {id}: illegal number of keys ({})",
                node.keys.len()
            ));
        }
        if is_root && !node.leaf && node.keys.is_empty() {
            return Err(format!("page {id}: internal root without keys"));
        }
        let sorted = node.keys.windows(2).all(|pair| pair[0] < pair[1]);
        let bounded = node
            .keys
            .iter()
            .all(|&key| low.is_none_or(|low| low < key) && high.is_none_or(|high| key < high));
        if !sorted || !bounded {
            return Err(format!("page {id}: keys out of order"));
        }
        *keys += node.keys.len() as u64;
        if node.leaf {
            return if depth == self.height {
                Ok(())
            } else {
                Err(format!("page {id}: leaf at depth {depth}"))
            };
        }
        if node.children.len() != node.keys.len() + 1 {
            return Err(format!("page {id}: wrong number of children"));
        }
        for (i, &child) in node.children.iter().enumerate() {
            let child_low = if i == 0 { low } else { Some(node.keys[i - 1]) };
            let child_high = if i == node.keys.len() {
                high
            } else {
                Some(node.keys[i])
            };
            self.check_node(child, depth + 1, child_low, child_high, keys)?;
        }
        Ok(())
    }
}

impl Drop for BTree {
    // EN: Drop cannot return an error. Call flush() directly to see a write error.
    // PT: Drop não pode devolver erro. Chame flush() diretamente para ver um erro de escrita.
    // ES: Drop no puede devolver un error. Llama a flush() directamente para ver un error de
    //     escritura.
    fn drop(&mut self) {
        let _ = self.flush();
    }
}
