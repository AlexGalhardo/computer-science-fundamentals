# Sistemas operativos

> English version: [docs/en/operating-systems/README.md](../../en/operating-systems/README.md) · Versão em português: [docs/pt/operating-systems/README.md](../../pt/operating-systems/README.md)

El área tiene un quiz de 100 preguntas (`quiz/content/operating-systems/`) y cuatro mini-proyectos. Fuente: Tanenbaum, Modern Operating Systems (4.ª edición), y el libro de MINIX.

| Mini-proyecto | Enseña | Lenguajes | Temas del quiz |
| --- | --- | --- | --- |
| [Simulador de planificación de CPU](cpu-scheduling.md) | cómo FCFS, SJF, round-robin, prioridad y retroalimentación multinivel equilibran espera, retorno (turnaround) y respuesta | TypeScript, Python | `scheduling` |
| [Simulador de paginación y TLB](paging-tlb.md) | traducción de direcciones, aciertos y fallos de TLB, reemplazo de páginas y la anomalía de Belady | TypeScript, Rust | `memory-management` |
| [Asignador de memoria](memory-allocator.md) | first fit, best fit, worst fit y el sistema buddy, fragmentación externa e interna, fusión (coalescing) | C++, Rust | `memory-management` |
| [Detección de deadlocks y un mini shell](deadlock-mini-shell.md) | grafos de asignación de recursos, el algoritmo del banquero, y procesos con `fork`, `exec`, pipes y señales | Go, C++ | `deadlocks`, `introduction-and-system-calls`, `processes-and-threads` |

Cada mini-proyecto se ejecuta solo con Docker: `./setup-unix-<name>.sh` o `./setup-windows-<name>.ps1` dentro de su carpeta en `projects/operating-systems/`.
