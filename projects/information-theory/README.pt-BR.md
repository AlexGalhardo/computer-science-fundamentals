# Teoria da informação

> English version: [README.md](README.md) · Versión en español: [README.es.md](README.es.md)

A teoria da informação mede a informação em bits e prova até onde os dados podem ser comprimidos e com que confiabilidade podem ser enviados por um canal com ruído. A entropia de Shannon define o limite do qual Huffman e LZ77 se aproximam, e a redundância acrescentada de propósito (paridade, CRC, códigos de Hamming) é o que permite a redes e discos detectar e reparar erros. As mesmas ideias explicam codificações de texto como UTF-8 e base64.

## Miniprojetos

| Miniprojeto | O que ensina | Situação |
| --- | --- | --- |
| [Huffman e LZ77](huffman-lz77/) | Como a compressão explora a redundância e o que a entropia diz sobre seu limite | disponível |
| [Detecção e correção de erros](error-detection-correction/) | Como a redundância detecta e repara bits invertidos | disponível |

## Quiz e documentação

- Perguntas do quiz: [quiz/content/information-theory/](../../quiz/content/information-theory/)
- Documentação: [docs/pt/information-theory/](../../docs/pt/information-theory/)
- Referências de todas as áreas: [REFERENCES.pt-BR.md](../../REFERENCES.pt-BR.md)

## Referências

Fontes selecionadas, não uma lista exaustiva. Todos os links foram verificados quando a lista foi escrita.

### Comece por aqui

- [Journey into information theory](https://www.khanacademy.org/computing/computer-science/informationtheory), Brit Cruise, Khan Academy. Gratuito. Vídeos curtos que vão da sinalização antiga até entropia, compressão e correção de erros.
- [Visual Information Theory](https://colah.github.io/posts/2015-09-Visual-Information/), Christopher Olah. Gratuito. Explica entropia, comprimentos ótimos de código e entropia cruzada com figuras em vez de fórmulas.
- [But what are Hamming codes? The origin of error correction](https://www.youtube.com/watch?v=X8jsijhllIA), Grant Sanderson, 3Blue1Brown. Gratuito. Dedução visual dos códigos de Hamming como um jogo de verificações de paridade.

### Livros

- [Information Theory, Inference, and Learning Algorithms](https://www.inference.org.uk/mackay/itila/), David MacKay. Gratuito online, pago impresso. Livro-texto completo de leitura online gratuita, cobrindo codificação de fonte, de canal e códigos corretores de erros.
- [Computer Networks, 6th edition](https://www.pearson.com/en-us/subject-catalog/p/computer-networks/P200000003188), Tanenbaum, Feamster and Wetherall. Pago. O quiz segue seus capítulos sobre detecção e correção de erros, capacidade de canal e codificações.

### Cursos e aulas

- [MIT 6.050J Information and Entropy](https://ocw.mit.edu/courses/6-050j-information-and-entropy-spring-2008/), MIT OpenCourseWare, Paul Penfield and Seth Lloyd. Gratuito. Curso de primeiro ano com notas sobre bits, códigos, compressão, erros, probabilidade e entropia.
- [EE 274 Data Compression: Theory and Applications (notes)](https://stanforddatacompressionclass.github.io/notes/), Stanford University. Gratuito. Notas de aula sobre códigos de prefixo, Huffman, codificação aritmética, LZ77 e compressores modernos.
- [MIT 6.02 Digital Communication Systems](https://ocw.mit.edu/courses/6-02-introduction-to-eecs-ii-digital-communication-systems-fall-2012/), MIT OpenCourseWare. Gratuito. Notas e aulas sobre entropia, Huffman e LZW, códigos de bloco lineares e ruído.

### Artigos e especificações

- [A Mathematical Theory of Communication](https://people.math.harvard.edu/~ctm/home/text/others/shannon/entropy/entropy.pdf), Claude Shannon (1948). Gratuito. O artigo fundador: entropia, o teorema da codificação de fonte e a capacidade de canal, ainda legível hoje.
- [RFC 1951: DEFLATE Compressed Data Format Specification](https://www.rfc-editor.org/rfc/rfc1951), Peter Deutsch, IETF. Gratuito. O formato por trás de gzip, zip e PNG: LZ77 seguido de codificação de Huffman, especificado em poucas páginas.
- [A Painless Guide to CRC Error Detection Algorithms](https://www.zlib.net/crc_v3.txt), Ross Williams (1993). Gratuito. A explicação clássica de CRCs, da divisão polinomial à mão até a implementação com tabela.
- [RFC 3629: UTF-8, a transformation format of ISO 10646](https://www.rfc-editor.org/rfc/rfc3629), François Yergeau, IETF. Gratuito. A definição do UTF-8, com os padrões de bytes e as regras para sequências inválidas.
- [RFC 4648: The Base16, Base32, and Base64 Data Encodings](https://www.rfc-editor.org/rfc/rfc4648), Simon Josefsson, IETF. Gratuito. A especificação do base64 e de suas variantes, incluindo o preenchimento e o alfabeto seguro para URLs.

### Documentação oficial

- [An Explanation of the Deflate Algorithm](https://www.zlib.net/feldspar.html), Antaeus Feldspar. Gratuito. Descrição curta e direta de como LZ77 e árvores de Huffman se combinam dentro da zlib.

### Vídeos

- [Solving Wordle using information theory](https://www.youtube.com/watch?v=v68zYyaEmEA), Grant Sanderson, 3Blue1Brown. Gratuito. Usa um jogo de palavras para tornar intuitivos os bits de informação e a entropia.
- [How do CRCs work?](https://www.youtube.com/watch?v=izG7qT0EpBw), Ben Eater. Gratuito. Resolve verificações de redundância cíclica à mão e depois mostra por que elas pegam erros em rajada.
- [Computerphile](https://www.youtube.com/@Computerphile), University of Nottingham. Gratuito. Tem vídeos sobre árvores de Huffman, LZ77, correção de erros e Unicode feitos por quem os ensina.

### Prática e ferramentas

- [The Absolute Minimum Every Software Developer Must Know About Unicode and Character Sets](https://www.joelonsoftware.com/2003/10/08/the-absolute-minimum-every-software-developer-absolutely-positively-must-know-about-unicode-and-character-sets-no-excuses/), Joel Spolsky. Gratuito. O ensaio curto que explica code points, codificações e por que não existe texto puro.
- [UTF-8 Everywhere](https://utf8everywhere.org/), Pavel Radzivilovsky, Yakov Galka and Slava Novgorodov. Gratuito. Manifesto com uma comparação clara de UTF-8, UTF-16 e UTF-32 e seus prós e contras.

### Comunidades

- [Computer Science Stack Exchange: information-theory tag](https://cs.stackexchange.com/questions/tagged/information-theory), Stack Exchange. Gratuito. Perguntas respondidas sobre entropia, codificação e limites de compressão.
- [r/compression](https://www.reddit.com/r/compression/), Reddit. Gratuito. Pequena comunidade dedicada a algoritmos e ferramentas de compressão de dados.
