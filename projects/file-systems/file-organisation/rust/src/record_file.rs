use std::fs::{File, OpenOptions};
use std::io::{self, Read, Seek, SeekFrom, Write};
use std::path::{Path, PathBuf};

pub const HEADER_SIZE: u32 = 32;
pub const RECORD_SIZE: u32 = 64;
pub const NO_SLOT: i32 = -1;
pub const LIVE_TAG: u8 = 0x01;
pub const DELETED_TAG: u8 = b'*';
pub const CITY_SIZE: usize = 20;
pub const NAME_SIZE: usize = 37;

pub type Slot = [u8; RECORD_SIZE as usize];

// EN: Integers are stored in little-endian order at fixed offsets. A file written by copying
//     integers straight from memory would depend on the machine. With a fixed byte order, the
//     C++ and the Rust programs of this mini-project read and write exactly the same file.
// PT: Os inteiros são guardados em ordem little-endian em posições fixas. Um arquivo gravado
//     copiando inteiros direto da memória dependeria da máquina. Com a ordem dos bytes fixa, os
//     programas em C++ e em Rust deste mini-projeto leem e gravam exatamente o mesmo arquivo.
pub fn put_u32(bytes: &mut [u8], at: usize, value: u32) {
    bytes[at..at + 4].copy_from_slice(&value.to_le_bytes());
}

