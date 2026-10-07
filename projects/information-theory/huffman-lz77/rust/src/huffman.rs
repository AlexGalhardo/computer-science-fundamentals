use std::cmp::Reverse;
use std::collections::{BinaryHeap, HashMap};

use crate::entropy::byte_counts;
use crate::{DecodeError, read_length};

// EN: File format: 8 bytes with the original size, 256 bytes with the code length of each byte
//     value (0 = the value does not appear), then the codes packed bit by bit. The header costs
//     264 bytes whatever the input, which is why tiny or random files grow when "compressed".
// PT: Formato do arquivo: 8 bytes com o tamanho original, 256 bytes com o comprimento do código
//     de cada valor de byte (0 = o valor não aparece), e depois os códigos empacotados bit a
//     bit. O cabeçalho custa 264 bytes para qualquer entrada, e é por isso que arquivos
//     minúsculos ou aleatórios crescem ao serem "comprimidos".
pub const HEADER_LEN: usize = 8 + 256;

// EN: The Huffman algorithm. Start with one node per byte value that appears, weighted by its
//     count. Repeatedly take the two lightest nodes and join them under a new node whose weight
//     is the sum. Rare values are joined first, so they end up deeper in the tree, and the depth
//     of a leaf is the length of its code. The heap gives the two lightest in O(log n).
//     Ties are broken by node id (byte value for leaves, creation order for joined nodes), so
//     the Rust and the Python versions build exactly the same tree.
// PT: O algoritmo de Huffman. Comece com um nó por valor de byte que aparece, com peso igual à
//     sua contagem. Repetidamente, retire os dois nós mais leves e una-os sob um nó novo cujo
//     peso é a soma. Valores raros são unidos primeiro, então ficam mais fundos na árvore, e a
//     profundidade de uma folha é o comprimento do seu código. O heap entrega os dois mais leves
//     em O(log n). Empates são decididos pelo id do nó (valor do byte nas folhas, ordem de
//     criação nos nós unidos), então as versões em Rust e em Python montam a mesma árvore.
pub fn code_lengths(counts: &[u64; 256]) -> [u8; 256] {
    let mut lengths = [0u8; 256];
    let mut heap: BinaryHeap<Reverse<(u64, usize)>> = counts
        .iter()
        .enumerate()
        .filter(|&(_, &count)| count > 0)
        .map(|(symbol, &count)| Reverse((count, symbol)))
        .collect();

    // EN: A file with one distinct value still needs a 1-bit code: a 0-bit code could not be
    //     told apart from "value absent" in the header.
    // PT: Um arquivo com um único valor distinto ainda precisa de um código de 1 bit: um código
    //     de 0 bit não se distinguiria de "valor ausente" no cabeçalho.
    if heap.len() == 1 {
        let Reverse((_, symbol)) = heap.pop().expect("one node");
        lengths[symbol] = 1;
        return lengths;
    }

    // children[i] holds the two children of the joined node with id 256 + i.
    let mut children: Vec<(usize, usize)> = Vec::new();
    while heap.len() > 1 {
        let Reverse((weight_a, a)) = heap.pop().expect("two nodes");
        let Reverse((weight_b, b)) = heap.pop().expect("two nodes");
        children.push((a, b));
        heap.push(Reverse((weight_a + weight_b, 255 + children.len())));
    }

    // EN: Walk down from the root. Every step down adds one bit to the code.
    // PT: Desce a partir da raiz. Cada passo para baixo acrescenta um bit ao código.
    if let Some(Reverse((_, root))) = heap.pop() {
        let mut stack = vec![(root, 0u8)];
        while let Some((node, depth)) = stack.pop() {
            if node < 256 {
                lengths[node] = depth;
            } else {
                let (a, b) = children[node - 256];
                stack.push((a, depth + 1));
                stack.push((b, depth + 1));
            }
        }
    }
    lengths
}

// EN: Canonical Huffman. The tree itself is not stored: the code lengths are enough, because
//     both sides agree on one rule to turn lengths into codes. Sort the symbols by (length,
//     value) and count upwards, appending zeros whenever the length grows. The result is a
//     prefix code with exactly the lengths the tree gave.
//     Codes are kept in a u64, so lengths up to 63 are supported. A code longer than that would
//     need a file of more than 2^43 bytes, far beyond what this teaching tool reads.
// PT: Huffman canônico. A árvore em si não é gravada: os comprimentos dos códigos bastam, porque
//     os dois lados combinam uma regra para transformar comprimentos em códigos. Ordene os
//     símbolos por (comprimento, valor) e conte para cima, acrescentando zeros sempre que o
//     comprimento cresce. O resultado é um código de prefixo com exatamente os comprimentos que
//     a árvore deu.
//     Os códigos ficam em um u64, então comprimentos até 63 são aceitos. Um código maior que isso
//     exigiria um arquivo de mais de 2^43 bytes, muito além do que esta ferramenta didática lê.
pub fn canonical_codes(lengths: &[u8; 256]) -> [u64; 256] {
    let mut symbols: Vec<usize> = (0..256).filter(|&symbol| lengths[symbol] > 0).collect();
    symbols.sort_by_key(|&symbol| (lengths[symbol], symbol));

    let mut codes = [0u64; 256];
    let mut code = 0u64;
    let mut previous = 0u8;
    for symbol in symbols {
        code <<= lengths[symbol] - previous;
        codes[symbol] = code;
        code += 1;
        previous = lengths[symbol];
    }
    codes
}

