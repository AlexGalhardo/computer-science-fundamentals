# Information theory

> Versão em português: [docs/pt/information-theory/README.md](../../pt/information-theory/README.md) · Versión en español: [docs/es/information-theory/README.md](../../es/information-theory/README.md)

The area has a quiz of 100 questions (`quiz/content/information-theory/`) and two mini-projects. Sources: USP Data Structures II (compression) and Tanenbaum, Computer Networks, 5th edition (channel capacity and error control).

| Mini-project | Teaches | Languages | Quiz topics |
| --- | --- | --- | --- |
| [Huffman and LZ77](huffman-lz77.md) | how compression exploits redundancy and what entropy says about its limit | Rust, Python | `shannon-entropy`, `source-coding-prefix-codes`, `huffman-coding`, `arithmetic-coding-lz-family`, `limits-of-compression` |
| [Error detection and correction](error-detection-correction.md) | how redundancy detects and repairs flipped bits: parity, checksum, CRC-32, Hamming codes and a noise simulator | C++ | `error-detection`, `error-correction`, `channel-capacity-noise` |

The topics `text-binary-encodings` and `encoding-hashing-encryption` are covered by the quiz only.

Every mini-project runs with Docker only: `./setup-unix-<name>.sh` or `./setup-windows-<name>.ps1` inside its folder under `projects/information-theory/`.
