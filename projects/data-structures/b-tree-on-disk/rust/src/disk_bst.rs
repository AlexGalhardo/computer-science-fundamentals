use std::io;
use std::path::Path;

use crate::btree::{Key, Value};
use crate::pager::{PAGE_SIZE, PageId, Pager, get_u64, put_u64};

pub const RECORD_SIZE: usize = 32;
pub const RECORDS_PER_PAGE: usize = PAGE_SIZE / RECORD_SIZE;

struct Record {
    key: Key,
    value: Value,
    left: u64,
    right: u64,
}

// EN: A binary search tree stored in the same kind of file, for comparison. Each node is a
//     32-byte record (key, value, left, right) and 128 records fit in a page, written in the
//     order the keys arrived. Children are record numbers. The tree is built in memory and
//     written once, and the searches then run against the file through the same pager, which
//     counts the pages. A search keeps the last page it read: when the next node is in that
//     same page no new read is counted, which is the fairest way of charging a paged BST.
// PT: Uma árvore binária de busca guardada no mesmo tipo de arquivo, para comparação. Cada nó é
//     um registro de 32 bytes (chave, valor, esquerda, direita) e cabem 128 registros em uma
//     página, gravados na ordem em que as chaves chegaram. Os filhos são números de registro. A
//     árvore é montada em memória e gravada de uma vez, e as buscas depois rodam contra o
//     arquivo pelo mesmo pager, que conta as páginas. A busca guarda a última página que leu:
//     quando o próximo nó está nessa mesma página nenhuma leitura nova é contada, que é a forma
//     mais justa de cobrar uma ABB paginada.
pub struct DiskBst {
    pager: Pager,
    count: u64,
    height: u64,
}

impl DiskBst {
    pub fn build(path: &Path, keys: &[Key]) -> io::Result<Self> {
        // EN: Record numbers start at 1, so 0 can mean "no child".
        // PT: Os números de registro começam em 1, então 0 pode significar "sem filho".
        let mut records: Vec<Record> = Vec::with_capacity(keys.len());
        let mut height = 0;
        for &key in keys {
            let mut depth = 1;
            let mut current = u64::from(!records.is_empty());
            let mut parent = None;
            let mut duplicate = false;
            while current != 0 {
                let record = &records[current as usize - 1];
                if key == record.key {
                    duplicate = true;
                    break;
                }
                let go_left = key < record.key;
                parent = Some((current as usize - 1, go_left));
                current = if go_left { record.left } else { record.right };
                depth += 1;
            }
            if duplicate {
                continue;
            }
            let number = records.len() as u64 + 1;
            if let Some((index, go_left)) = parent {
                if go_left {
                    records[index].left = number;
                } else {
                    records[index].right = number;
                }
            }
            records.push(Record {
                key,
                value: key.wrapping_mul(2),
                left: 0,
                right: 0,
            });
            height = height.max(depth);
        }

        let mut pager = Pager::create(path)?;
        let mut page = [0u8; PAGE_SIZE];
        put_u64(&mut page, 0, records.len() as u64);
        let header = pager.append();
        pager.write(header, &page)?;
        for chunk in records.chunks(RECORDS_PER_PAGE) {
            page.fill(0);
            for (i, record) in chunk.iter().enumerate() {
                put_u64(&mut page, i * RECORD_SIZE, record.key);
                put_u64(&mut page, i * RECORD_SIZE + 8, record.value);
                put_u64(&mut page, i * RECORD_SIZE + 16, record.left);
                put_u64(&mut page, i * RECORD_SIZE + 24, record.right);
            }
            let id = pager.append();
            pager.write(id, &page)?;
        }
        Ok(Self {
            pager,
            count: records.len() as u64,
            height,
        })
    }

    pub fn search(&mut self, key: Key) -> io::Result<Option<Value>> {
        let mut page = [0u8; PAGE_SIZE];
        let mut loaded: PageId = 0;
        let mut current = u64::from(self.count != 0);
        while current != 0 {
            let id = 1 + (current - 1) / RECORDS_PER_PAGE as u64;
            if id != loaded {
                page = self.pager.read(id)?;
                loaded = id;
            }
            let offset = ((current - 1) as usize % RECORDS_PER_PAGE) * RECORD_SIZE;
            let stored = get_u64(&page, offset);
            if key == stored {
                return Ok(Some(get_u64(&page, offset + 8)));
            }
            current = get_u64(&page, offset + if key < stored { 16 } else { 24 });
        }
        Ok(None)
    }

    pub fn len(&self) -> u64 {
        self.count
    }

    pub fn is_empty(&self) -> bool {
        self.count == 0
    }

    /// Number of nodes on the longest path from the root to a leaf.
    pub fn height(&self) -> u64 {
        self.height
    }

    pub fn page_reads(&self) -> u64 {
        self.pager.reads()
    }

    pub fn page_count(&self) -> u64 {
        self.pager.page_count()
    }
}
