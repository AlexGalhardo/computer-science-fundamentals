# Teoría de la información

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

La teoría de la información mide la información en bits y demuestra hasta dónde se pueden comprimir los datos y con qué fiabilidad se pueden enviar por un canal con ruido. La entropía de Shannon fija el límite al que se acercan Huffman y LZ77, y la redundancia añadida a propósito (paridad, CRC, códigos de Hamming) es lo que permite a las redes y a los discos detectar y reparar errores. Las mismas ideas explican codificaciones de texto como UTF-8 y base64.

## Miniproyectos

| Miniproyecto | Qué enseña | Estado |
| --- | --- | --- |
| [Huffman y LZ77](huffman-lz77/) | Cómo la compresión aprovecha la redundancia y qué dice la entropía sobre su límite | disponible |
| [Detección y corrección de errores](error-detection-correction/) | Cómo la redundancia detecta y repara bits invertidos | disponible |

## Quiz y documentación

- Preguntas del quiz: [quiz/content/information-theory/](../../quiz/content/information-theory/)
- Documentación: [docs/es/information-theory/](../../docs/es/information-theory/)
- Referencias de todas las áreas: [REFERENCES.es.md](../../REFERENCES.es.md)

## Referencias

Fuentes seleccionadas, no una lista exhaustiva. Todos los enlaces se verificaron cuando se escribió la lista.

### Empieza aquí

- [Journey into information theory](https://www.khanacademy.org/computing/computer-science/informationtheory), Brit Cruise, Khan Academy. Gratis. Videos cortos que parten de las señales antiguas y llegan a la entropía, la compresión y la corrección de errores.
- [Visual Information Theory](https://colah.github.io/posts/2015-09-Visual-Information/), Christopher Olah. Gratis. Explica la entropía, las longitudes óptimas de código y la entropía cruzada con imágenes en lugar de fórmulas.
- [But what are Hamming codes? The origin of error correction](https://www.youtube.com/watch?v=X8jsijhllIA), Grant Sanderson, 3Blue1Brown. Gratis. Una derivación visual de los códigos de Hamming como un juego de verificaciones de paridad.

### Libros

- [Information Theory, Inference, and Learning Algorithms](https://www.inference.org.uk/mackay/itila/), David MacKay. Gratis en línea, de pago impreso. Un libro de texto completo que se puede leer gratis en línea, sobre codificación de fuente, codificación de canal y códigos correctores de errores.
- [Computer Networks, 6th edition](https://www.pearson.com/en-us/subject-catalog/p/computer-networks/P200000003188), Tanenbaum, Feamster and Wetherall. De pago. El quiz sigue sus capítulos sobre detección y corrección de errores, capacidad del canal y codificaciones.

### Cursos y clases

- [MIT 6.050J Information and Entropy](https://ocw.mit.edu/courses/6-050j-information-and-entropy-spring-2008/), MIT OpenCourseWare, Paul Penfield and Seth Lloyd. Gratis. Un curso de primer año con apuntes sobre bits, códigos, compresión, errores, probabilidad y entropía.
- [EE 274 Data Compression: Theory and Applications (notes)](https://stanforddatacompressionclass.github.io/notes/), Stanford University. Gratis. Apuntes de clase sobre códigos prefijo, Huffman, codificación aritmética, LZ77 y compresores modernos.
- [MIT 6.02 Digital Communication Systems](https://ocw.mit.edu/courses/6-02-introduction-to-eecs-ii-digital-communication-systems-fall-2012/), MIT OpenCourseWare. Gratis. Apuntes y clases sobre entropía, Huffman y LZW, códigos de bloque lineales y ruido.

### Artículos y especificaciones

- [A Mathematical Theory of Communication](https://people.math.harvard.edu/~ctm/home/text/others/shannon/entropy/entropy.pdf), Claude Shannon (1948). Gratis. El artículo fundacional: entropía, el teorema de codificación de fuente y la capacidad del canal, que todavía se lee con facilidad hoy.
- [RFC 1951: DEFLATE Compressed Data Format Specification](https://www.rfc-editor.org/rfc/rfc1951), Peter Deutsch, IETF. Gratis. El formato detrás de gzip, zip y PNG: LZ77 seguido de codificación de Huffman, especificado en pocas páginas.
- [A Painless Guide to CRC Error Detection Algorithms](https://www.zlib.net/crc_v3.txt), Ross Williams (1993). Gratis. La explicación clásica de los CRC, desde la división polinómica a mano hasta la implementación basada en tablas.
- [RFC 3629: UTF-8, a transformation format of ISO 10646](https://www.rfc-editor.org/rfc/rfc3629), François Yergeau, IETF. Gratis. La definición de UTF-8, con los patrones de bytes y las reglas para las secuencias inválidas.
- [RFC 4648: The Base16, Base32, and Base64 Data Encodings](https://www.rfc-editor.org/rfc/rfc4648), Simon Josefsson, IETF. Gratis. La especificación de base64 y sus variantes, incluido el relleno y el alfabeto seguro para URL.

### Documentación oficial

- [An Explanation of the Deflate Algorithm](https://www.zlib.net/feldspar.html), Antaeus Feldspar. Gratis. Una descripción breve y clara de cómo se combinan LZ77 y los árboles de Huffman dentro de zlib.

### Videos

- [Solving Wordle using information theory](https://www.youtube.com/watch?v=v68zYyaEmEA), Grant Sanderson, 3Blue1Brown. Gratis. Usa un juego de palabras para hacer intuitivos los bits de información y la entropía.
- [How do CRCs work?](https://www.youtube.com/watch?v=izG7qT0EpBw), Ben Eater. Gratis. Recorre a mano las verificaciones de redundancia cíclica y luego muestra por qué detectan errores en ráfaga.
- [Computerphile](https://www.youtube.com/@Computerphile), University of Nottingham. Gratis. Tiene videos sobre árboles de Huffman, LZ77, corrección de errores y Unicode, hechos por quienes los enseñan.

### Práctica y herramientas

- [The Absolute Minimum Every Software Developer Must Know About Unicode and Character Sets](https://www.joelonsoftware.com/2003/10/08/the-absolute-minimum-every-software-developer-absolutely-positively-must-know-about-unicode-and-character-sets-no-excuses/), Joel Spolsky. Gratis. El ensayo breve que explica los puntos de código, las codificaciones y por qué el texto plano no existe.
- [UTF-8 Everywhere](https://utf8everywhere.org/), Pavel Radzivilovsky, Yakov Galka and Slava Novgorodov. Gratis. Un manifiesto con una comparación clara de UTF-8, UTF-16 y UTF-32 y sus compromisos.

### Comunidades

- [Computer Science Stack Exchange: information-theory tag](https://cs.stackexchange.com/questions/tagged/information-theory), Stack Exchange. Gratis. Preguntas respondidas sobre entropía, codificación y límites de la compresión.
- [r/compression](https://www.reddit.com/r/compression/), Reddit. Gratis. Una comunidad pequeña centrada en algoritmos y herramientas de compresión de datos.
