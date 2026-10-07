use std::collections::HashMap;

use crate::{DecodeError, read_length};

// EN: How far back a match may start, and how long it may be. The offset is stored in 2 bytes
//     and the length in 1 byte, so a token (offset, length, literal) takes 4 bytes.
// PT: Até onde para trás uma repetição pode começar, e que comprimento pode ter. O deslocamento
//     ocupa 2 bytes e o comprimento 1 byte, então um token (deslocamento, comprimento, literal)
//     ocupa 4 bytes.
pub const WINDOW: usize = 4096;
pub const MAX_LENGTH: usize = 255;
pub const MIN_LENGTH: usize = 3;
pub const TOKEN_LEN: usize = 4;

// EN: One step of the output: "copy `length` bytes starting `offset` bytes back, then write
//     `literal`". Offset 0 and length 0 mean "nothing to copy, just the literal".
// PT: Um passo da saída: "copie `length` bytes começando `offset` bytes atrás, depois escreva
//     `literal`". Deslocamento 0 e comprimento 0 significam "nada a copiar, só o literal".
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Token {
    pub offset: u16,
    pub length: u8,
    pub literal: u8,
}

// EN: LZ77 uses the data already seen as its dictionary. At each position it looks for the
//     longest stretch, starting inside the window behind it, that equals the bytes ahead.
//     Searching every window position would be slow, so an index remembers where each group
//     of 3 bytes started: any match of 3 bytes or more must begin at one of those places.
//     Candidates are tried from the nearest to the farthest and a longer match wins, so on a
//     tie the nearest one is kept. The Python version follows the same rule and produces the
//     same tokens.
// PT: O LZ77 usa os dados já vistos como dicionário. Em cada posição ele procura o trecho mais
//     longo, começando dentro da janela atrás dela, que seja igual aos bytes à frente. Procurar
//     em todas as posições da janela seria lento, então um índice lembra onde cada grupo de 3
//     bytes começou: toda repetição de 3 bytes ou mais precisa começar em um desses lugares.
//     Os candidatos são testados do mais próximo ao mais distante e uma repetição mais longa
//     vence, então em caso de empate fica a mais próxima. A versão em Python segue a mesma regra
//     e produz os mesmos tokens.
pub fn tokenize(data: &[u8]) -> Vec<Token> {
    let mut tokens = Vec::new();
    let mut index: HashMap<[u8; 3], Vec<usize>> = HashMap::new();
    let mut position = 0;

    while position < data.len() {
        // EN: Every token ends with a literal, so the match must leave one byte for it.
        // PT: Todo token termina com um literal, então a repetição precisa deixar um byte para ele.
        let limit = MAX_LENGTH.min(data.len() - position - 1);
        let mut best_length = 0;
        let mut best_offset = 0;

        if limit >= MIN_LENGTH {
            let key = [data[position], data[position + 1], data[position + 2]];
            for &start in index.get(&key).into_iter().flatten().rev() {
                if position - start > WINDOW {
                    break;
                }
                // EN: The comparison may run past `position`: the copy is allowed to overlap
                //     the bytes it is producing, which is how a long run is encoded.
                // PT: A comparação pode passar de `position`: a cópia pode se sobrepor aos bytes
                //     que ela mesma está produzindo, e é assim que uma sequência longa é
                //     codificada.
                let mut length = 0;
                while length < limit && data[start + length] == data[position + length] {
                    length += 1;
                }
                if length > best_length {
                    best_length = length;
                    best_offset = position - start;
                    if length == limit {
                        break;
                    }
                }
            }
        }

        tokens.push(Token {
            offset: best_offset as u16,
            length: best_length as u8,
            literal: data[position + best_length],
        });

        // EN: Every position that was just consumed becomes a possible start of a later match.
        // PT: Cada posição recém-consumida vira um possível início de uma repetição futura.
        for start in position..=position + best_length {
            if start + MIN_LENGTH <= data.len() {
                let key = [data[start], data[start + 1], data[start + 2]];
                index.entry(key).or_default().push(start);
            }
        }
        position += best_length + 1;
    }
    tokens
}

