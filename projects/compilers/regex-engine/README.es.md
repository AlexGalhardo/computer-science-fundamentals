# regex-engine

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Un motor de expresiones regulares construido a la manera de los libros de texto, en Go. Enseña **cómo una expresión regular se convierte en un autómata**: el patrón se analiza hasta formar un árbol, el árbol se convierte en un autómata no determinista (construcción de Thompson), y este en uno determinista (construcción de subconjuntos). Se incluye un emparejador ingenuo por backtracking solo para mostrar lo que los autómatas evitan.

Explicación completa: [docs/es/compilers/regex-engine.md](../../../docs/es/compilers/regex-engine.md).

## Temas del quiz que demuestra

- `compilers` / `lexical-analysis`: expresiones regulares, AFN y AFD, construcción de Thompson, clausura épsilon, construcción de subconjuntos, el costo de simular un AFN frente a ejecutar un AFD, la explosión del backtracking.

## Ejecutar

El único requisito es Docker.

```sh
./setup-unix-regex-engine.sh        # Linux and macOS
./setup-windows-regex-engine.ps1    # Windows
```

El script construye la imagen y ejecuta la verificación del formateador, `go vet`, el linter y las pruebas. Luego:

```sh
docker compose run --rm regex match "(a|b)*abb" babb      # the three engines, with step counts
docker compose run --rm regex dot nfa "(a|b)*abb"         # the NFA in Graphviz DOT
docker compose run --rm regex dot dfa "(a|b)*abb"         # the DFA in Graphviz DOT
```

```text
pattern "(a|b)*abb", input "babb"
tree: (cat (cat (cat (star (alt a b)) a) b) b)
NFA: 14 states, DFA: 5 states
nfa           match=true  steps=31
dfa           match=true  steps=4
backtracking  match=true  steps=29
```

## Qué puede contener un patrón

| Sintaxis | Significado |
| --- | --- |
| `a` | el byte `a` |
| `.` | cualquier byte |
| `[abc]`, `[a-z0-9]`, `[^,]` | un byte de una clase, con rangos y negación |
| `AB` | concatenación |
| `A\|B` | alternancia |
| `A*`, `A+`, `A?` | cero o más, uno o más, cero o uno |
| `(A)` | agrupación |
| `\.` | el carácter siguiente como literal |

Precedencia, de la más laxa a la más fuerte: alternancia, concatenación, repetición. Un emparejamiento es siempre de la entrada **completa**, y el motor trabaja con bytes.

## Estructura

| Ruta | Qué es |
| --- | --- |
| `go/regex/parser.go` | de patrón a árbol, con precedencia y errores de sintaxis |
| `go/regex/nfa.go` | construcción de Thompson, clausura épsilon, simulación del AFN |
| `go/regex/dfa.go` | construcción de subconjuntos, clases de bytes, emparejamiento con el AFD |
| `go/regex/backtrack.go` | el emparejador ingenuo por backtracking usado para comparar |
| `go/regex/dot.go` | exportación de ambos autómatas a Graphviz DOT |
| `go/cmd/regex-engine/` | el comando: `match`, `dot`, `bench` |
| `results/` | resultados de benchmark registrados en el repositorio |

Go sobre la imagen fijada `golang:1.27.1-bookworm`, solo biblioteca estándar. El linter es golangci-lint 2.14.0, de su imagen fijada.

## Pruebas

```sh
docker compose run --rm go-test
```

- **Parser**: la precedencia se comprueba sobre la forma del árbol, clases y escapes, y trece patrones inválidos con el desplazamiento y el mensaje de cada error.
- **Prueba diferencial**: 1,000 casos generados (200 patrones aleatorios, 5 entradas cada uno, semilla fija) reciben del AFN, del AFD y del emparejador por backtracking la misma respuesta que de `regexp` de Go. En la suite registrada en el repositorio 684 casos empatan y 316 no.
- **Autómatas**: número de estados contado a partir de las reglas de construcción, la exportación DOT, y un patrón cuyo AFD necesita 2^14 estados y es rechazado con un error mientras el AFN aún responde.
- **Caso patológico**: los conteos de pasos demuestran que el backtracking al menos se duplica por cada letra adicional mientras los autómatas crecen exactamente de forma lineal.

## Benchmark: el patrón patológico

```sh
bun run bench -- --project projects/compilers/regex-engine    # from the repository root
```

El patrón es `(a*)*b` y la entrada son `n` letras `a`, sin ninguna `b`, así que nada empareja. Un emparejador por backtracking solo lo descubre después de probar todas las formas de repartir las letras entre las dos estrellas. Los pasos los cuentan los motores y no dependen de la máquina. Los tiempos son la sección medida de [`results/results.md`](results/results.md), donde se registran la máquina, la versión de Go y los comandos.

| n | Pasos del backtracking | Backtracking (ms) | Pasos del AFN | AFN (ms) | Pasos del AFD | AFD (ms) |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 10 | 6,143 | 0.03 | 60 | < 0.01 | 10 | < 0.01 |
| 15 | 196,607 | 1.43 | 90 | < 0.01 | 15 | < 0.01 |
| 20 | 6,291,455 | 48.8 | 120 | < 0.01 | 20 | < 0.01 |
| 25 | 201,326,591 | 1,240 | 150 | < 0.01 | 25 | < 0.01 |
| 1,000 | no ejecutado | no ejecutado | 6,000 | 0.03 | 1,000 | < 0.01 |
| 100,000 | no ejecutado | no ejecutado | 600,000 | 5.99 | 100,000 | 0.23 |
| 1,000,000 | no ejecutado | no ejecutado | 6,000,000 | 44.5 | 1,000,000 | 2.74 |

El backtracking toma `3 · 2^(n+1) − 1` pasos: cinco letras más multiplican el trabajo por 32, y 25 letras ya cuestan más de un segundo. No se ejecutó más allá de 25, porque 1,000 letras necesitarían más de 10^301 pasos. El AFN toma 6 pasos por letra y el AFD toma 1, así que un millón de letras cuesta milisegundos.