pub fn encode(data: &[u8]) -> Vec<u8> {
    let lengths = code_lengths(&byte_counts(data));
    let codes = canonical_codes(&lengths);

    let mut out = Vec::with_capacity(HEADER_LEN + data.len() / 2);
    out.extend_from_slice(&(data.len() as u64).to_le_bytes());
    out.extend_from_slice(&lengths);

    // EN: Bits are written from the most significant bit of each byte. `pending` holds the bits
    //     that do not fill a whole byte yet.
    // PT: Os bits são escritos a partir do bit mais significativo de cada byte. `pending` guarda
    //     os bits que ainda não completam um byte.
    let mut pending = 0u8;
    let mut used = 0u8;
    for &byte in data {
        let (code, length) = (codes[byte as usize], lengths[byte as usize]);
        for shift in (0..length).rev() {
            pending = (pending << 1) | ((code >> shift) & 1) as u8;
            used += 1;
            if used == 8 {
                out.push(pending);
                pending = 0;
                used = 0;
            }
        }
    }
    if used > 0 {
        out.push(pending << (8 - used));
    }
    out
}

pub fn decode(bytes: &[u8]) -> Result<Vec<u8>, DecodeError> {
    let length = read_length(bytes)?;
    let table: &[u8; 256] = bytes
        .get(8..HEADER_LEN)
        .and_then(|slice| slice.try_into().ok())
        .ok_or(DecodeError("missing code length table"))?;
    if table.iter().any(|&bits| bits > 63) {
        return Err(DecodeError("code length above 63 bits"));
    }
    let codes = canonical_codes(table);

    // EN: A prefix code can be decoded greedily: read bits until they form a known code. No
    //     code is the start of another, so the first hit is the right one.
    // PT: Um código de prefixo pode ser decodificado de forma gulosa: leia bits até formarem um
    //     código conhecido. Nenhum código é o começo de outro, então o primeiro acerto é o certo.
    let lookup: HashMap<(u8, u64), u8> = (0..=255u8)
        .filter(|&symbol| table[symbol as usize] > 0)
        .map(|symbol| ((table[symbol as usize], codes[symbol as usize]), symbol))
        .collect();
    let longest = table.iter().copied().max().unwrap_or(0);

    let mut out = Vec::new();
    let mut code = 0u64;
    let mut bits = 0u8;
    'bytes: for &byte in &bytes[HEADER_LEN..] {
        for shift in (0..8).rev() {
            if out.len() as u64 == length {
                break 'bytes;
            }
            code = (code << 1) | u64::from((byte >> shift) & 1);
            bits += 1;
            if let Some(&symbol) = lookup.get(&(bits, code)) {
                out.push(symbol);
                code = 0;
                bits = 0;
            } else if bits >= longest {
                return Err(DecodeError("bits that match no code"));
            }
        }
    }
    if out.len() as u64 != length {
        return Err(DecodeError("body ends before the announced size"));
    }
    Ok(out)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn lengths_for(pairs: &[(u8, u64)]) -> [u8; 256] {
        let mut counts = [0u64; 256];
        for &(symbol, count) in pairs {
            counts[symbol as usize] = count;
        }
        code_lengths(&counts)
    }

    #[test]
    fn lengths_follow_the_frequencies() {
        // EN: A=5, B=2, C=1, D=1: C+D=2, then B+CD=4, then A+4=9. Depths 1, 2, 3, 3.
        // PT: A=5, B=2, C=1, D=1: C+D=2, depois B+CD=4, depois A+4=9. Profundidades 1, 2, 3, 3.
        let lengths = lengths_for(&[(b'A', 5), (b'B', 2), (b'C', 1), (b'D', 1)]);
        assert_eq!(
            [
                lengths[b'A' as usize],
                lengths[b'B' as usize],
                lengths[b'C' as usize],
                lengths[b'D' as usize]
            ],
            [1, 2, 3, 3]
        );
        // 5*1 + 2*2 + 1*3 + 1*3 = 15 bits, so 2 bytes of body.
        assert_eq!(encode(b"AAAAABBCD").len(), HEADER_LEN + 2);
    }

    #[test]
    fn canonical_codes_are_prefix_free() {
        let lengths = lengths_for(&[(b'a', 40), (b'b', 30), (b'c', 15), (b'd', 10), (b'e', 5)]);
        let codes = canonical_codes(&lengths);
        let used: Vec<(u8, u64)> = (0..256)
            .filter(|&symbol| lengths[symbol] > 0)
            .map(|symbol| (lengths[symbol], codes[symbol]))
            .collect();
        assert_eq!(
            used.iter().map(|&(bits, _)| bits).collect::<Vec<_>>(),
            [1, 2, 3, 4, 4]
        );
        for (i, &(short_bits, short)) in used.iter().enumerate() {
            for (j, &(long_bits, long)) in used.iter().enumerate() {
                if i != j && short_bits <= long_bits {
                    assert_ne!(long >> (long_bits - short_bits), short, "{i} starts {j}");
                }
            }
        }
    }

    #[test]
    fn empty_and_single_symbol_round_trip() {
        assert_eq!(encode(&[]).len(), HEADER_LEN);
        assert_eq!(decode(&encode(&[])).unwrap(), Vec::<u8>::new());
        assert_eq!(decode(&encode(b"z")).unwrap(), b"z");
        let run = vec![7u8; 1000];
        // 1000 one-bit codes fit in 125 bytes.
        assert_eq!(encode(&run).len(), HEADER_LEN + 125);
        assert_eq!(decode(&encode(&run)).unwrap(), run);
    }

    #[test]
    fn damaged_input_is_rejected() {
        let encoded = encode(b"compression removes redundancy");
        assert!(decode(&encoded[..5]).is_err());
        assert!(decode(&encoded[..HEADER_LEN - 1]).is_err());
        assert!(decode(&encoded[..encoded.len() - 1]).is_err());
        let mut no_codes = encoded.clone();
        no_codes[8..HEADER_LEN].fill(0);
        assert!(decode(&no_codes).is_err());
    }
}
