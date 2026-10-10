use std::cmp::Reverse;
use std::collections::BinaryHeap;
use std::io;

use crate::record_file::{get_u32, put_u32};

pub const RUN_MARKER: u8 = 0xFF;
pub const MIN_RUN: usize = 4;
pub const HUFFMAN_HEADER: usize = 8 + 256 * 4;

fn truncated(what: &str) -> io::Error {
    io::Error::new(io::ErrorKind::InvalidData, format!("truncated {what} data"))
}

// EN: Run-length encoding. A run of 4 or more equal bytes becomes 3 bytes: the marker 0xFF,
//     the value and the count (up to 255). Shorter runs are copied as they are, because the
//     code would be longer than the run. A data byte equal to the marker is always written as
//     a run, even of length 1, so the decoder can never mistake it for a marker. Fixed-length
//     records are full of padding, which is exactly the kind of data this method shrinks.
// PT: Codificação run-length. Uma sequência de 4 ou mais bytes iguais vira 3 bytes: o marcador
//     0xFF, o valor e a contagem (até 255). Sequências menores são copiadas como estão, porque
//     o código seria maior que a sequência. Um byte de dado igual ao marcador é sempre gravado
//     como sequência, mesmo de tamanho 1, para o decodificador nunca confundi-lo com um
//     marcador. Registros de tamanho fixo são cheios de preenchimento, que é exatamente o tipo
//     de dado que este método encolhe.
// ES: Codificación run-length. Una secuencia de 4 o más bytes iguales se convierte en 3 bytes:
//     el marcador 0xFF, el valor y la cuenta (hasta 255). Las secuencias menores se copian tal
//     cual, porque el código sería mayor que la secuencia. Un byte de dato igual al marcador se
//     escribe siempre como secuencia, incluso de longitud 1, para que el decodificador nunca lo
//     confunda con un marcador. Los registros de tamaño fijo están llenos de relleno, que es
//     exactamente el tipo de dato que este método encoge.
pub fn rle_encode(input: &[u8]) -> Vec<u8> {
    let mut output = Vec::new();
    let mut at = 0;
    while at < input.len() {
        let value = input[at];
        let mut run = 1;
        while at + run < input.len() && input[at + run] == value && run < 255 {
            run += 1;
        }
        if run >= MIN_RUN || value == RUN_MARKER {
            output.extend_from_slice(&[RUN_MARKER, value, run as u8]);
        } else {
            output.extend(std::iter::repeat_n(value, run));
        }
        at += run;
    }
    output
}

pub fn rle_decode(input: &[u8]) -> io::Result<Vec<u8>> {
    let mut output = Vec::new();
    let mut at = 0;
    while at < input.len() {
        if input[at] != RUN_MARKER {
            output.push(input[at]);
            at += 1;
            continue;
        }
        if at + 2 >= input.len() {
            return Err(truncated("run-length"));
        }
        output.extend(std::iter::repeat_n(
            input[at + 1],
            usize::from(input[at + 2]),
        ));
        at += 3;
    }
    Ok(output)
}

// EN: The Huffman tree. Leaves 0 to 255 are the byte values, and internal nodes get the
//     numbers 256, 257 and so on, in the order they are created. The two nodes of lowest
//     frequency are joined again and again until one tree is left, so frequent bytes end up
//     near the root with short codes. Ties are broken by node number, which makes the C++ and
//     the Rust programs build the same tree and write the same bytes.
// PT: A árvore de Huffman. As folhas 0 a 255 são os valores de byte, e os nós internos recebem
//     os números 256, 257 e assim por diante, na ordem em que são criados. Os dois nós de
//     menor frequência são unidos repetidamente até sobrar uma árvore, então os bytes
//     frequentes ficam perto da raiz, com códigos curtos. Os empates são decididos pelo número
//     do nó, o que faz os programas em C++ e em Rust montarem a mesma árvore e gravarem os
//     mesmos bytes.
// ES: El árbol de Huffman. Las hojas 0 a 255 son los valores de byte, y los nodos internos
//     reciben los números 256, 257 y así sucesivamente, en el orden en que se crean. Los dos
//     nodos de menor frecuencia se unen repetidamente hasta que queda un árbol, así que los
//     bytes frecuentes quedan cerca de la raíz, con códigos cortos. Los empates los decide el
//     número del nodo, lo que hace que los programas en C++ y en Rust armen el mismo árbol y
//     escriban los mismos bytes.
#[derive(Debug, Default)]
pub struct HuffmanTree {
    /// `None` when the input is empty.
    pub root: Option<usize>,
    children: Vec<(usize, usize)>,
}

impl HuffmanTree {
    pub fn is_leaf(&self, node: usize) -> bool {
        node < 256
    }

    pub fn left(&self, node: usize) -> usize {
        self.children[node - 256].0
    }

    pub fn right(&self, node: usize) -> usize {
        self.children[node - 256].1
    }
}

pub fn build_tree(frequency: &[u32; 256]) -> HuffmanTree {
    let mut queue = BinaryHeap::new();
    for (symbol, &count) in frequency.iter().enumerate() {
        if count > 0 {
            queue.push(Reverse((u64::from(count), symbol)));
        }
    }
    let mut tree = HuffmanTree::default();
    while queue.len() > 1 {
        let Some(Reverse(first)) = queue.pop() else {
            break;
        };
        let Some(Reverse(second)) = queue.pop() else {
            break;
        };
        let node = 256 + tree.children.len();
        tree.children.push((first.1, second.1));
        queue.push(Reverse((first.0 + second.0, node)));
    }
    tree.root = queue.pop().map(|Reverse((_, node))| node);
    tree
}

