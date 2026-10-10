use std::fs::{File, OpenOptions};
use std::io;
use std::os::unix::fs::FileExt;
use std::path::Path;

pub const PAGE_SIZE: usize = 4096;
pub type PageId = u64;
pub type Page = [u8; PAGE_SIZE];

// EN: Integers are stored in little-endian order at fixed offsets, so the file has the same
//     layout whatever language or machine wrote it.
// PT: Os inteiros são guardados em ordem little-endian em posições fixas, então o arquivo tem o
//     mesmo layout seja qual for a linguagem ou a máquina que o gravou.
// ES: Los enteros se guardan en orden little-endian en posiciones fijas, así que el archivo tiene
//     el mismo layout sea cual sea el lenguaje o la máquina que lo grabó.
pub fn get_u64(page: &Page, offset: usize) -> u64 {
    let mut bytes = [0u8; 8];
    bytes.copy_from_slice(&page[offset..offset + 8]);
    u64::from_le_bytes(bytes)
}

pub fn put_u64(page: &mut Page, offset: usize, value: u64) {
    page[offset..offset + 8].copy_from_slice(&value.to_le_bytes());
}

// EN: The pager is the only code that touches the file. It sees the file as an array of pages
//     of 4096 bytes, the unit a disk and an operating system really read and write, and it
//     counts every page read and written. On a disk, the number of pages read is what a search
//     costs, far more than the comparisons made in memory. There is no cache on purpose: one
//     node visited is one page read, so the counter shows the real shape of the structure.
// PT: O pager é o único código que mexe no arquivo. Ele enxerga o arquivo como um vetor de
//     páginas de 4096 bytes, a unidade que um disco e um sistema operacional realmente leem e
//     gravam, e conta cada página lida e gravada. Em disco, o número de páginas lidas é o custo
//     de uma busca, muito mais que as comparações feitas em memória. Não há cache de propósito:
//     um nó visitado é uma página lida, então o contador mostra a forma real da estrutura.
// ES: El pager es el único código que toca el archivo. Ve el archivo como un vector de páginas
//     de 4096 bytes, la unidad que un disco y un sistema operativo realmente leen y graban, y
//     cuenta cada página leída y grabada. En disco, el número de páginas leídas es el costo de
//     una búsqueda, mucho más que las comparaciones hechas en memoria. No hay caché a propósito:
//     un nodo visitado es una página leída, así que el contador muestra la forma real de la
//     estructura.
pub struct Pager {
    file: File,
    page_count: PageId,
    reads: u64,
    writes: u64,
}

impl Pager {
    /// Creates an empty file, replacing any file at `path`.
    pub fn create(path: &Path) -> io::Result<Self> {
        let file = OpenOptions::new()
            .read(true)
            .write(true)
            .create(true)
            .truncate(true)
            .open(path)?;
        Ok(Self {
            file,
            page_count: 0,
            reads: 0,
            writes: 0,
        })
    }

    /// Opens a file written earlier.
    pub fn open(path: &Path) -> io::Result<Self> {
        let file = OpenOptions::new().read(true).write(true).open(path)?;
        let page_count = file.metadata()?.len() / PAGE_SIZE as u64;
        Ok(Self {
            file,
            page_count,
            reads: 0,
            writes: 0,
        })
    }

    pub fn read(&mut self, id: PageId) -> io::Result<Page> {
        let mut page = [0u8; PAGE_SIZE];
        self.file.read_exact_at(&mut page, id * PAGE_SIZE as u64)?;
        self.reads += 1;
        Ok(page)
    }

    pub fn write(&mut self, id: PageId, page: &Page) -> io::Result<()> {
        self.file.write_all_at(page, id * PAGE_SIZE as u64)?;
        self.writes += 1;
        self.page_count = self.page_count.max(id + 1);
        Ok(())
    }

    // EN: A new page is simply the next position after the end of the file.
    // PT: Uma página nova é simplesmente a próxima posição depois do fim do arquivo.
    // ES: Una página nueva es simplemente la siguiente posición después del final del archivo.
    pub fn append(&mut self) -> PageId {
        self.page_count += 1;
        self.page_count - 1
    }

    pub fn page_count(&self) -> PageId {
        self.page_count
    }

    pub fn reads(&self) -> u64 {
        self.reads
    }

    pub fn writes(&self) -> u64 {
        self.writes
    }
}
