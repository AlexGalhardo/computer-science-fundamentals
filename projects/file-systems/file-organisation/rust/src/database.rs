use std::io;
use std::path::{Path, PathBuf};

use crate::indexes::{PrimaryIndex, SecondaryIndex, match_lists};
use crate::record_file::{Record, RecordFile};

// EN: The canonical form of a key: one agreed spelling, applied before storing and before
//     searching. Without it "Recife", "RECIFE" and "recife " would be three different keys.
// PT: A forma canônica de uma chave: uma única grafia combinada, aplicada antes de gravar e
//     antes de buscar. Sem ela, "Recife", "RECIFE" e "recife " seriam três chaves diferentes.
pub fn canonical(text: &str) -> String {
    text.trim_matches(' ').to_ascii_uppercase()
}

// EN: The data file together with its indexes: a primary index by id and two secondary
//     indexes, by city and by year. The indexes live in memory while the files are open and
//     are written to disk by close().
// PT: O arquivo de dados junto com os seus índices: um índice primário por id e dois índices
//     secundários, por cidade e por ano. Os índices ficam na memória enquanto os arquivos estão
//     abertos e são gravados em disco por close().
pub struct Database {
    directory: PathBuf,
    file: RecordFile,
    primary: PrimaryIndex,
    by_city: SecondaryIndex,
    by_year: SecondaryIndex,
    rebuilt: bool,
    stale_on_disk: bool,
}

fn read_or_empty(path: &Path) -> Vec<u8> {
    std::fs::read(path).unwrap_or_default()
}

impl Database {
    pub fn open(directory: &Path) -> io::Result<Self> {
        std::fs::create_dir_all(directory)?;
        let data = directory.join("records.dat");
        let file = if data.exists() {
            RecordFile::open(&data)?
        } else {
            RecordFile::create(&data)?
        };
        let mut db = Self {
            directory: directory.to_path_buf(),
            file,
            primary: PrimaryIndex::default(),
            by_city: SecondaryIndex::default(),
            by_year: SecondaryIndex::default(),
            rebuilt: false,
            stale_on_disk: false,
        };
        // EN: The indexes on disk are trusted only when the out-of-date flag is clear. If the
        //     last session ended without close(), the flag is still set and everything is
        //     rebuilt from the data file, which is the only source of truth.
        // PT: Os índices em disco só são aceitos quando o indicador de desatualizado está
        //     limpo. Se a última sessão terminou sem close(), o indicador continua ligado e
        //     tudo é reconstruído a partir do arquivo de dados, a única fonte da verdade.
        let loaded = db
            .primary
            .load_bytes(&read_or_empty(&db.path("primary.idx")))
            && db.by_city.load_bytes(
                &read_or_empty(&db.path("city.sec")),
                &read_or_empty(&db.path("city.lst")),
            )
            && db.by_year.load_bytes(
                &read_or_empty(&db.path("year.sec")),
                &read_or_empty(&db.path("year.lst")),
            );
        if !loaded {
            db.rebuild()?;
        }
        db.rebuilt = !loaded;
        Ok(db)
    }

    pub fn insert(&mut self, record: &Record) -> io::Result<bool> {
        let stored = Record {
            city: canonical(&record.city),
            ..record.clone()
        };
        if self.primary.find(stored.id).is_some() {
            return Ok(false);
        }
        self.mark_stale()?;
        let rrn = self.file.insert(&stored)?;
        self.primary.insert(stored.id, rrn);
        self.by_city.add(&stored.city, stored.id);
        self.by_year.add(&stored.year.to_string(), stored.id);
        Ok(true)
    }

    // EN: Removal touches the data file and the primary index only. The secondary lists keep
    //     the primary key of the removed record, and the searches below drop it when the
    //     primary index no longer knows that key. This is what late binding buys.
    // PT: A remoção mexe só no arquivo de dados e no índice primário. As listas secundárias
    //     continuam com a chave primária do registro removido, e as buscas abaixo a descartam
    //     quando o índice primário não conhece mais essa chave. É o ganho da ligação tardia.
    pub fn remove(&mut self, id: u32) -> io::Result<bool> {
        let Some(rrn) = self.primary.find(id) else {
            return Ok(false);
        };
        self.mark_stale()?;
        self.file.remove(rrn)?;
        self.primary.erase(id);
        Ok(true)
    }

    pub fn find(&mut self, id: u32) -> io::Result<Option<Record>> {
        match self.primary.find(id) {
            Some(rrn) => self.file.read(rrn),
            None => Ok(None),
        }
    }