pub fn get_u32(bytes: &[u8], at: usize) -> u32 {
    u32::from_le_bytes([bytes[at], bytes[at + 1], bytes[at + 2], bytes[at + 3]])
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Record {
    pub id: u32,
    pub year: u16,
    pub city: String,
    pub name: String,
}

fn invalid(message: &str) -> io::Error {
    io::Error::new(io::ErrorKind::InvalidData, message.to_string())
}

// EN: A fixed-length record: every field has its own fixed position inside the 64 bytes, and
//     text shorter than its field is padded with spaces. The padding is wasted space (internal
//     fragmentation), and it is the price of being able to compute where any record starts.
//     Layout: tag (1 byte), id (4), year (2), city (20), name (37).
// PT: Um registro de tamanho fixo: cada campo tem a sua posição fixa dentro dos 64 bytes, e o
//     texto menor que o campo é completado com espaços. O preenchimento é espaço desperdiçado
//     (fragmentação interna), e é o preço de poder calcular onde qualquer registro começa.
//     Layout: marca (1 byte), id (4), ano (2), cidade (20), nome (37).
pub fn encode(record: &Record) -> io::Result<Slot> {
    if record.city.len() > CITY_SIZE || record.name.len() > NAME_SIZE {
        return Err(io::Error::new(
            io::ErrorKind::InvalidInput,
            "a field is longer than its fixed size",
        ));
    }
    let mut slot = [b' '; RECORD_SIZE as usize];
    slot[0] = LIVE_TAG;
    put_u32(&mut slot, 1, record.id);
    slot[5..7].copy_from_slice(&record.year.to_le_bytes());
    slot[7..7 + record.city.len()].copy_from_slice(record.city.as_bytes());
    slot[27..27 + record.name.len()].copy_from_slice(record.name.as_bytes());
    Ok(slot)
}

pub fn trimmed(bytes: &[u8]) -> String {
    let end = bytes
        .iter()
        .rposition(|&byte| byte != b' ')
        .map_or(0, |at| at + 1);
    String::from_utf8_lossy(&bytes[..end]).into_owned()
}

pub fn decode(slot: &Slot) -> Record {
    Record {
        id: get_u32(slot, 1),
        year: u16::from_le_bytes([slot[5], slot[6]]),
        city: trimmed(&slot[7..7 + CITY_SIZE]),
        name: trimmed(&slot[27..27 + NAME_SIZE]),
    }
}

// EN: The data file: a header record of 32 bytes followed by slots of 64 bytes. The header
//     makes the file describe itself: it holds the record size, how many slots the file has,
//     how many of them are live, and the head of the free list. Because every slot has the
//     same size, the slot with relative record number (RRN) n starts at byte 32 + n x 64, so
//     one seek reaches any record. RRNs start at zero.
// PT: O arquivo de dados: um registro de cabeçalho de 32 bytes seguido de espaços (slots) de
//     64 bytes. O cabeçalho faz o arquivo se descrever: guarda o tamanho do registro, quantos
//     slots o arquivo tem, quantos estão em uso e a cabeça da lista de livres. Como todo slot
//     tem o mesmo tamanho, o slot de número relativo (RRN) n começa no byte 32 + n x 64, então
//     um único seek alcança qualquer registro. Os RRNs começam em zero.
pub struct RecordFile {
    path: PathBuf,
    file: File,
    slot_count: u32,
    live_count: u32,
    free_head: i32,
    slot_reads: u64,
}

impl RecordFile {
    pub fn create(path: &Path) -> io::Result<Self> {
        let file = OpenOptions::new()
            .read(true)
            .write(true)
            .create(true)
            .truncate(true)
            .open(path)?;
        let mut created = Self {
            path: path.to_path_buf(),
            file,
            slot_count: 0,
            live_count: 0,
            free_head: NO_SLOT,
            slot_reads: 0,
        };
        created.write_header()?;
        Ok(created)
    }

    pub fn open(path: &Path) -> io::Result<Self> {
        let mut file = OpenOptions::new().read(true).write(true).open(path)?;
        let mut header = [0u8; HEADER_SIZE as usize];
        file.read_exact(&mut header)?;
        if &header[0..4] != b"FORG" || get_u32(&header, 8) != RECORD_SIZE {
            return Err(invalid("not a record file of this format"));
        }
        Ok(Self {
            path: path.to_path_buf(),
            file,
            slot_count: get_u32(&header, 12),
            live_count: get_u32(&header, 16),
            free_head: get_u32(&header, 20) as i32,
            slot_reads: 0,
        })
    }

    pub fn offset_of(rrn: u32) -> u64 {
        u64::from(HEADER_SIZE) + u64::from(rrn) * u64::from(RECORD_SIZE)
    }

    // EN: Insertion reuses a deleted slot when there is one. The free list is a stack kept
    //     inside the file: the header points to the last slot deleted, and each deleted slot
    //     stores the RRN of the one deleted before it. Popping the top costs one read and two
    //     writes, and the file only grows when the stack is empty.
    // PT: A inserção reaproveita um slot removido quando existe um. A lista de livres é uma
    //     pilha guardada dentro do arquivo: o cabeçalho aponta para o último slot removido, e
    //     cada slot removido guarda o RRN do que foi removido antes dele. Desempilhar o topo
    //     custa uma leitura e duas gravações, e o arquivo só cresce quando a pilha está vazia.
    pub fn insert(&mut self, record: &Record) -> io::Result<u32> {
        let slot = encode(record)?;
        let rrn = if self.free_head != NO_SLOT {
            let rrn = self.free_head as u32;
            let top = self.read_slot(rrn)?;
            self.free_head = get_u32(&top, 1) as i32;
            rrn
        } else {
            self.slot_count += 1;
            self.slot_count - 1
        };
        self.write_slot(rrn, &slot)?;
        self.live_count += 1;
        self.write_header()?;
        Ok(rrn)
    }

    pub fn read(&mut self, rrn: u32) -> io::Result<Option<Record>> {
        if rrn >= self.slot_count {
            return Ok(None);
        }
        let slot = self.read_slot(rrn)?;
        Ok((slot[0] == LIVE_TAG).then(|| decode(&slot)))
    }

    // EN: Deletion does not move anything. It marks the slot with '*', writes the old head of
    //     the free list in it and makes the header point to this slot (a push). The file keeps
    //     its size, and the space comes back on the next insertion.
    // PT: A remoção não move nada. Ela marca o slot com '*', grava nele a cabeça antiga da lista
    //     de livres e faz o cabeçalho apontar para esse slot (um push). O arquivo mantém o
    //     tamanho, e o espaço volta na próxima inserção.
    pub fn remove(&mut self, rrn: u32) -> io::Result<bool> {
        if rrn >= self.slot_count {
            return Ok(false);
        }
        let mut slot = self.read_slot(rrn)?;
        if slot[0] != LIVE_TAG {
            return Ok(false);
        }
        slot[0] = DELETED_TAG;
        put_u32(&mut slot, 1, self.free_head as u32);
        self.write_slot(rrn, &slot)?;
        self.free_head = rrn as i32;
        self.live_count -= 1;
        self.write_header()?;
        Ok(true)
    }

    // EN: Walks the free list from the head, to show the order in which slots will be reused.
    // PT: Percorre a lista de livres a partir da cabeça, para mostrar a ordem de reuso dos slots.
    pub fn free_list(&mut self) -> io::Result<Vec<u32>> {
        let mut list = Vec::new();
        let mut at = self.free_head;
        while at != NO_SLOT {
            list.push(at as u32);
            let slot = self.read_slot(at as u32)?;
            at = get_u32(&slot, 1) as i32;
        }
        Ok(list)
    }

    pub fn file_size(&self) -> io::Result<u64> {
        Ok(std::fs::metadata(&self.path)?.len())
    }

    pub fn slot_count(&self) -> u32 {
        self.slot_count
    }

    pub fn live_count(&self) -> u32 {
        self.live_count
    }

    pub fn free_head(&self) -> i32 {
        self.free_head
    }

    // EN: Slots read from the file: on a disk this count is what a search costs.
    // PT: Slots lidos do arquivo: em um disco, é essa contagem que uma busca custa.
    pub fn slot_reads(&self) -> u64 {
        self.slot_reads
    }

    fn read_slot(&mut self, rrn: u32) -> io::Result<Slot> {
        let mut slot = [0u8; RECORD_SIZE as usize];
        self.file.seek(SeekFrom::Start(Self::offset_of(rrn)))?;
        self.file.read_exact(&mut slot)?;
        self.slot_reads += 1;
        Ok(slot)
    }

    fn write_slot(&mut self, rrn: u32, slot: &Slot) -> io::Result<()> {
        self.file.seek(SeekFrom::Start(Self::offset_of(rrn)))?;
        self.file.write_all(slot)
    }

    fn write_header(&mut self) -> io::Result<()> {
        let mut header = [0u8; HEADER_SIZE as usize];
        header[0..4].copy_from_slice(b"FORG");
        put_u32(&mut header, 4, 1);
        put_u32(&mut header, 8, RECORD_SIZE);
        put_u32(&mut header, 12, self.slot_count);
        put_u32(&mut header, 16, self.live_count);
        put_u32(&mut header, 20, self.free_head as u32);
        self.file.seek(SeekFrom::Start(0))?;
        self.file.write_all(&header)
    }
}
