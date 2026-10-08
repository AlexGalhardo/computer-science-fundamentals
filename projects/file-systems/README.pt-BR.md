# Sistemas de arquivos

> English version: [README.md](README.md)

Um sistema de arquivos transforma um dispositivo de blocos bruto em arquivos e diretórios com nome que sobrevivem a uma queda de energia. Abaixo da interface conhecida estão os métodos de alocação, os i-nodes, a gerência de espaço livre e o journaling, e acima dela estão as organizações de arquivo que os bancos de dados usam: registros, índices, árvores B e ordenação externa para dados que não cabem na memória. As duas metades são moldadas por um fato: o armazenamento é lento, então o que conta é o número de acessos.

## Miniprojetos

| Miniprojeto | O que ensina | Situação |
| --- | --- | --- |
| Organização de arquivos e índices (`file-organisation`) | Como registros, listas de espaço livre e índices vivem dentro de um arquivo | planejado |
| Ordenação externa (`external-sorting`) | Como ordenar um arquivo maior que a memória | planejado |

## Quiz e documentação

- Perguntas do quiz: planejadas (`quiz/content/file-systems/`).
- Documentação: planejada (`docs/pt/file-systems/`).
- Referências de todas as áreas: [REFERENCES.pt-BR.md](../../REFERENCES.pt-BR.md)

## Referências

Fontes selecionadas, não uma lista exaustiva. Todos os links foram verificados quando a lista foi escrita.

### Comece por aqui

- [Operating Systems: Three Easy Pieces (Persistence part)](https://pages.cs.wisc.edu/~remzi/OSTEP/), Remzi and Andrea Arpaci-Dusseau. Gratuito online, pago impresso. Capítulos gratuitos sobre discos, RAID, arquivos e diretórios, implementação de sistemas de arquivos, journaling e flash.
- [Sistemas Operacionais: Conceitos e Mecanismos](https://wiki.inf.ufpr.br/maziero/doku.php?id=socm:start), Carlos Maziero, UFPR. Em português. Gratuito. O livro-texto gratuito em português tem uma parte inteira sobre arquivos, diretórios e alocação.
- [Files are hard](https://danluu.com/file-consistency/), Dan Luu. Gratuito. Um panorama de como é difícil gravar um arquivo com segurança, com as pesquisas que acharam os bugs.

### Livros

- [Modern Operating Systems, 5th edition](https://www.pearson.com/en-us/subject-catalog/p/modern-operating-systems/P200000003295), Andrew S. Tanenbaum and Herbert Bos. Pago. A fonte do quiz para arquivos, diretórios, alocação, espaço livre e journaling.
- [Database Internals](https://www.databass.dev/), Alex Petrov. Pago. A primeira metade trata de estruturas em disco: formatos de arquivo, variantes de árvore B e armazenamento em log.
- [Practical File System Design with the Be File System](http://www.nobius.org/dbg/practical-file-system-design.pdf), Dominic Giampaolo. Gratuito. Livro do projetista de um sistema de arquivos real, liberado como PDF gratuito no site do autor.

### Cursos e aulas

- [CMU 15-445/645 Database Systems](https://15445.courses.cs.cmu.edu/), Andy Pavlo, Carnegie Mellon University. Gratuito. As aulas sobre armazenamento, árvores B+ e merge sort externo correspondem à segunda metade desta área.
- [MIT 6.1810 Operating System Engineering](https://pdos.csail.mit.edu/6.1810/), MIT PDOS. Gratuito. Laboratórios sobre o sistema de arquivos do xv6: i-nodes, diretórios, cache de buffers e log.

### Artigos e especificações

- [A Fast File System for UNIX](https://dsf.berkeley.edu/cs262/FFS.pdf), McKusick, Joy, Leffler and Fabry (1984). Gratuito. O artigo que apresentou os grupos de cilindros e as políticas de disposição, o ancestral do ext2 ao ext4.
- [The Design and Implementation of a Log-Structured File System](https://people.eecs.berkeley.edu/~brewer/cs262/LFS.pdf), Mendel Rosenblum and John Ousterhout (1992). Gratuito. Grava tudo sequencialmente em um log, a ideia depois usada em armazenamento flash e em árvores LSM.
- [The Ubiquitous B-Tree](https://carlosproal.com/ir/papers/p121-comer.pdf), Douglas Comer (1979). Gratuito. O panorama clássico das árvores B e B+ e de por que elas se ajustam a discos.
- [The Google File System](https://research.google/pubs/the-google-file-system/), Ghemawat, Gobioff and Leung (2003). Gratuito. Como se projeta um sistema de arquivos quando os arquivos são enormes e as máquinas falham o tempo todo.
- [All File Systems Are Not Created Equal](https://www.usenix.org/conference/osdi14/technical-sessions/presentation/pillai), Pillai and others (2014). Gratuito. Estudo das suposições de consistência após falha que as aplicações fazem e os sistemas de arquivos quebram.

### Documentação oficial

- [ext4 Data Structures and Algorithms](https://docs.kernel.org/filesystems/ext4/), kernel.org. Gratuito. A disposição em disco de um sistema de arquivos de produção: grupos de blocos, i-nodes, extents e o journal.
- [SQLite Database File Format](https://www.sqlite.org/fileformat2.html), SQLite. Gratuito. Descrição completa e legível de como tabelas e índices são guardados como páginas de árvore B em um arquivo.
- [inode(7)](https://man7.org/linux/man-pages/man7/inode.7.html), Linux man-pages project. Gratuito. O que um i-node guarda: tipo, permissões, contagem de links, tamanhos e datas.
- [PostgreSQL: Database Physical Storage](https://www.postgresql.org/docs/current/storage.html), PostgreSQL Global Development Group. Gratuito. Como um banco real organiza páginas, mapas de espaço livre e valores grandes em arquivos.

### Vídeos

- [CMU Database Group](https://www.youtube.com/@CMUDatabaseGroup), Carnegie Mellon University. Gratuito. As aulas gravadas sobre armazenamento, estruturas de índice e ordenação.

### Prática e ferramentas

- [OSTEP homework simulators](https://github.com/remzi-arpacidusseau/ostep-homework), Remzi Arpaci-Dusseau. Gratuito. Simuladores de discos, RAID, um sistema de arquivos bem simples e journaling.
- [Let's Build a Simple Database](https://cstack.github.io/db_tutorial/), Connor Stack. Gratuito. Tutorial que guarda linhas em páginas e depois em uma árvore B, próximo dos miniprojetos desta área.

### Comunidades

- [Unix and Linux Stack Exchange: filesystems tag](https://unix.stackexchange.com/questions/tagged/filesystems), Stack Exchange. Gratuito. Perguntas respondidas sobre i-nodes, links, journaling e comportamento de sistemas de arquivos.
- [LWN.net Kernel index](https://lwn.net/Kernel/Index/), LWN.net. Gratuito online, pago impresso. Anos de artigos cuidadosos sobre sistemas de arquivos e armazenamento no Linux, organizados por tema.
