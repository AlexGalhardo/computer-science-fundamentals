# Motor de expresiones regulares

> English version: [docs/en/compilers/regex-engine.md](../../en/compilers/regex-engine.md) · Versão em português: [docs/pt/compilers/regex-engine.md](../../pt/compilers/regex-engine.md)

Mini-proyecto MP-COMP-4, en [`projects/compilers/regex-engine`](../../../projects/compilers/regex-engine). Enseña cómo una expresión regular se convierte en un autómata. Esta es la maquinaria detrás de un generador de lexers: el lexer escrito a mano de [MP-COMP-1](mini-language-parser.md) es uno de esos autómatas codificado a mano.

## Tres formas del mismo patrón

```text
pattern text --parse--> tree --Thompson--> NFA --subset construction--> DFA
```

Cada forma responde "¿este texto empareja?", y cada una es más barata de ejecutar y más cara de construir que la anterior.

## El árbol

Un patrón tiene su propia gramática pequeña, con tres niveles de precedencia:

```text
alternation   = concatenation { "|" concatenation }      loosest
concatenation = { repetition }
repetition    = atom { "*" | "+" | "?" }                 tightest
atom          = literal | "." | class | "(" alternation ")"
```

Así, `ab|cd*` es `(ab)|(c(d*))`. El parser de `go/regex/parser.go` es de descenso recursivo con una función por regla, y reporta los patrones inválidos (`*a`, `(ab`, `[z-a]`) con el desplazamiento del problema.

## Construcción de Thompson: de árbol a AFN

Un autómata finito no determinista (AFN) puede tener varias transiciones para el mismo byte y **transiciones épsilon**, que se toman sin leer nada. La construcción tiene una regla pequeña por tipo de nodo del árbol, y cada regla produce un fragmento con una entrada y una salida, de modo que los fragmentos encajan unos en otros:

```text
a      (s) --a--> (f)
AB     A.exit --ε--> B.entry
A|B    (s) --ε--> A.entry, B.entry        A.exit, B.exit --ε--> (f)
A*     (s) --ε--> A.entry, (f)            A.exit --ε--> A.entry, (f)
A+     (s) --ε--> A.entry                 A.exit --ε--> A.entry, (f)
A?     (s) --ε--> A.entry, (f)            A.exit --ε--> (f)
```

Un nodo agrega como máximo dos estados, así que el AFN es tan grande como el patrón: `(a|b)*abb` da 14 estados. En esta implementación la concatenación une dos fragmentos con una transición épsilon y no agrega ningún estado.

## Simular el AFN

"No determinista" no significa adivinar. La simulación mantiene el **conjunto** de todos los estados en los que podría estar el autómata:

1. empieza con la clausura épsilon del estado inicial (todo estado alcanzable solo mediante ε);
2. para cada byte de la entrada, sigue ese byte desde cada estado del conjunto y toma la clausura épsilon del resultado;
3. acepta cuando el conjunto final contiene el estado de aceptación.

Un conjunto contiene cada estado como máximo una vez, así que un byte cuesta como máximo el tamaño del patrón. El total es O(n · m) para una entrada de n bytes y un patrón de tamaño m: lineal en la entrada para cualquier patrón.

## Construcción de subconjuntos: de AFN a AFD

Los conjuntos que visita la simulación dependen solo del patrón, no de la entrada. La construcción de subconjuntos los calcula todos por adelantado y convierte cada conjunto en un estado de un autómata determinista (AFD):

1. el estado inicial del AFD es la clausura épsilon del estado inicial del AFN;
2. para un conjunto sin procesar y cada byte, calcula el conjunto al que se movería la simulación: esa es la transición;
3. un conjunto nunca visto se convierte en un nuevo estado del AFD, y el proceso se repite hasta que no quede ninguno;
4. un estado del AFD acepta cuando su conjunto contiene el estado de aceptación del AFN.

El emparejamiento es entonces una consulta a la tabla por byte, O(n), sin depender del patrón. Para `(a|b)*abb` el AFD tiene 5 estados.

