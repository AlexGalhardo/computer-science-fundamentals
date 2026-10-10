# deadlock-mini-shell

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Dos programas pequeños sobre procesos y los recursos que comparten. El primero, en Go, encuentra deadlocks en un grafo de asignación de recursos y aplica el algoritmo del banquero para decidir si un estado es seguro. El segundo, en C++, es un mini shell que ejecuta pipelines con `fork`, `exec`, `pipe` y `dup2`, admite redirección y sobrevive a Ctrl-C. Juntos enseñan cómo se crean y se conectan los procesos, y qué sale mal cuando esperan unos a otros.

Explicación completa: [docs/es/operating-systems/deadlock-mini-shell.md](../../../docs/es/operating-systems/deadlock-mini-shell.md).

## Temas del quiz que demuestra

- `operating-systems` / `deadlocks`: las cuatro condiciones, grafos de asignación de recursos, detección, estados seguros e inseguros, el algoritmo del banquero.
- `operating-systems` / `introduction-and-system-calls`: `fork`, `exec`, por qué `cd` es un builtin del shell.
- `operating-systems` / `processes-and-threads`: creación de procesos, espacios de direcciones separados tras `fork`, espera de los hijos.

## Ejecutar

El único requisito es Docker.

```sh
./setup-unix-deadlock-mini-shell.sh        # Linux y macOS
./setup-windows-deadlock-mini-shell.ps1    # Windows
```

El script construye las imágenes, ejecuta las pruebas de ambos lenguajes y ejecuta las dos demos.

## Demos

```sh
docker compose run --rm demo          # classifies the documented graphs and states, writes results/results.md
docker compose run --rm shell-demo    # runs cpp/demo.msh in the mini shell
docker compose run --rm shell         # an interactive mini shell (leave with exit or Ctrl-D)
```

```text
textbook, 7 processes  DEADLOCK     deadlocked: D, E, G    blocked behind the cycle: B
single resource        safe         one safe sequence: P1, P2, P0
  P0 asks for 1 unit                   denied: the resulting state would be unsafe
```

## Estructura

| Ruta | Contenido |
| --- | --- |
| `go/graph.go` | grafo de asignación de recursos: procesos en un ciclo y procesos bloqueados detrás de él |
| `go/banker.go` | secuencia segura, la decisión del banquero ante una solicitud, detección con varias instancias |
| `go/examples.go` | los grafos y estados documentados, usados por las pruebas y por la demo |
| `go/cmd/demo/main.go` | imprime la clasificación |
| `cpp/parser.hpp` | convierte una línea de comandos en un pipeline (sin procesos de por medio) |
| `cpp/msh.cpp` | el shell: `fork`, `exec`, `pipe`, `dup2`, `waitpid`, `SIGINT` |
| `cpp/test_parser.cpp`, `cpp/test_shell.sh` | pruebas unitarias del parser y script de prueba de integración |
| `results/` | salida versionada de la demo de deadlock |

Cada lenguaje hace la parte para la que es más adecuado: Go para los algoritmos de grafos y matrices, C++ para las llamadas al sistema POSIX. Las imágenes están fijadas (`golang:1.27.1-bookworm`, `gcc:16.2.0-trixie`) y no hay dependencias de bibliotecas.

## Pruebas

```sh
docker compose run --rm go-test     # gofmt, go vet, golangci-lint, then the tests
docker compose run --rm cpp-test    # clang-format check, parser tests, then test_shell.sh
```

Las pruebas de Go clasifican grafos conocidos con deadlock y seguros, y los estados de libro de texto del algoritmo del banquero. El script de prueba del shell ejecuta pipelines de tres comandos, con y sin redirección, e interrumpe con SIGINT un `sleep 30 | cat | cat` en ejecución, comprobando que el pipeline muere de inmediato y que el shell ejecuta el siguiente comando.

## Alcance del shell

El mini shell es una herramienta didáctica, no un reemplazo de `sh`. No tiene variables, ni globbing, ni `&&`, ni trabajos en segundo plano. No crea un grupo de procesos por trabajo, por lo que depende de que la terminal envíe Ctrl-C a todo el grupo en primer plano.
