# Sistemas operacionais

> English version: [docs/en/operating-systems/README.md](../../en/operating-systems/README.md)

A área tem um quiz de 100 questões (`quiz/content/operating-systems/`) e quatro mini-projetos. Fonte: Tanenbaum, Sistemas Operacionais Modernos (4ª edição), e o livro do MINIX.

| Mini-projeto | Ensina | Linguagens | Tópicos do quiz |
| --- | --- | --- | --- |
| [Simulador de escalonamento de CPU](cpu-scheduling.md) | como FCFS, SJF, round-robin, prioridade e múltiplas filas com realimentação trocam entre si os tempos de espera, de retorno e de resposta | TypeScript, Python | `scheduling` |
| [Simulador de paginação e TLB](paging-tlb.md) | tradução de endereços, acertos e faltas de TLB, substituição de páginas e a anomalia de Belady | TypeScript, Rust | `memory-management` |
| [Alocador de memória](memory-allocator.md) | first fit, best fit, worst fit e o sistema buddy, fragmentação externa e interna, coalescência | C++, Rust | `memory-management` |
| [Detecção de impasses e um mini shell](deadlock-mini-shell.md) | grafos de alocação de recursos, o algoritmo do banqueiro, e processos com `fork`, `exec`, pipes e sinais | Go, C++ | `deadlocks`, `introduction-and-system-calls`, `processes-and-threads` |

Todo mini-projeto roda só com o Docker: `./setup-unix-<nome>.sh` ou `./setup-windows-<nome>.ps1` dentro da sua pasta em `projects/operating-systems/`.
