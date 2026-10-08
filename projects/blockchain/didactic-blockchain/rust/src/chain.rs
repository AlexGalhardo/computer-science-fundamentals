use crate::sha256::{sha256, sha256_hex, to_hex};
use std::fmt::Write;

// EN: The Rust side covers the part of the lesson where the language matters: hashing, the
//     Merkle root, proof of work and the validation that makes the chain tamper-evident. A
//     transaction here is just a line of text identified by its hash. Signatures, unspent
//     outputs and the network of nodes are in the TypeScript reference.
// PT: O lado em Rust cobre a parte da lição em que a linguagem faz diferença: hash, raiz de
//     Merkle, prova de trabalho e a validação que torna a adulteração evidente. Uma transação
//     aqui é só uma linha de texto identificada pelo seu hash. Assinaturas, saídas não gastas e
//     a rede de nós estão na referência em TypeScript.

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Header {
    pub height: u64,
    pub previous_hash: String,
    pub merkle_root: String,
    pub timestamp: u64,
    /// Zero hexadecimal digits the block hash must start with.
    pub difficulty: u32,
    pub nonce: u64,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Block {
    pub header: Header,
    pub hash: String,
    pub transactions: Vec<String>,
}

#[derive(Debug, PartialEq, Eq)]
pub struct ChainError {
    pub height: u64,
    pub reason: &'static str,
}

// EN: Same convention as the TypeScript reference, so both give the same root: leaves are the
//     hashes of the transactions, a parent is the hash of the two children's hex texts joined,
//     and a level with an odd number of nodes duplicates its last node.
// PT: Mesma convenção da referência em TypeScript, então as duas dão a mesma raiz: as folhas são
//     os hashes das transações, um pai é o hash dos textos hexadecimais dos dois filhos
//     concatenados, e um nível com número ímpar de nós duplica o último.
pub fn merkle_root(leaves: &[String]) -> String {
    if leaves.is_empty() {
        return sha256_hex("");
    }
    let mut level = leaves.to_vec();
    while level.len() > 1 {
        level = level
            .chunks(2)
            .map(|pair| {
                let left = &pair[0];
                let right = pair.get(1).unwrap_or(left);
                sha256_hex(&format!("{left}{right}"))
            })
            .collect();
    }
    level.remove(0)
}

pub fn transaction_ids(transactions: &[String]) -> Vec<String> {
    transactions.iter().map(|tx| sha256_hex(tx)).collect()
}

/// Everything of the header except the nonce, as the same line of text the TypeScript side builds.
fn header_prefix(header: &Header) -> String {
    format!(
        "{}|{}|{}|{}|{}|",
        header.height,
        header.previous_hash,
        header.merkle_root,
        header.timestamp,
        header.difficulty
    )
}

// EN: The block hash covers only the header, which holds the previous hash (the link) and the
//     Merkle root (the fingerprint of the transactions).
// PT: O hash do bloco cobre só o cabeçalho, que guarda o hash anterior (o elo) e a raiz de
//     Merkle (a impressão digital das transações).
pub fn header_hash(header: &Header) -> String {
    sha256_hex(&format!("{}{}", header_prefix(header), header.nonce))
}

// EN: A hexadecimal digit is 4 bits, so "d zero digits" means d/2 zero bytes plus, when d is
//     odd, a zero high half in the next byte. Checking the raw bytes avoids building the hex
//     text on every attempt.
// PT: Um dígito hexadecimal são 4 bits, então "d dígitos zero" significa d/2 bytes zero mais,
//     quando d é ímpar, a metade alta do byte seguinte zerada. Conferir os bytes crus evita
//     montar o texto hexadecimal a cada tentativa.
fn digest_meets(digest: &[u8; 32], difficulty: u32) -> bool {
    let digits = (difficulty as usize).min(64);
    let full = digits / 2;
    digest[..full].iter().all(|byte| *byte == 0)
        && (digits.is_multiple_of(2) || digest[full] >> 4 == 0)
}

pub fn meets_difficulty(hash: &str, difficulty: u32) -> bool {
    hash.len() == 64
        && hash
            .bytes()
            .take(difficulty as usize)
            .all(|digit| digit == b'0')
}

pub struct Mined {
    pub header: Header,
    pub hash: String,
    /// How many nonces were tried, including the one that worked.
    pub attempts: u64,
}

// EN: Proof of work: try nonces until the hash starts with the required zeros. About 16^d
//     attempts on average, one hash to check. The buffer is reused between attempts, so the
//     loop allocates nothing.
// PT: Prova de trabalho: testa nonces até o hash começar com os zeros exigidos. Cerca de 16^d
//     tentativas em média, um hash para conferir. O buffer é reaproveitado entre as tentativas,
//     então o laço não aloca nada.
pub fn mine(mut header: Header) -> Mined {
    let mut text = header_prefix(&header);
    let prefix_len = text.len();
    let mut nonce: u64 = 0;
    loop {
        text.truncate(prefix_len);
        // Writing to a String cannot fail.
        let _ = write!(text, "{nonce}");
        let digest = sha256(text.as_bytes());
        if digest_meets(&digest, header.difficulty) {
            header.nonce = nonce;
            return Mined {
                header,
                hash: to_hex(&digest),
                attempts: nonce + 1,
            };
        }
        nonce += 1;
    }
}

// EN: The fixed starting point, identical to the genesis block of the TypeScript reference.
// PT: O ponto de partida fixo, idêntico ao bloco gênese da referência em TypeScript.
pub fn genesis() -> Block {
    let header = Header {
        height: 0,
        previous_hash: "0".repeat(64),
        merkle_root: merkle_root(&[]),
        timestamp: 0,
        difficulty: 0,
        nonce: 0,
    };
    Block {
        hash: header_hash(&header),
        header,
        transactions: Vec::new(),
    }
}

/// Mines a block with these transactions on top of the last block of the chain.
pub fn add_block(
    chain: &mut Vec<Block>,
    transactions: Vec<String>,
    timestamp: u64,
    difficulty: u32,
) {
    let (height, previous_hash) = match chain.last() {
        Some(tip) => (tip.header.height + 1, tip.hash.clone()),
        None => {
            chain.push(genesis());
            return add_block(chain, transactions, timestamp, difficulty);
        }
    };
    let mined = mine(Header {
        height,
        previous_hash,
        merkle_root: merkle_root(&transaction_ids(&transactions)),
        timestamp,
        difficulty,
        nonce: 0,
    });
    chain.push(Block {
        header: mined.header,
        hash: mined.hash,
        transactions,
    });
}

// EN: Replays the chain from the genesis block. Changing one transaction breaks the Merkle root
//     of its block. Fixing the root changes the block hash, which breaks the proof of work.
//     Redoing the proof of work breaks the link from the next block. So rewriting an old block
//     means redoing the work of every block after it.
// PT: Reexecuta a cadeia a partir do bloco gênese. Mudar uma transação quebra a raiz de Merkle
//     do bloco. Consertar a raiz muda o hash do bloco, o que quebra a prova de trabalho. Refazer
//     a prova de trabalho quebra a ligação a partir do bloco seguinte. Logo, reescrever um
//     bloco antigo significa refazer o trabalho de todos os blocos depois dele.
pub fn validate(chain: &[Block], difficulty: u32) -> Result<(), ChainError> {
    let fail = |height, reason| Err(ChainError { height, reason });
    let Some(first) = chain.first() else {
        return fail(0, "chain is empty");
    };
    if *first != genesis() {
        return fail(0, "chain does not start at the genesis block");
    }
    for pair in chain.windows(2) {
        let (previous, block) = (&pair[0], &pair[1]);
        let height = previous.header.height + 1;
        if block.header.height != height {
            return fail(height, "height is not the previous height plus one");
        }
        if block.header.previous_hash != previous.hash {
            return fail(
                height,
                "previous hash does not match the hash of the previous block",
            );
        }
        if block.header.difficulty != difficulty {
            return fail(height, "difficulty is not the one required by the rules");
        }
        if block.hash != header_hash(&block.header) {
            return fail(height, "block hash does not match its header");
        }
        if !meets_difficulty(&block.hash, difficulty) {
            return fail(
                height,
                "block hash does not meet the difficulty (no proof of work)",
            );
        }
        if block.header.merkle_root != merkle_root(&transaction_ids(&block.transactions)) {
            return fail(height, "Merkle root does not match the transactions");
        }
    }
    Ok(())
}
