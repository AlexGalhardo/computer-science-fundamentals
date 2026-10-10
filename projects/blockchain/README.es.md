# Blockchain

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Una blockchain es un libro mayor sobre el que muchas partes que no confían entre sí pueden ponerse de acuerdo sin una autoridad central. Combina ideas estudiadas en otras partes de este repositorio: las funciones hash y los árboles de Merkle hacen que el historial evidencie cualquier manipulación, las firmas digitales prueban quién puede gastar, y la prueba de trabajo convierte el acuerdo en una cuestión de esfuerzo de cómputo. Estudiarla como estructura de datos y protocolo separa la ingeniería de la exageración.

## Miniproyectos

| Miniproyecto | Qué enseña | Estado |
| --- | --- | --- |
| Blockchain didáctica (`didactic-blockchain`) | Cómo el hashing, la prueba de trabajo y la validación forman una cadena que evidencia la manipulación | planificado |

## Quiz y documentación

- Preguntas del quiz: planificadas (`quiz/content/blockchain/`).
- Documentación: planificada (`docs/es/blockchain/`).
- Referencias de todas las áreas: [REFERENCES.es.md](../../REFERENCES.es.md)

## Referencias

Fuentes seleccionadas, no una lista exhaustiva. Todos los enlaces se verificaron cuando se escribió la lista.

### Empieza aquí

- [But how does bitcoin actually work?](https://www.youtube.com/watch?v=bBC-nXj3Ng4), Grant Sanderson, 3Blue1Brown. Gratis. Construye la idea paso a paso: un libro mayor público, firmas, hashes, bloques y prueba de trabajo.
- [Blockchain Demo](https://andersbrownworth.com/blockchain/), Anders Brownworth. Gratis. Una página interactiva donde cambias un bloque y ves cómo se rompen los hashes de la cadena.
- [Learn Me A Bitcoin](https://learnmeabitcoin.com/), Greg Walker. Gratis. Una guía técnica directa con diagramas y herramientas para claves, transacciones, bloques y minería.

### Libros

- [Bitcoin and Cryptocurrency Technologies](https://bitcoinbook.cs.princeton.edu/), Narayanan, Bonneau, Felten, Miller and Goldfeder, Princeton. Gratis en línea, de pago impreso. Un libro de texto universitario con un borrador gratuito en línea: criptografía, consenso, minería y alternativas.
- [Mastering Bitcoin, 3rd edition](https://github.com/bitcoinbook/bitcoinbook), Andreas Antonopoulos and David Harding. Gratis en línea, de pago impreso. El libro técnico detallado, con su texto completo abierto en GitHub: claves, transacciones, la red y la minería.
- [Mastering Ethereum, 2nd edition](https://github.com/ethereumbook/ethereumbook), Andreas Antonopoulos, Gavin Wood and others. Gratis en línea, de pago impreso. El libro abierto equivalente para el modelo de cuentas y los contratos inteligentes.

### Cursos y clases

- [Bitcoin and Cryptocurrency Technologies](https://www.coursera.org/learn/cryptocurrency), Princeton University (Coursera). Gratis como oyente, certificado de pago. El curso en video del libro de texto de Princeton.
- [MIT 15.S12 Blockchain and Money](https://ocw.mit.edu/courses/15-s12-blockchain-and-money-fall-2018/), Gary Gensler, MIT OpenCourseWare. Gratis. Clases que cubren la tecnología y luego juzgan con sobriedad dónde es útil y dónde no.
- [MIT MAS.S62 Cryptocurrency Engineering and Design](https://ocw.mit.edu/courses/mas-s62-cryptocurrency-engineering-and-design-spring-2018/), Neha Narula and Tadge Dryja, MIT OpenCourseWare. Gratis. Un curso de ingeniería: firmas, salidas no gastadas, prueba de trabajo, forks y escalabilidad.

### Artículos y especificaciones

- [Bitcoin: A Peer-to-Peer Electronic Cash System](https://bitcoin.org/bitcoin.pdf), Satoshi Nakamoto (2008). Gratis. El artículo de nueve páginas que sigue el quiz: transacciones, servidor de marcas de tiempo, prueba de trabajo e incentivos.
- [Bitcoin: Um Sistema de Dinheiro Eletrônico Peer-to-Peer](https://bitcoin.org/files/bitcoin-paper/bitcoin_pt_br.pdf), Satoshi Nakamoto, traducción al portugués. En portugués. Gratis. La traducción al portugués de Brasil del artículo, alojada en bitcoin.org.
- [Hashcash: A Denial of Service Counter-Measure](http://www.hashcash.org/papers/hashcash.pdf), Adam Back (2002). Gratis. El esquema de prueba de trabajo que Bitcoin adaptó para la minería.
- [The Byzantine Generals Problem](https://lamport.azurewebsites.net/pubs/byz.pdf), Lamport, Shostak and Pease (1982). Gratis. El planteamiento clásico del acuerdo entre partes cuando algunas pueden mentir.
- [Ethereum Whitepaper](https://ethereum.org/en/whitepaper/), Vitalik Buterin (2014). Gratis. Revisa Bitcoin como un sistema de transición de estados y propone una cadena de propósito general.
- [FIPS 180-4: Secure Hash Standard](https://csrc.nist.gov/pubs/fips/180-4/upd1/final), NIST. Gratis. La especificación oficial de SHA-256, la función hash usada en todo Bitcoin.
- [Majority is not Enough: Bitcoin Mining is Vulnerable](https://arxiv.org/abs/1311.0243), Ittay Eyal and Emin Gün Sirer (2013). Gratis. El análisis de la minería egoísta, un buen ejercicio para razonar sobre incentivos.

### Documentación oficial

- [Bitcoin Developer Guide](https://developer.bitcoin.org/devguide/), Bitcoin.org developer documentation. Gratis. La cadena de bloques, las transacciones, los contratos, las billeteras y la red entre pares, con referencias.
- [Ethereum: Proof-of-stake](https://ethereum.org/en/developers/docs/consensus-mechanisms/pos/), ethereum.org. Gratis. La explicación oficial de los validadores, la finalidad y cómo se compara con la prueba de trabajo.

### Videos

- [MIT 15.S12 Blockchain and Money, Fall 2018 (lecture videos)](https://www.youtube.com/playlist?list=PLUl4u3cNGP63UUkfL0onkxF6MYgVa04Fn), Gary Gensler, MIT OpenCourseWare. Gratis. Las clases grabadas del curso anterior.

### Práctica y herramientas

- [Naivecoin: a tutorial for building a cryptocurrency](https://lhartikk.github.io/), Lauri Hartikka. Gratis. Un tutorial en TypeScript que hace crecer una cadena mínima hasta tener prueba de trabajo y transacciones.
- [mempool.space](https://mempool.space/), The Mempool Open Source Project. Gratis. Un explorador de código abierto para ver bloques reales, transacciones y ajustes de dificultad.

### Comunidades

- [Bitcoin Stack Exchange](https://bitcoin.stackexchange.com/), Stack Exchange. Gratis. Preguntas técnicas respondidas por desarrolladores del protocolo.
- [Bitcoin Optech](https://bitcoinops.org/), Bitcoin Optech. Gratis. Un boletín técnico semanal y un índice de temas sobre cómo evoluciona el protocolo.