// EN: The code of a byte is the path from the root to its leaf: 0 for left, 1 for right. No
//     code is the beginning of another one, because symbols are only at the leaves. A file
//     with a single distinct byte has a tree with one node, and that byte gets the code "0".
// PT: O código de um byte é o caminho da raiz até a sua folha: 0 para a esquerda, 1 para a
//     direita. Nenhum código é o começo de outro, porque os símbolos só ficam nas folhas. Um
//     arquivo com um único byte distinto tem uma árvore de um nó, e esse byte recebe o código "0".
// ES: El código de un byte es el camino desde la raíz hasta su hoja: 0 a la izquierda, 1 a la
//     derecha. Ningún código es el comienzo de otro, porque los símbolos solo están en las
//     hojas. Un archivo con un único byte distinto tiene un árbol de un nodo, y ese byte recibe
//     el código "0".
pub fn code_table(tree: &HuffmanTree) -> Vec<Vec<u8>> {
    let mut codes = vec![Vec::new(); 256];
    let Some(root) = tree.root else { return codes };
    if tree.is_leaf(root) {
        codes[root] = vec![0];
        return codes;
    }
    let mut stack = vec![(root, Vec::new())];
    while let Some((node, mut path)) = stack.pop() {
        if tree.is_leaf(node) {
            codes[node] = path;
            continue;
        }
        let mut right_path = path.clone();
        right_path.push(1);
        path.push(0);
        stack.push((tree.left(node), path));
        stack.push((tree.right(node), right_path));
    }
    codes
}

pub fn count_bytes(input: &[u8]) -> [u32; 256] {
    let mut frequency = [0u32; 256];
    for &byte in input {
        frequency[usize::from(byte)] += 1;
    }
    frequency
}

// EN: Compressed format: the original length (8 bytes), the 256 frequencies (4 bytes each) and
//     then the codes, packed from the most significant bit of each byte. The decoder rebuilds
//     the same tree from the frequencies, so the code table itself is not stored. The 1,032
//     bytes of header are why Huffman coding does not pay for very small files.
// PT: Formato comprimido: o tamanho original (8 bytes), as 256 frequências (4 bytes cada) e
//     depois os códigos, empacotados a partir do bit mais significativo de cada byte. O
//     decodificador refaz a mesma árvore a partir das frequências, então a tabela de códigos
//     não é gravada. Os 1.032 bytes de cabeçalho são o motivo de Huffman não compensar em
//     arquivos muito pequenos.
// ES: Formato comprimido: el tamaño original (8 bytes), las 256 frecuencias (4 bytes cada una) y
//     después los códigos, empaquetados desde el bit más significativo de cada byte. El
//     decodificador rehace el mismo árbol a partir de las frecuencias, así que la tabla de
//     códigos no se escribe. Los 1.032 bytes de cabecera son la razón de que Huffman no
//     compense en archivos muy pequeños.
pub fn huffman_encode(input: &[u8]) -> io::Result<Vec<u8>> {
    let length = u32::try_from(input.len()).map_err(|_| {
        io::Error::new(
            io::ErrorKind::InvalidInput,
            "input too large for 32-bit frequencies",
        )
    })?;
    let frequency = count_bytes(input);
    let codes = code_table(&build_tree(&frequency));
    let mut output = vec![0u8; HUFFMAN_HEADER];
    put_u32(&mut output, 0, length);
    for (symbol, &count) in frequency.iter().enumerate() {
        put_u32(&mut output, 8 + symbol * 4, count);
    }
    let mut pending = 0u8;
    let mut used = 0;
    for &byte in input {
        for &bit in &codes[usize::from(byte)] {
            pending = (pending << 1) | bit;
            used += 1;
            if used == 8 {
                output.push(pending);
                pending = 0;
                used = 0;
            }
        }
    }
    if used > 0 {
        output.push(pending << (8 - used));
    }
    Ok(output)
}

pub fn huffman_decode(input: &[u8]) -> io::Result<Vec<u8>> {
    if input.len() < HUFFMAN_HEADER {
        return Err(truncated("Huffman"));
    }
    let length = u64::from(get_u32(input, 0)) | (u64::from(get_u32(input, 4)) << 32);
    let mut frequency = [0u32; 256];
    for (symbol, count) in frequency.iter_mut().enumerate() {
        *count = get_u32(input, 8 + symbol * 4);
    }
    let tree = build_tree(&frequency);
    let mut output = Vec::new();
    let mut at = HUFFMAN_HEADER;
    let mut bit = 7;
    // EN: Decoding walks down the tree one bit at a time and emits a byte at each leaf. The
    //     stored length says when to stop, since the last byte may carry padding bits.
    // PT: A decodificação desce a árvore um bit por vez e emite um byte a cada folha. O tamanho
    //     gravado diz quando parar, pois o último byte pode ter bits de preenchimento.
    // ES: La decodificación desciende el árbol un bit a la vez y emite un byte en cada hoja. El
    //     tamaño escrito dice cuándo parar, pues el último byte puede tener bits de relleno.
    while (output.len() as u64) < length {
        let mut node = tree.root.ok_or_else(|| truncated("Huffman"))?;
        loop {
            let byte = input.get(at).ok_or_else(|| truncated("Huffman"))?;
            let value = (byte >> bit) & 1;
            if bit == 0 {
                bit = 7;
                at += 1;
            } else {
                bit -= 1;
            }
            if !tree.is_leaf(node) {
                node = if value == 0 {
                    tree.left(node)
                } else {
                    tree.right(node)
                };
            }
            if tree.is_leaf(node) {
                break;
            }
        }
        output.push(node as u8);
    }
    Ok(output)
}
