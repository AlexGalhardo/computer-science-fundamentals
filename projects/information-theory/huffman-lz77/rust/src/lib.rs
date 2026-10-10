// EN: Three small pieces that answer one question: how far can a file shrink? `entropy`
//     measures the limit, `huffman` removes the redundancy of uneven symbol frequencies, and
//     `lz77` removes the redundancy of repeated stretches. `samples` builds the test files and
//     `report` puts the numbers side by side.
// PT: Três peças pequenas que respondem a uma pergunta: até onde um arquivo pode encolher?
//     `entropy` mede o limite, `huffman` remove a redundância das frequências desiguais dos
//     símbolos, e `lz77` remove a redundância dos trechos repetidos. `samples` monta os arquivos
//     de teste e `report` coloca os números lado a lado.
// ES: Tres piezas pequeñas que responden una pregunta: ¿hasta dónde puede encogerse un archivo?
//     `entropy` mide el límite, `huffman` elimina la redundancia de las frecuencias desiguales
//     de los símbolos, y `lz77` elimina la redundancia de los tramos repetidos. `samples` arma
//     los archivos de prueba y `report` pone los números lado a lado.
pub mod entropy;
pub mod huffman;
pub mod lz77;
pub mod report;
pub mod samples;

use std::fmt;

/// EN: Why a compressed input could not be decoded. PT: Por que uma entrada não pôde ser decodificada.
/// ES: Por qué una entrada comprimida no pudo decodificarse.
#[derive(Debug, PartialEq, Eq)]
pub struct DecodeError(pub &'static str);

impl fmt::Display for DecodeError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "invalid compressed data: {}", self.0)
    }
}

impl std::error::Error for DecodeError {}

// EN: Both formats start with the original size as 8 little-endian bytes. Huffman needs it to
//     know where to stop, because the last byte of the body is padded with zero bits.
// PT: Os dois formatos começam com o tamanho original em 8 bytes little-endian. Huffman precisa
//     dele para saber onde parar, porque o último byte do corpo é completado com bits zero.
// ES: Los dos formatos empiezan con el tamaño original en 8 bytes little-endian. Huffman lo
//     necesita para saber dónde detenerse, porque el último byte del cuerpo se completa con
//     bits cero.
pub(crate) fn read_length(bytes: &[u8]) -> Result<u64, DecodeError> {
    let head: [u8; 8] = bytes
        .get(..8)
        .and_then(|slice| slice.try_into().ok())
        .ok_or(DecodeError("missing length header"))?;
    Ok(u64::from_le_bytes(head))
}