    pub fn find_by_city(&mut self, city: &str) -> io::Result<Vec<Record>> {
        let key = canonical(city);
        let ids = self.by_city.ids(&key);
        self.fetch(&ids, |record| record.city == key)
    }

    pub fn find_by_year(&mut self, year: u16) -> io::Result<Vec<Record>> {
        let ids = self.by_year.ids(&year.to_string());
        self.fetch(&ids, |record| record.year == year)
    }

    pub fn find_by_city_and_year(&mut self, city: &str, year: u16) -> io::Result<Vec<Record>> {
        let key = canonical(city);
        let ids = match_lists(
            &self.by_city.ids(&key),
            &self.by_year.ids(&year.to_string()),
        );
        self.fetch(&ids, |record| record.city == key && record.year == year)
    }

    // EN: The search with no index: read every slot of the file and keep the records that
    //     match. It is the reference the index searches are compared with, and its cost is the
    //     number of slots in the file, whatever the number of matches.
    // PT: A busca sem índice: ler todos os slots do arquivo e ficar com os registros que
    //     atendem. É a referência com que as buscas por índice são comparadas, e o seu custo é
    //     o número de slots do arquivo, qualquer que seja o número de resultados.
    pub fn scan(&mut self, matches: impl Fn(&Record) -> bool) -> io::Result<Vec<Record>> {
        let mut found = Vec::new();
        for rrn in 0..self.file.slot_count() {
            if let Some(record) = self.file.read(rrn)?
                && matches(&record)
            {
                found.push(record);
            }
        }
        Ok(found)
    }

    pub fn close(&mut self) -> io::Result<()> {
        std::fs::write(self.path("city.sec"), self.by_city.keys_to_bytes())?;
        std::fs::write(self.path("city.lst"), self.by_city.nodes_to_bytes())?;
        std::fs::write(self.path("year.sec"), self.by_year.keys_to_bytes())?;
        std::fs::write(self.path("year.lst"), self.by_year.nodes_to_bytes())?;
        std::fs::write(self.path("primary.idx"), self.primary.to_bytes(false))?;
        self.stale_on_disk = false;
        Ok(())
    }

    pub fn file(&mut self) -> &mut RecordFile {
        &mut self.file
    }

    pub fn primary(&mut self) -> &mut PrimaryIndex {
        &mut self.primary
    }

    pub fn by_city(&self) -> &SecondaryIndex {
        &self.by_city
    }

    pub fn rebuilt_on_open(&self) -> bool {
        self.rebuilt
    }

    pub fn path(&self, name: &str) -> PathBuf {
        self.directory.join(name)
    }

    // EN: Before the first change of a session, the flag in the index file is set on disk. If
    //     the program dies before close(), the next session finds the flag and knows that the
    //     index files do not match the data.
    // PT: Antes da primeira alteração de uma sessão, o indicador do arquivo de índice é ligado
    //     em disco. Se o programa morrer antes de close(), a próxima sessão encontra o
    //     indicador e sabe que os arquivos de índice não correspondem aos dados.
    fn mark_stale(&mut self) -> io::Result<()> {
        if !self.stale_on_disk {
            std::fs::write(
                self.path("primary.idx"),
                PrimaryIndex::default().to_bytes(true),
            )?;
            self.stale_on_disk = true;
        }
        Ok(())
    }

    fn rebuild(&mut self) -> io::Result<()> {
        self.primary.clear();
        self.by_city.clear();
        self.by_year.clear();
        for rrn in 0..self.file.slot_count() {
            if let Some(record) = self.file.read(rrn)? {
                self.primary.insert(record.id, rrn);
                self.by_city.add(&record.city, record.id);
                self.by_year.add(&record.year.to_string(), record.id);
            }
        }
        Ok(())
    }

    // EN: From primary keys to records: each key goes through the primary index to find the
    //     RRN, then one slot is read. A key that is gone, or whose record no longer has the
    //     searched value (the id was reused with other data), is skipped.
    // PT: Das chaves primárias aos registros: cada chave passa pelo índice primário para achar
    //     o RRN, e então um slot é lido. Uma chave que não existe mais, ou cujo registro não tem
    //     mais o valor buscado (o id foi reutilizado com outros dados), é ignorada.
    fn fetch(
        &mut self,
        ids: &[u32],
        still_matches: impl Fn(&Record) -> bool,
    ) -> io::Result<Vec<Record>> {
        let mut found = Vec::new();
        for &id in ids {
            if let Some(record) = self.find(id)?
                && still_matches(&record)
            {
                found.push(record);
            }
        }
        Ok(found)
    }
}
