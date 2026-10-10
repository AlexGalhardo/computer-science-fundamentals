# Information theory

> Versão em português: [README.pt-BR.md](README.pt-BR.md) · Versión en español: [README.es.md](README.es.md)

Information theory measures information in bits and proves how far data can be compressed and how reliably it can be sent over a noisy channel. Shannon's entropy sets the limit that Huffman and LZ77 approach, and redundancy added on purpose (parity, CRC, Hamming codes) is what lets networks and disks detect and repair errors. The same ideas explain text encodings such as UTF-8 and base64.

## Mini-projects

| Mini-project | What it teaches | Status |
| --- | --- | --- |
| [Huffman and LZ77](huffman-lz77/) | How compression exploits redundancy and what entropy says about its limit | available |
| [Error detection and correction](error-detection-correction/) | How redundancy detects and repairs flipped bits | available |

## Quiz and documentation

- Quiz questions: [quiz/content/information-theory/](../../quiz/content/information-theory/)
- Documentation: [docs/en/information-theory/](../../docs/en/information-theory/)
- References of every area: [REFERENCES.md](../../REFERENCES.md)

## References

Selected sources, not an exhaustive list. Every link was checked when the list was written.

### Start here

- [Journey into information theory](https://www.khanacademy.org/computing/computer-science/informationtheory), Brit Cruise, Khan Academy. Free. Short videos that build up from ancient signalling to entropy, compression and error correction.
- [Visual Information Theory](https://colah.github.io/posts/2015-09-Visual-Information/), Christopher Olah. Free. Explains entropy, optimal code lengths and cross-entropy with pictures instead of formulas.
- [But what are Hamming codes? The origin of error correction](https://www.youtube.com/watch?v=X8jsijhllIA), Grant Sanderson, 3Blue1Brown. Free. A visual derivation of Hamming codes as a game of parity checks.

### Books

- [Information Theory, Inference, and Learning Algorithms](https://www.inference.org.uk/mackay/itila/), David MacKay. Free online, paid in print. A complete textbook free to read online, covering source coding, channel coding and error-correcting codes.
- [Computer Networks, 6th edition](https://www.pearson.com/en-us/subject-catalog/p/computer-networks/P200000003188), Tanenbaum, Feamster and Wetherall. Paid. The quiz follows its chapters on error detection and correction, channel capacity and encodings.

### Courses and lectures

- [MIT 6.050J Information and Entropy](https://ocw.mit.edu/courses/6-050j-information-and-entropy-spring-2008/), MIT OpenCourseWare, Paul Penfield and Seth Lloyd. Free. A first-year course with notes on bits, codes, compression, errors, probability and entropy.
- [EE 274 Data Compression: Theory and Applications (notes)](https://stanforddatacompressionclass.github.io/notes/), Stanford University. Free. Lecture notes on prefix codes, Huffman, arithmetic coding, LZ77 and modern compressors.
- [MIT 6.02 Digital Communication Systems](https://ocw.mit.edu/courses/6-02-introduction-to-eecs-ii-digital-communication-systems-fall-2012/), MIT OpenCourseWare. Free. Notes and lectures on entropy, Huffman and LZW, linear block codes and noise.

### Papers and specifications

- [A Mathematical Theory of Communication](https://people.math.harvard.edu/~ctm/home/text/others/shannon/entropy/entropy.pdf), Claude Shannon (1948). Free. The founding paper: entropy, the source coding theorem and channel capacity, still readable today.
- [RFC 1951: DEFLATE Compressed Data Format Specification](https://www.rfc-editor.org/rfc/rfc1951), Peter Deutsch, IETF. Free. The format behind gzip, zip and PNG: LZ77 followed by Huffman coding, specified in a few pages.
- [A Painless Guide to CRC Error Detection Algorithms](https://www.zlib.net/crc_v3.txt), Ross Williams (1993). Free. The classic explanation of CRCs, from polynomial division by hand to the table-driven implementation.
- [RFC 3629: UTF-8, a transformation format of ISO 10646](https://www.rfc-editor.org/rfc/rfc3629), François Yergeau, IETF. Free. The definition of UTF-8, with the byte patterns and the rules for invalid sequences.
- [RFC 4648: The Base16, Base32, and Base64 Data Encodings](https://www.rfc-editor.org/rfc/rfc4648), Simon Josefsson, IETF. Free. The specification of base64 and its variants, including padding and the URL-safe alphabet.

### Official documentation

- [An Explanation of the Deflate Algorithm](https://www.zlib.net/feldspar.html), Antaeus Feldspar. Free. A short, plain description of how LZ77 and Huffman trees combine inside zlib.

### Videos

- [Solving Wordle using information theory](https://www.youtube.com/watch?v=v68zYyaEmEA), Grant Sanderson, 3Blue1Brown. Free. Uses a word game to make bits of information and entropy intuitive.
- [How do CRCs work?](https://www.youtube.com/watch?v=izG7qT0EpBw), Ben Eater. Free. Works through cyclic redundancy checks by hand, then shows why they catch burst errors.
- [Computerphile](https://www.youtube.com/@Computerphile), University of Nottingham. Free. Has videos on Huffman trees, LZ77, error correction and Unicode by the people who teach them.

### Practice and tools

- [The Absolute Minimum Every Software Developer Must Know About Unicode and Character Sets](https://www.joelonsoftware.com/2003/10/08/the-absolute-minimum-every-software-developer-absolutely-positively-must-know-about-unicode-and-character-sets-no-excuses/), Joel Spolsky. Free. The short essay that explains code points, encodings and why plain text does not exist.
- [UTF-8 Everywhere](https://utf8everywhere.org/), Pavel Radzivilovsky, Yakov Galka and Slava Novgorodov. Free. A manifesto with a clear comparison of UTF-8, UTF-16 and UTF-32 and their trade-offs.

### Communities

- [Computer Science Stack Exchange: information-theory tag](https://cs.stackexchange.com/questions/tagged/information-theory), Stack Exchange. Free. Answered questions on entropy, coding and compression limits.
- [r/compression](https://www.reddit.com/r/compression/), Reddit. Free. A small community focused on data compression algorithms and tools.
