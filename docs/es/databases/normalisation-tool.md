# Herramienta de normalización (MP-DB-2)

> English version: [docs/en/databases/normalisation-tool.md](../../en/databases/normalisation-tool.md) · Versão em português: [docs/pt/databases/normalisation-tool.md](../../pt/databases/normalisation-tool.md)

Código: [projects/databases/normalisation-tool](../../../projects/databases/normalisation-tool). Lenguaje: Python.

## Qué enseña

La normalización suele enseñarse como una lista de reglas para memorizar. Esta herramienta muestra que cada paso es un pequeño cálculo sobre **dependencias funcionales**: si se sabe calcular el cierre de un conjunto de atributos, las claves, las formas normales y las descomposiciones salen todas de él.

```sh
docker compose run --rm explain --lang es
```

## 1. Dependencia funcional y cierre

`X -> Y` se cumple cuando dos filas iguales en `X` son siempre iguales en `Y`. El **cierre** `X+` es todo lo que `X` determina. El algoritmo empieza con `X` y va agregando el lado derecho de toda dependencia cuyo lado izquierdo ya está dentro, hasta que nada cambie.

```text
F = { A -> B, B -> C, CD -> E }

{A}+ :  {A}  --A->B-->  {A, B}  --B->C-->  {A, B, C}      (CD -> E necesita D: se detiene)
```

Todo lo demás de la herramienta se construye sobre esta única función.

## 2. Claves candidatas

`X` es superclave cuando `X+` es la relación completa, y clave candidata cuando no se puede quitar ningún atributo de ella. Un atributo que no aparece en ningún lado derecho nunca puede deducirse, así que pertenece a toda clave. La herramienta parte de esos e intenta agregar los demás, de los conjuntos menores a los mayores, saltando todo conjunto que ya contiene una clave.

| Esquema | Dependencias | Claves candidatas |
| --- | --- | --- |
| `R(A, B, C, D, E)` | `A -> B; B -> C; C, D -> E` | `{A, D}` |
| `R(A, B, C, D)` | `A, B -> C; C -> D; D -> A` | `{A, B}`, `{B, C}`, `{B, D}` |
| `R(A, B, C, D, E)` | `A -> B, C; C, D -> E; B -> D; E -> A` | `{A}`, `{E}`, `{B, C}`, `{C, D}` |
| `AULA(aluno, disciplina, professor)` | `aluno, disciplina -> professor; professor -> disciplina` | `{aluno, disciplina}`, `{aluno, professor}` |

## 3. Cobertura mínima

Un conjunto de dependencias suele decir algunas cosas dos veces. La cobertura mínima (irreducible) dice lo mismo sin que sobre nada, en tres pasos: un atributo en cada lado derecho, ningún atributo sobrante en el lado izquierdo, ninguna dependencia implicada por las otras. Cada prueba es un cierre. Ejemplo: `{A -> B, C; B -> C; A -> B; A, B -> C}` se convierte en `{A -> B; B -> C}`.

## 4. Formas normales

Un atributo es **primo** cuando pertenece a alguna clave candidata. Con `X -> A` una dependencia no trivial:

| Forma | Exigencia | Qué la viola |
| --- | --- | --- |
| 2FN | ningún atributo no primo depende de una parte propia de una clave | dependencia parcial |
| 3FN | `X` es superclave, o `A` es primo | un atributo no primo colgado de algo que no es clave (dependencia transitiva) |
| FNBC | `X` es superclave | cualquier determinante que no sea clave |

La 1FN se presupone, porque trata de valores atómicos, algo que las dependencias no pueden expresar. La herramienta informa cada forma como ok o violada y nombra la dependencia culpable. La 4FN y la 5FN necesitan dependencias multivaluadas y de join y quedan fuera de su alcance.

## 5. Dos descomposiciones

**3FN por síntesis.** Toma la cobertura mínima, agrupa las dependencias por lado izquierdo y crea una relación por grupo. Si ninguna relación contiene una clave candidata de la relación original, agrega una que sea clave. El resultado es siempre sin pérdida **y** mantiene toda dependencia verificable dentro de una sola relación.

**FNBC por división.** Mientras una relación tenga un determinante `X` que no es clave, la divide en `X+` y el resto más `X`. El resultado es siempre sin pérdida, pero una dependencia puede perderse. El caso clásico:

```text
AULA(aluno, disciplina, professor)
  aluno, disciplina -> professor        professor -> disciplina

FNBC:    {disciplina, professor}   {aluno, professor}
perdida: aluno, disciplina -> professor   (ahora abarca dos relaciones)
```

Ese es el intercambio entre las dos formas: la 3FN siempre logra mantener las dependencias, la FNBC elimina más redundancia.

## 6. El chase: probar que una descomposición es sin pérdida

Una descomposición es sin pérdida cuando unir las piezas devuelve exactamente la relación original, sin filas inventadas. El chase lo verifica con una tabla pequeña: una fila por pieza, `a` donde la pieza tiene el atributo y una `b` única donde no lo tiene.

```text
R(A, B, C) con A -> B, piezas {A, B} y {A, C}

inicio           A -> B: las filas son iguales en A, así que deben ser iguales en B
A | B  | C       A | B | C
a | a  | b1      a | a | b1
a | b2 | a       a | a | a      <- una fila solo con 'a': sin pérdida
```

Con las piezas `{A, B}` y `{B, C}` las filas nunca son iguales en `A`, ninguna regla se activa, ninguna fila queda toda `a`, y la descomposición tiene pérdida. La herramienta imprime la tabla antes y después para cada descomposición que produce.

## Cómo se verifica

- Ocho esquemas de aula devuelven sus claves candidatas y su forma normal documentadas.
- El chase se prueba en descomposiciones conocidas como sin pérdida y con pérdida.
- En los esquemas de aula y en 300 conjuntos aleatorios de dependencias, las dos descomposiciones pasan el chase; la síntesis preserva todas las dependencias y produce relaciones en 3FN; el algoritmo de la FNBC produce relaciones en FNBC.

```sh
docker compose run --rm python-test
```

## Temas del quiz relacionados

`databases` / `functional-dependencies-and-normalisation`, `databases` / `relational-model`.

Fuente de las ideas: C. J. Date, *An Introduction to Database Systems*, capítulos 11 (Functional Dependencies) y 12 (Further Normalization I).
