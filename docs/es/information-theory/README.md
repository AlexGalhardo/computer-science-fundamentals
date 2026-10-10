# Teoría de la información

> English version: [docs/en/information-theory/README.md](../../en/information-theory/README.md) · Versão em português: [docs/pt/information-theory/README.md](../../pt/information-theory/README.md)

El área tiene un quiz de 100 preguntas (`quiz/content/information-theory/`) y dos miniproyectos. Fuentes: USP Estructuras de Datos II (compresión) y Tanenbaum, Computer Networks, 5.ª edición (capacidad del canal y control de errores).

| Miniproyecto | Enseña | Lenguajes | Temas del quiz |
| --- | --- | --- | --- |
| [Huffman y LZ77](huffman-lz77.md) | cómo la compresión aprovecha la redundancia y qué dice la entropía sobre su límite | Rust, Python | `shannon-entropy`, `source-coding-prefix-codes`, `huffman-coding`, `arithmetic-coding-lz-family`, `limits-of-compression` |
| [Detección y corrección de errores](error-detection-correction.md) | cómo la redundancia detecta y repara bits invertidos: paridad, checksum, CRC-32, códigos de Hamming y un simulador de ruido | C++ | `error-detection`, `error-correction`, `channel-capacity-noise` |

Los temas `text-binary-encodings` y `encoding-hashing-encryption` los cubre solo el quiz.

Cada miniproyecto se ejecuta solo con Docker: `./setup-unix-<name>.sh` o `./setup-windows-<name>.ps1` dentro de su carpeta en `projects/information-theory/`.
