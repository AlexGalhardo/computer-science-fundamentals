// EN: SHA-256 written by hand, following FIPS 180-4. Rust has no hash function for this in its
//     standard library, and writing these 80 lines shows what a "cryptographic hash" is made of:
//     only 32-bit additions, rotations, shifts and bitwise logic, repeated for 64 rounds. There
//     is no key and no secret. Do not use this copy for anything real: production code uses a
//     reviewed, constant-time, hardware-accelerated library.
// PT: SHA-256 escrito à mão, seguindo a FIPS 180-4. O Rust não tem essa função de hash na
//     biblioteca padrão, e escrever estas 80 linhas mostra do que é feito um "hash
//     criptográfico": só somas de 32 bits, rotações, deslocamentos e lógica de bits, repetidos
//     por 64 rodadas. Não há chave nem segredo. Não use esta cópia para nada real: código de
//     produção usa uma biblioteca revisada, de tempo constante e acelerada por hardware.
// ES: SHA-256 escrito a mano, siguiendo la FIPS 180-4. Rust no tiene esta función hash en su
//     biblioteca estándar, y escribir estas 80 líneas muestra de qué está hecho un "hash
//     criptográfico": solo sumas de 32 bits, rotaciones, desplazamientos y lógica de bits,
//     repetidos durante 64 rondas. No hay clave ni secreto. No uses esta copia para nada real:
//     el código de producción usa una biblioteca revisada, de tiempo constante y acelerada por
//     hardware.

/// First 32 bits of the fractional parts of the cube roots of the first 64 primes.
const K: [u32; 64] = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

/// First 32 bits of the fractional parts of the square roots of the first 8 primes.
const INITIAL: [u32; 8] = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
];

// EN: The compression function: it mixes one 64-byte block into the 8-word state. Every output
//     bit ends up depending on every input bit, which is where the avalanche effect comes from.
// PT: A função de compressão: mistura um bloco de 64 bytes no estado de 8 palavras. Cada bit de
//     saída acaba dependendo de todos os bits de entrada, e é daí que vem o efeito avalanche.
// ES: La función de compresión: mezcla un bloque de 64 bytes en el estado de 8 palabras. Cada
//     bit de salida termina dependiendo de todos los bits de entrada, y de ahí viene el efecto
//     avalancha.
fn compress(state: &mut [u32; 8], block: &[u8; 64]) {
    let mut w = [0u32; 64];
    for (word, bytes) in w.iter_mut().zip(block.as_chunks::<4>().0) {
        *word = u32::from_be_bytes(*bytes);
    }
    for i in 16..64 {
        let s0 = w[i - 15].rotate_right(7) ^ w[i - 15].rotate_right(18) ^ (w[i - 15] >> 3);
        let s1 = w[i - 2].rotate_right(17) ^ w[i - 2].rotate_right(19) ^ (w[i - 2] >> 10);
        w[i] = w[i - 16]
            .wrapping_add(s0)
            .wrapping_add(w[i - 7])
            .wrapping_add(s1);
    }
    let [mut a, mut b, mut c, mut d, mut e, mut f, mut g, mut h] = *state;
    for i in 0..64 {
        let s1 = e.rotate_right(6) ^ e.rotate_right(11) ^ e.rotate_right(25);
        let choice = (e & f) ^ (!e & g);
        let t1 = h
            .wrapping_add(s1)
            .wrapping_add(choice)
            .wrapping_add(K[i])
            .wrapping_add(w[i]);
        let s0 = a.rotate_right(2) ^ a.rotate_right(13) ^ a.rotate_right(22);
        let majority = (a & b) ^ (a & c) ^ (b & c);
        let t2 = s0.wrapping_add(majority);
        h = g;
        g = f;
        f = e;
        e = d.wrapping_add(t1);
        d = c;
        c = b;
        b = a;
        a = t1.wrapping_add(t2);
    }
    for (word, value) in state.iter_mut().zip([a, b, c, d, e, f, g, h]) {
        *word = word.wrapping_add(value);
    }
}

// EN: Padding makes the message a multiple of 64 bytes: one 0x80 byte, zeros, and the message
//     length in bits as a 64-bit number. Because the length is part of the last block, messages
//     of different sizes never share the same padded form.
// PT: O preenchimento torna a mensagem um múltiplo de 64 bytes: um byte 0x80, zeros e o tamanho
//     da mensagem em bits como um número de 64 bits. Como o tamanho faz parte do último bloco,
//     mensagens de tamanhos diferentes nunca têm a mesma forma preenchida.
// ES: El relleno vuelve el mensaje un múltiplo de 64 bytes: un byte 0x80, ceros y el tamaño del
//     mensaje en bits como un número de 64 bits. Como el tamaño forma parte del último bloque,
//     mensajes de distintos tamaños nunca tienen la misma forma rellenada.
pub fn sha256(message: &[u8]) -> [u8; 32] {
    let mut state = INITIAL;
    let (blocks, rest) = message.as_chunks::<64>();
    for block in blocks {
        compress(&mut state, block);
    }
    let mut tail = [0u8; 128];
    tail[..rest.len()].copy_from_slice(rest);
    tail[rest.len()] = 0x80;
    let tail_len = if rest.len() < 56 { 64 } else { 128 };
    let bits = (message.len() as u64).wrapping_mul(8);
    tail[tail_len - 8..tail_len].copy_from_slice(&bits.to_be_bytes());
    for block in tail[..tail_len].as_chunks::<64>().0 {
        compress(&mut state, block);
    }
    let mut digest = [0u8; 32];
    for (bytes, word) in digest.as_chunks_mut::<4>().0.iter_mut().zip(state) {
        *bytes = word.to_be_bytes();
    }
    digest
}

const HEX: &[u8; 16] = b"0123456789abcdef";

pub fn to_hex(digest: &[u8; 32]) -> String {
    let mut text = String::with_capacity(64);
    for byte in digest {
        text.push(HEX[usize::from(byte >> 4)] as char);
        text.push(HEX[usize::from(byte & 0x0f)] as char);
    }
    text
}

/// SHA-256 of a text, as 64 hexadecimal digits.
pub fn sha256_hex(text: &str) -> String {
    to_hex(&sha256(text.as_bytes()))
}
