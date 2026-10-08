# Sistemas operacionais

> English version: [README.md](README.md)

Um sistema operacional é o programa que divide uma máquina entre muitos programas: dá a cada processo a ilusão de ter sua própria CPU e memória, intermedeia o acesso a arquivos e dispositivos e impede que os programas prejudiquem uns aos outros. Entender processos, escalonamento, memória virtual, sistemas de arquivos e deadlocks explica a maior parte do comportamento, e dos problemas de desempenho, de software real.

## Miniprojetos

| Miniprojeto | O que ensina | Situação |
| --- | --- | --- |
| [Simulador de escalonamento de CPU](cpu-scheduling/) | Como as políticas de escalonamento trocam tempo de espera, tempo de resposta e justiça | disponível |
| [Simulador de paginação e TLB](paging-tlb/) | Como endereços virtuais são traduzidos e quanto custa a substituição de páginas | disponível |
| [Alocador de memória](memory-allocator/) | Como as estratégias de alocação fragmentam a memória | disponível |
| [Detecção de deadlock e um mini shell](deadlock-mini-shell/) | Grafos de alocação de recursos, o algoritmo do banqueiro e processos com pipes | disponível |

## Quiz e documentação

- Perguntas do quiz: [quiz/content/operating-systems/](../../quiz/content/operating-systems/)
- Documentação: [docs/pt/operating-systems/](../../docs/pt/operating-systems/)
- Referências de todas as áreas: [REFERENCES.pt-BR.md](../../REFERENCES.pt-BR.md)

## Referências

Fontes selecionadas, não uma lista exaustiva. Todos os links foram verificados quando a lista foi escrita.

### Comece por aqui

- [Operating Systems: Three Easy Pieces](https://pages.cs.wisc.edu/~remzi/OSTEP/), Remzi and Andrea Arpaci-Dusseau, University of Wisconsin. Gratuito online, pago impresso. O livro de SO mais acessível: capítulos curtos sobre virtualização, concorrência e persistência, com simuladores de exercício.
- [Sistemas Operacionais: Conceitos e Mecanismos](https://wiki.inf.ufpr.br/maziero/doku.php?id=socm:start), Carlos Maziero, UFPR. Em português. Gratuito. Livro-texto completo e gratuito em português, com slides e exercícios para cada capítulo.
- [Crash Course Computer Science](https://www.youtube.com/playlist?list=PL8dPuuaLjXtNlUrzyH5r6jN9ulIgZBpdo), Carrie Anne Philbin, Crash Course. Gratuito. Os episódios 18 a 20 dão uma visão geral de dez minutos sobre sistemas operacionais, memória e arquivos antes dos livros.

### Livros

- [Modern Operating Systems, 5th edition](https://www.pearson.com/en-us/subject-catalog/p/modern-operating-systems/P200000003295), Andrew S. Tanenbaum and Herbert Bos. Pago. O livro-texto que o quiz segue (na 4ª edição): processos, memória, sistemas de arquivos, E/S, deadlocks e virtualização.
- [Operating System Concepts, 10th edition](https://www.os-book.com/OS10/), Silberschatz, Galvin and Gagne. Pago. O outro livro-texto clássico; o site oferece gratuitamente os slides e exercícios de prática.
- [The Linux Programming Interface](https://man7.org/tlpi/), Michael Kerrisk. Pago. O guia definitivo das chamadas de sistema do Linux: processos, sinais, pipes, arquivos e mapeamentos de memória.
- [Computer Systems: A Programmer's Perspective, 3rd edition](https://csapp.cs.cmu.edu/), Randal E. Bryant and David R. O'Hallaron. Pago. Explica memória virtual, exceções, processos e alocação dinâmica de memória do ponto de vista do programador.

### Cursos e aulas

- [CS 162 Operating Systems and Systems Programming](https://cs162.org/), UC Berkeley. Gratuito. Slides, leituras e os projetos Pintos de um curso completo de SO.
- [MIT 6.1810 Operating System Engineering](https://pdos.csail.mit.edu/6.1810/), MIT PDOS. Gratuito. Curso guiado por laboratórios em torno do xv6, um pequeno kernel didático tipo Unix para RISC-V.
- [Sistemas Operacionais](https://www.youtube.com/playlist?list=PLxI8Can9yAHeK7GUEGxMsqoPRmJKwI9Jw), UNIVESP. Em português. Gratuito. Disciplina completa de graduação em português sobre processos, escalonamento, memória e sistemas de arquivos.

### Artigos e especificações

- [The UNIX Time-Sharing System](https://dsf.berkeley.edu/cs262/unix.pdf), Dennis Ritchie and Ken Thompson (1974). Gratuito. O artigo que apresentou arquivos como fluxos de bytes, o shell, pipes e fork, em poucas páginas legíveis.
- [xv6: a simple, Unix-like teaching operating system](https://pdos.csail.mit.edu/6.1810/2024/xv6/book-riscv-rev4.pdf), Russ Cox, Frans Kaashoek and Robert Morris. Gratuito. Livro curto que percorre o código-fonte de um kernel pequeno e completo, linha por linha.

### Documentação oficial

- [Linux man-pages online](https://man7.org/linux/man-pages/), Michael Kerrisk and the man-pages project. Gratuito. A descrição oficial de cada chamada de sistema e função de biblioteca, como fork, mmap e pipe.
- [The Linux Kernel documentation](https://docs.kernel.org/), kernel.org. Gratuito. Documentação oficial do escalonador, da gerência de memória e dos sistemas de arquivos de um kernel de produção.

### Prática e ferramentas

- [OSTEP homework simulators](https://github.com/remzi-arpacidusseau/ostep-homework), Remzi Arpaci-Dusseau. Gratuito. Pequenos simuladores em Python de escalonamento, paginação, TLB e discos, próximos dos miniprojetos desta área.
- [xv6-riscv](https://github.com/mit-pdos/xv6-riscv), MIT PDOS. Gratuito. O código-fonte do kernel didático, pequeno o bastante para ser lido por inteiro.
- [Writing an OS in Rust](https://os.phil-opp.com/), Philipp Oppermann. Gratuito. Série de blog que constrói um pequeno kernel passo a passo: boot, interrupções, paginação e alocação de heap.

### Comunidades

- [r/osdev](https://www.reddit.com/r/osdev/), Reddit. Gratuito. Comunidade de quem escreve o próprio kernel, boa para dúvidas de baixo nível.
- [Stack Overflow: operating-system tag](https://stackoverflow.com/questions/tagged/operating-system), Stack Overflow. Gratuito. Perguntas conceituais e práticas respondidas sobre processos, memória e chamadas de sistema.
