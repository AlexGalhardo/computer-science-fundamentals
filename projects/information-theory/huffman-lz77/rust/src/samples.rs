// EN: The five sample files are generated, not downloaded, so the table can be reproduced
//     anywhere and nothing is copied from a third party. Each one isolates a kind of redundancy.
// PT: Os cinco arquivos de amostra são gerados, e não baixados, então a tabela pode ser
//     reproduzida em qualquer lugar e nada é copiado de terceiros. Cada um isola um tipo de
//     redundância.
pub const SAMPLE_SIZE: usize = 16 * 1024;
pub const SEED: u64 = 0x001F_07E0;

// EN: A tiny pseudo-random generator (xorshift64*). It is written by hand, with the same
//     constants as the Python version, so both languages produce byte-identical samples. It is
//     good enough for test data and must never be used for security.
// PT: Um gerador pseudoaleatório minúsculo (xorshift64*). É escrito à mão, com as mesmas
//     constantes da versão em Python, então as duas linguagens produzem amostras idênticas byte
//     a byte. Serve para dados de teste e nunca deve ser usado para segurança.
pub struct Rng(u64);

impl Rng {
    pub fn new(seed: u64) -> Self {
        Rng(seed.max(1))
    }

    pub fn next_u64(&mut self) -> u64 {
        self.0 ^= self.0 >> 12;
        self.0 ^= self.0 << 25;
        self.0 ^= self.0 >> 27;
        self.0.wrapping_mul(0x2545_F491_4F6C_DD1D)
    }

    /// EN: A number from 0 to n - 1, from the high bits. PT: Um número de 0 a n - 1, dos bits altos.
    pub fn below(&mut self, n: u64) -> u64 {
        (self.next_u64() >> 33) % n
    }
}

// EN: Words written for this project. Earlier words are drawn more often (see `text`), which
//     imitates the uneven word frequencies of a real language.
// PT: Palavras escritas para este projeto. As primeiras são sorteadas com mais frequência (veja
//     `text`), o que imita as frequências desiguais das palavras de uma língua real.
const WORDS: [&str; 40] = [
    "the",
    "a",
    "of",
    "to",
    "and",
    "in",
    "is",
    "bit",
    "code",
    "byte",
    "symbol",
    "source",
    "tree",
    "short",
    "long",
    "rare",
    "common",
    "entropy",
    "message",
    "window",
    "match",
    "length",
    "prefix",
    "channel",
    "noise",
    "signal",
    "pattern",
    "repeat",
    "count",
    "table",
    "sender",
    "receiver",
    "redundancy",
    "compress",
    "information",
    "frequency",
    "dictionary",
    "literal",
    "offset",
    "decode",
];

pub fn single_symbol() -> Vec<u8> {
    vec![b'a'; SAMPLE_SIZE]
}

// EN: 0, 1, ..., 255, 0, 1, ... Every byte value appears equally often, so the order-0 entropy
//     is the maximum, 8 bits, and Huffman gains nothing. Yet the file is one pattern repeated,
//     which LZ77 sees at once. Entropy of order 0 is a limit for symbol codes only.
// PT: 0, 1, ..., 255, 0, 1, ... Todo valor de byte aparece o mesmo número de vezes, então a
//     entropia de ordem 0 é a máxima, 8 bits, e Huffman não ganha nada. Mas o arquivo é um
//     padrão repetido, que o LZ77 enxerga de imediato. A entropia de ordem 0 é limite apenas
//     para códigos de símbolo.
pub fn byte_cycle() -> Vec<u8> {
    (0..SAMPLE_SIZE).map(|i| (i % 256) as u8).collect()
}

/// EN: Independent random bytes: nothing to remove. PT: Bytes aleatórios independentes: nada a remover.
pub fn random() -> Vec<u8> {
    let mut rng = Rng::new(SEED);
    (0..SAMPLE_SIZE)
        .map(|_| (rng.next_u64() >> 56) as u8)
        .collect()
}

// EN: Independent symbols with probabilities 1/2, 1/4, 1/8, 1/8. The entropy is 1.75 bits and
//     Huffman reaches it, because every probability is a power of 1/2. There is no repeated
//     structure beyond chance, so this is the case where a symbol code is the right tool.
// PT: Símbolos independentes com probabilidades 1/2, 1/4, 1/8, 1/8. A entropia é 1,75 bit e
//     Huffman a atinge, porque toda probabilidade é uma potência de 1/2. Não há estrutura
//     repetida além do acaso, então este é o caso em que um código de símbolo é a ferramenta
//     certa.
pub fn skewed() -> Vec<u8> {
    let mut rng = Rng::new(SEED + 1);
    (0..SAMPLE_SIZE)
        .map(|_| match rng.below(8) {
            0..=3 => b'a',
            4..=5 => b'b',
            6 => b'c',
            _ => b'd',
        })
        .collect()
}

// EN: Word salad with sentence breaks. Taking the smaller of two draws favours the first words
//     of the list. Both redundancies are present: letters have uneven frequencies (Huffman)
//     and whole words repeat (LZ77).
// PT: Sopa de palavras com quebras de frase. Ficar com o menor de dois sorteios favorece as
//     primeiras palavras da lista. As duas redundâncias estão presentes: as letras têm
//     frequências desiguais (Huffman) e palavras inteiras se repetem (LZ77).
pub fn text() -> Vec<u8> {
    let mut rng = Rng::new(SEED + 2);
    let mut out = Vec::with_capacity(SAMPLE_SIZE + 16);
    while out.len() < SAMPLE_SIZE {
        let first = rng.below(WORDS.len() as u64);
        let second = rng.below(WORDS.len() as u64);
        out.extend_from_slice(WORDS[first.min(second) as usize].as_bytes());
        out.extend_from_slice(if rng.below(12) == 0 { b".\n" } else { b" " });
    }
    out.truncate(SAMPLE_SIZE);
    out
}

/// EN: The five samples, in the order of the table. PT: As cinco amostras, na ordem da tabela.
pub fn all() -> Vec<(&'static str, Vec<u8>)> {
    vec![
        ("single-symbol", single_symbol()),
        ("byte-cycle", byte_cycle()),
        ("random", random()),
        ("skewed", skewed()),
        ("text", text()),
    ]
}
