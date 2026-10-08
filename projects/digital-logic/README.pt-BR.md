# Lógica digital

> English version: [README.md](README.md)

Lógica digital é o nível em que a computação se torna física: números em binário, funções booleanas, portas lógicas e os circuitos feitos com elas, primeiro combinacionais (somadores, multiplexadores) e depois sequenciais (flip-flops, registradores, contadores). Construir um somador e depois uma pequena CPU a partir de portas mostra que um computador é uma pilha de ideias simples, cada uma feita com a anterior.

## Miniprojetos

| Miniprojeto | O que ensina | Situação |
| --- | --- | --- |
| [Portas lógicas, Karnaugh e somadores](gates-karnaugh-adders/) | Como funções booleanas viram circuitos | disponível |
| [ULA só com NAND e uma CPU de 4 bits](nand-alu-cpu/) | Como um computador é construído a partir de uma única porta | disponível |

## Quiz e documentação

- Perguntas do quiz: [quiz/content/digital-logic/](../../quiz/content/digital-logic/)
- Documentação: [docs/pt/digital-logic/](../../docs/pt/digital-logic/)
- Referências de todas as áreas: [REFERENCES.pt-BR.md](../../REFERENCES.pt-BR.md)

## Referências

Fontes selecionadas, não uma lista exaustiva. Todos os links foram verificados quando a lista foi escrita.

### Comece por aqui

- [Nand to Tetris](https://www.nand2tetris.org/), Noam Nisan and Shimon Schocken. Gratuito. O curso que constrói um computador inteiro a partir da porta NAND, com ferramentas e material de projeto gratuitos.
- [NandGame](https://nandgame.com/), Olav Junker Kjær. Gratuito. Jogo de navegador com o mesmo caminho: de uma porta NAND a um somador, uma ULA e um processador.
- [Build an 8-bit computer from scratch](https://eater.net/8bit), Ben Eater. Gratuito. Série de vídeos que constrói um computador funcional em protoboards, um módulo por vez.

### Livros

- [The Elements of Computing Systems, 2nd edition](https://www.nand2tetris.org/book), Noam Nisan and Shimon Schocken. Pago. O livro do Nand to Tetris: lógica booleana, aritmética, memória, a CPU e o software acima dela.
- [Code: The Hidden Language of Computer Hardware and Software, 2nd edition](https://codehiddenlanguage.com/), Charles Petzold. Pago. Um caminho paciente e não acadêmico do código Morse e dos relés a portas, somadores, memória e processador.
- [Digital Design and Computer Architecture, RISC-V edition](https://shop.elsevier.com/books/digital-design-and-computer-architecture-risc-v-edition/harris/978-0-12-820064-3), Sarah Harris and David Harris. Pago. Livro-texto que vai de portas e mapas de Karnaugh ao projeto sequencial e a um processador completo.

### Cursos e aulas

- [MIT 6.004 Computation Structures](https://ocw.mit.edu/courses/6-004-computation-structures-spring-2017/), MIT OpenCourseWare, Chris Terman. Gratuito. Vídeos e exercícios sobre informação, portas, lógica combinacional e sequencial e projeto de processadores.
- [Build a Modern Computer from First Principles: From Nand to Tetris](https://www.coursera.org/learn/build-a-computer), Hebrew University of Jerusalem (Coursera). Gratuito como ouvinte, certificado pago. A versão guiada da parte I do Nand to Tetris, com aulas e projetos verificados automaticamente.
- [Digital Design and Computer Architecture](https://safari.ethz.ch/digitaltechnik/spring2023/doku.php?id=schedule), Onur Mutlu, ETH Zürich. Gratuito. Vídeos e slides completos de um curso universitário, de transistores a microarquitetura.

### Artigos e especificações

- [A Symbolic Analysis of Relay and Switching Circuits](https://dspace.mit.edu/handle/1721.1/11173), Claude Shannon (1937 master's thesis). Gratuito. A dissertação que mostrou que a álgebra booleana descreve circuitos de chaveamento, o início do projeto digital.
- [Quine–McCluskey algorithm](https://en.wikipedia.org/wiki/Quine%E2%80%93McCluskey_algorithm), Wikipedia. Gratuito. Exemplo resolvido do método tabular de minimização que os mapas de Karnaugh fazem no olho.

### Vídeos

- [Building an 8-bit breadboard computer!](https://www.youtube.com/playlist?list=PLowKtXNTBypGqImE405J2565dvjafglHU), Ben Eater. Gratuito. A playlist completa: relógio, registradores, ULA, memória, contador de programa e lógica de controle.
- [Exploring How Computers Work](https://www.youtube.com/watch?v=QZwneRb-zqA), Sebastian Lague. Gratuito. Caminhada lindamente animada de portas lógicas a um somador e uma pequena ULA em um simulador.
- [Digital Electronics](https://www.youtube.com/playlist?list=PLBlnK6fEyqRjMH3mWf6kwqiTbT798eAOm), Neso Academy. Gratuito. Centenas de lições curtas resolvidas sobre sistemas de numeração, álgebra booleana, mapas de Karnaugh e flip-flops.

### Prática e ferramentas

- [Digital](https://github.com/hneemann/Digital), Helmut Neemann. Gratuito. Simulador didático de circuitos digitais que também gera tabelas-verdade e expressões minimizadas.
- [CircuitVerse](https://circuitverse.org/), CircuitVerse community. Gratuito. Simulador de circuitos lógicos no navegador, com um livro interativo de lógica digital.
- [HDLBits](https://hdlbits.01xz.net/wiki/Main_Page), Henry Wong. Gratuito. Pequenos exercícios de Verilog corrigidos online, de portas a máquinas de estados finitos.
- [Logisim-evolution](https://github.com/logisim-evolution/logisim-evolution), Logisim-evolution developers. Gratuito. A ferramenta educacional clássica para desenhar e simular circuitos digitais.

### Comunidades

- [Electrical Engineering Stack Exchange: digital-logic tag](https://electronics.stackexchange.com/questions/tagged/digital-logic), Stack Exchange. Gratuito. Perguntas respondidas sobre portas, minimização, flip-flops e temporização.
- [r/beneater](https://www.reddit.com/r/beneater/), Reddit. Gratuito. Pessoas montando os computadores de protoboard e se ajudando a depurá-los.
