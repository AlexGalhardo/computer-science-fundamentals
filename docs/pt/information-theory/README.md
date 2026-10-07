# Teoria da informação

> English version: [docs/en/information-theory/README.md](../../en/information-theory/README.md)

A área tem um quiz de 100 questões (`quiz/content/information-theory/`) e dois mini-projetos. Fontes: USP Estruturas de Dados II (compressão) e Tanenbaum, Redes de Computadores, 5ª edição (capacidade de canal e controle de erros).

| Mini-projeto | Ensina | Linguagens | Tópicos do quiz |
| --- | --- | --- | --- |
| [Huffman e LZ77](huffman-lz77.md) | como a compressão explora a redundância e o que a entropia diz sobre o seu limite | Rust, Python | `shannon-entropy`, `source-coding-prefix-codes`, `huffman-coding`, `arithmetic-coding-lz-family`, `limits-of-compression` |
| [Detecção e correção de erros](error-detection-correction.md) | como a redundância detecta e conserta bits invertidos: paridade, checksum, CRC-32, códigos de Hamming e um simulador de ruído | C++ | `error-detection`, `error-correction`, `channel-capacity-noise` |

Os tópicos `text-binary-encodings` e `encoding-hashing-encryption` são cobertos apenas pelo quiz.

Todo mini-projeto roda só com Docker: `./setup-unix-<nome>.sh` ou `./setup-windows-<nome>.ps1` dentro da sua pasta em `projects/information-theory/`.