// EN: File format: 8 bytes with the original size, then 4 bytes per token.
// PT: Formato do arquivo: 8 bytes com o tamanho original, depois 4 bytes por token.
pub fn encode(data: &[u8]) -> Vec<u8> {
    let tokens = tokenize(data);
    let mut out = Vec::with_capacity(8 + tokens.len() * TOKEN_LEN);
    out.extend_from_slice(&(data.len() as u64).to_le_bytes());
    for token in tokens {
        out.extend_from_slice(&token.offset.to_le_bytes());
        out.push(token.length);
        out.push(token.literal);
    }
    out
}

// EN: Decoding needs no search and no index: it only copies. That is why LZ77 decompression is
//     much faster than compression.
// PT: Decodificar não exige busca nem índice: só copia. É por isso que a descompressão do LZ77
//     é muito mais rápida que a compressão.
pub fn expand(tokens: &[Token]) -> Result<Vec<u8>, DecodeError> {
    let mut out: Vec<u8> = Vec::new();
    for token in tokens {
        let offset = token.offset as usize;
        if token.length > 0 && (offset == 0 || offset > out.len()) {
            return Err(DecodeError("offset points outside the data"));
        }
        // EN: One byte at a time on purpose: with length > offset the copy reads bytes that
        //     this same loop has just written.
        // PT: Um byte por vez de propósito: com comprimento > deslocamento a cópia lê bytes que
        //     este mesmo laço acabou de escrever.
        for _ in 0..token.length {
            out.push(out[out.len() - offset]);
        }
        out.push(token.literal);
    }
    Ok(out)
}

pub fn decode(bytes: &[u8]) -> Result<Vec<u8>, DecodeError> {
    let length = read_length(bytes)?;
    let (chunks, rest) = bytes[8..].as_chunks::<TOKEN_LEN>();
    if !rest.is_empty() {
        return Err(DecodeError("incomplete token"));
    }
    let tokens: Vec<Token> = chunks
        .iter()
        .map(|chunk| Token {
            offset: u16::from_le_bytes([chunk[0], chunk[1]]),
            length: chunk[2],
            literal: chunk[3],
        })
        .collect();
    let out = expand(&tokens)?;
    if out.len() as u64 != length {
        return Err(DecodeError("size differs from the announced size"));
    }
    Ok(out)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn token(offset: u16, length: u8, literal: u8) -> Token {
        Token {
            offset,
            length,
            literal,
        }
    }

    #[test]
    fn overlapping_copy_repeats_the_pattern() {
        let tokens = [token(0, 0, b'a'), token(0, 0, b'b'), token(2, 4, b'c')];
        assert_eq!(expand(&tokens).unwrap(), b"abababc");
    }

    #[test]
    fn a_run_becomes_one_overlapping_token() {
        // EN: 'a', then "copy 8 bytes from 1 back", then the final literal.
        // PT: 'a', depois "copie 8 bytes de 1 atrás", depois o literal final.
        assert_eq!(
            tokenize(b"aaaaaaaaaa"),
            [token(0, 0, b'a'), token(1, 8, b'a')]
        );
    }

    #[test]
    fn repeated_stretch_points_back() {
        let tokens = tokenize(b"abcdefabcdefX");
        assert_eq!(tokens.len(), 7);
        assert_eq!(tokens[6], token(6, 6, b'X'));
    }

    #[test]
    fn data_without_repetition_grows_four_times() {
        let data: Vec<u8> = (0..=255).collect();
        assert_eq!(encode(&data).len(), 8 + 4 * 256);
    }

    #[test]
    fn empty_and_tiny_inputs_round_trip() {
        assert_eq!(encode(&[]).len(), 8);
        for input in [&b""[..], b"a", b"ab", b"aaa", b"aaaa", b"abcabc"] {
            assert_eq!(decode(&encode(input)).unwrap(), input);
        }
    }

    #[test]
    fn damaged_input_is_rejected() {
        let encoded = encode(b"abcabcabcabc");
        assert!(decode(&encoded[..4]).is_err());
        assert!(decode(&encoded[..encoded.len() - 1]).is_err());
        assert!(decode(&encoded[..encoded.len() - 4]).is_err());
        assert!(expand(&[token(1, 1, b'a')]).is_err());
        assert!(expand(&[token(0, 0, b'a'), token(0, 2, b'b')]).is_err());
    }
}