Dos detalles prácticos en `go/regex/dfa.go`:

- **Clases de bytes.** Los bytes que ninguna parte del patrón distingue comparten una columna de la tabla de transiciones, así que `[a-z]` no cuesta 26 columnas.
- **El precio.** Un estado del AFD es un conjunto de estados del AFN, así que un AFN con m estados puede necesitar hasta 2^m estados del AFD. "El byte 14 desde el final es una `a`" realmente necesita 2^14. La construcción se detiene con un error a los 10,000 estados, y el AFN sigue siendo utilizable. Este es el intercambio clásico: el AFN es pequeño y más lento, el AFD es rápido y puede ser enorme.

## Por qué no backtracking

Muchas bibliotecas de regex emparejan probando un camino y volviendo atrás cuando falla. Eso permite extras como las referencias hacia atrás, pero la misma posición de la entrada puede explorarse una y otra vez por cadenas distintas de elecciones. Con `(a*)*b` y una entrada de n letras `a`, se prueban todas las formas de cortar la secuencia en pedazos: `3 · 2^(n+1) − 1` pasos en `go/regex/backtrack.go`.

| n | Pasos del backtracking | Pasos del AFN | Pasos del AFD |
| ---: | ---: | ---: | ---: |
| 10 | 6,143 | 60 | 10 |
| 20 | 6,291,455 | 120 | 20 |
| 25 | 201,326,591 | 150 | 25 |
| 1,000,000 | no ejecutado | 6,000,000 | 1,000,000 |

Los autómatas no pueden explotar de esta manera, porque un conjunto no puede contener el mismo estado dos veces. Los tiempos, con la máquina y las versiones, están en `results/results.md` del mini-proyecto. Un patrón así en un servicio que acepta entrada de usuarios es un riesgo de denegación de servicio conocido como ReDoS, y emparejar con autómatas es la defensa estructural. Este proyecto solo mide sus propios motores, en local.

## Ver los autómatas

`regex-engine dot nfa <pattern>` y `regex-engine dot dfa <pattern>` imprimen el autómata en el lenguaje DOT de Graphviz, como texto. Cada estado del AFD se etiqueta con el conjunto de estados del AFN que representa, lo que hace visible la construcción de subconjuntos.

## Comprobarlo contra un motor real

El parser y los tres emparejadores se comparan con el paquete `regexp` de Go en 1,000 casos generados: árboles de patrón aleatorios sobre un alfabeto pequeño, escritos de vuelta como texto y analizados por el parser real, con la mitad de las entradas construidas para emparejar y la otra mitad aleatorias. `regexp` está basado en autómatas, así que es un oráculo confiable para los patrones regulares.

## Cómo ejecutarlo

```sh
./setup-unix-regex-engine.sh                                   # construye, verifica el formato, vet, lint, pruebas
docker compose run --rm regex match "(a|b)*abb" babb           # los tres motores, con pasos
docker compose run --rm regex dot dfa "(a|b)*abb"              # exportación del autómata
bun run bench -- --project projects/compilers/regex-engine     # benchmark, desde la raíz del repositorio
```

## Criterios de aceptación

| Ítem | Criterio | Dónde se verifica |
| --- | --- | --- |
| MP-COMP-4.1 | las pruebas cubren la precedencia y los patrones inválidos | `go/regex/parser_test.go` |
| MP-COMP-4.2 | los emparejamientos coinciden con `regexp` de Go en 1,000 casos generados | `TestAgreesWithStandardLibraryOn1000GeneratedCases` en `go/regex/engine_test.go` |
| MP-COMP-4.3 | exportación del autómata, y el motor se mantiene lineal donde el backtracking es exponencial, mostrado en una tabla | `go/regex/dot.go`, `go/regex/pathological_test.go`, la tabla del README y `results/results.md` |

## Temas relacionados del quiz

- `compilers` / `lexical-analysis`
