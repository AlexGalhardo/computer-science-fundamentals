// EN: Order-0 Shannon entropy, H = sum of p * log2(1/p) over the byte values that appear.
//     "Order 0" means that each byte is looked at alone: only how often a value occurs matters,
//     not what comes before it. The result is the average number of bits per byte that any
//     symbol-by-symbol code (such as Huffman) needs at least. It goes from 0 (one value only)
//     to 8 (all 256 values equally frequent).
// PT: Entropia de Shannon de ordem 0, H = soma de p * log2(1/p) sobre os valores de byte que
//     aparecem. "Ordem 0" significa que cada byte é olhado sozinho: só importa a frequência do
//     valor, e não o que vem antes dele. O resultado é o número médio de bits por byte que
//     qualquer código símbolo a símbolo (como Huffman) precisa no mínimo. Vai de 0 (um único
//     valor) a 8 (os 256 valores igualmente frequentes).
pub fn bits_per_byte(data: &[u8]) -> f64 {
    if data.is_empty() {
        return 0.0;
    }
    let counts = byte_counts(data);
    let total = data.len() as f64;
    counts
        .iter()
        .filter(|&&count| count > 0)
        .map(|&count| {
            let p = count as f64 / total;
            // EN: Written as p * log2(1/p) so that a certain symbol (p = 1) gives +0, not -0.
            // PT: Escrito como p * log2(1/p) para que um símbolo certo (p = 1) dê +0, e não -0.
            p * (1.0 / p).log2()
        })
        .sum()
}

/// EN: The entropy bound for the whole input, in bytes. PT: O limite da entropia para a entrada inteira, em bytes.
pub fn bound_bytes(data: &[u8]) -> f64 {
    bits_per_byte(data) * data.len() as f64 / 8.0
}

pub fn byte_counts(data: &[u8]) -> [u64; 256] {
    let mut counts = [0u64; 256];
    for &byte in data {
        counts[byte as usize] += 1;
    }
    counts
}

#[cfg(test)]
mod tests {
    use super::*;

    fn close(a: f64, b: f64) -> bool {
        (a - b).abs() < 1e-12
    }

    #[test]
    fn single_symbol_has_zero_entropy() {
        assert_eq!(bits_per_byte(&[0x41; 5000]), 0.0);
        assert_eq!(bits_per_byte(b"a"), 0.0);
    }

    #[test]
    fn uniform_bytes_have_eight_bits() {
        let data: Vec<u8> = (0..1024u32).map(|i| (i % 256) as u8).collect();
        assert!(close(bits_per_byte(&data), 8.0));
    }

    #[test]
    fn empty_input_has_zero_entropy() {
        assert_eq!(bits_per_byte(&[]), 0.0);
    }

    #[test]
    fn known_distributions() {
        // EN: 1/2, 1/4, 1/4 gives 1.5 bits; 1/2, 1/4, 1/8, 1/8 gives 1.75 bits.
        // PT: 1/2, 1/4, 1/4 dá 1,5 bit; 1/2, 1/4, 1/8, 1/8 dá 1,75 bit.
        assert!(close(bits_per_byte(b"aabc"), 1.5));
        assert!(close(bits_per_byte(b"aaaabbcd"), 1.75));
        assert!(close(bits_per_byte(b"ab"), 1.0));
        assert!(close(bound_bytes(b"aaaabbcd"), 1.75));
    }
}
