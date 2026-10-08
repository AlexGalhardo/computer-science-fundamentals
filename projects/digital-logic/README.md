# Digital logic

> Versão em português: [README.pt-BR.md](README.pt-BR.md)

Digital logic is the level where computing becomes physical: numbers in binary, Boolean functions, logic gates and the circuits made from them, first combinational (adders, multiplexers) and then sequential (flip-flops, registers, counters). Building an adder and then a small CPU from gates shows that a computer is a stack of simple ideas, each one built from the previous.

## Mini-projects

| Mini-project | What it teaches | Status |
| --- | --- | --- |
| [Logic gates, Karnaugh and adders](gates-karnaugh-adders/) | How Boolean functions become circuits | available |
| [NAND-only ALU and a 4-bit CPU](nand-alu-cpu/) | How a computer is built from one gate | available |

## Quiz and documentation

- Quiz questions: [quiz/content/digital-logic/](../../quiz/content/digital-logic/)
- Documentation: [docs/en/digital-logic/](../../docs/en/digital-logic/)
- References of every area: [REFERENCES.md](../../REFERENCES.md)

## References

Selected sources, not an exhaustive list. Every link was checked when the list was written.

### Start here

- [Nand to Tetris](https://www.nand2tetris.org/), Noam Nisan and Shimon Schocken. Free. The course that builds a whole computer from the NAND gate up, with free tools and project material.
- [NandGame](https://nandgame.com/), Olav Junker Kjær. Free. A browser game with the same path: from one NAND gate to an adder, an ALU and a processor.
- [Build an 8-bit computer from scratch](https://eater.net/8bit), Ben Eater. Free. A video series that builds a working computer on breadboards, one module at a time.

### Books

- [The Elements of Computing Systems, 2nd edition](https://www.nand2tetris.org/book), Noam Nisan and Shimon Schocken. Paid. The book of Nand to Tetris: Boolean logic, arithmetic, memory, the CPU and the software above it.
- [Code: The Hidden Language of Computer Hardware and Software, 2nd edition](https://codehiddenlanguage.com/), Charles Petzold. Paid. A patient, non-academic path from Morse code and relays to gates, adders, memory and a processor.
- [Digital Design and Computer Architecture, RISC-V edition](https://shop.elsevier.com/books/digital-design-and-computer-architecture-risc-v-edition/harris/978-0-12-820064-3), Sarah Harris and David Harris. Paid. A textbook that goes from gates and Karnaugh maps to sequential design and a complete processor.

### Courses and lectures

- [MIT 6.004 Computation Structures](https://ocw.mit.edu/courses/6-004-computation-structures-spring-2017/), MIT OpenCourseWare, Chris Terman. Free. Videos and exercises on information, gates, combinational and sequential logic, and processor design.
- [Build a Modern Computer from First Principles: From Nand to Tetris](https://www.coursera.org/learn/build-a-computer), Hebrew University of Jerusalem (Coursera). Free to audit, paid certificate. The guided version of Nand to Tetris part I, with lectures and automatically checked projects.
- [Digital Design and Computer Architecture](https://safari.ethz.ch/digitaltechnik/spring2023/doku.php?id=schedule), Onur Mutlu, ETH Zürich. Free. Full lecture videos and slides of a university course from transistors to microarchitecture.

### Papers and specifications

- [A Symbolic Analysis of Relay and Switching Circuits](https://dspace.mit.edu/handle/1721.1/11173), Claude Shannon (1937 master's thesis). Free. The thesis that showed Boolean algebra describes switching circuits, the start of digital design.
- [Quine–McCluskey algorithm](https://en.wikipedia.org/wiki/Quine%E2%80%93McCluskey_algorithm), Wikipedia. Free. A worked example of the tabular minimisation method that Karnaugh maps do by eye.

### Videos

- [Building an 8-bit breadboard computer!](https://www.youtube.com/playlist?list=PLowKtXNTBypGqImE405J2565dvjafglHU), Ben Eater. Free. The complete playlist: clock, registers, ALU, memory, program counter and control logic.
- [Exploring How Computers Work](https://www.youtube.com/watch?v=QZwneRb-zqA), Sebastian Lague. Free. A beautifully animated walk from logic gates to an adder and a small ALU in a simulator.
- [Digital Electronics](https://www.youtube.com/playlist?list=PLBlnK6fEyqRjMH3mWf6kwqiTbT798eAOm), Neso Academy. Free. Hundreds of short worked lessons on number systems, Boolean algebra, Karnaugh maps and flip-flops.

### Practice and tools

- [Digital](https://github.com/hneemann/Digital), Helmut Neemann. Free. A teaching simulator for digital circuits that also generates truth tables and minimised expressions.
- [CircuitVerse](https://circuitverse.org/), CircuitVerse community. Free. A logic circuit simulator in the browser, with an interactive book on digital logic.
- [HDLBits](https://hdlbits.01xz.net/wiki/Main_Page), Henry Wong. Free. Small Verilog exercises checked online, from gates to finite state machines.
- [Logisim-evolution](https://github.com/logisim-evolution/logisim-evolution), Logisim-evolution developers. Free. The classic educational tool for drawing and simulating digital circuits.

### Communities

- [Electrical Engineering Stack Exchange: digital-logic tag](https://electronics.stackexchange.com/questions/tagged/digital-logic), Stack Exchange. Free. Answered questions on gates, minimisation, flip-flops and timing.
- [r/beneater](https://www.reddit.com/r/beneater/), Reddit. Free. People building the breadboard computers and helping each other debug them.
