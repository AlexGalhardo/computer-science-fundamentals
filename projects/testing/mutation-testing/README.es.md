# mutation-testing

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Dos suites de pruebas para el mismo módulo pequeño, ambas con **100% de cobertura de líneas**. Una no afirma casi nada, la otra afirma valores exactos. La cobertura no puede distinguirlas. Las pruebas de mutación sí: un mutador pequeño, escrito aquí en cerca de 100 líneas, planta un bug a la vez en el módulo y cuenta cuántos de esos bugs nota cada suite. La suite débil nota 21%, la fuerte 95%.

Código: MP-TEST-3. Explicación completa: [docs/es/testing/mutation-testing.md](../../../docs/es/testing/mutation-testing.md).

## Temas del quiz que demuestra

- `testing` / `coverage-mutation`: la cobertura de líneas como métrica y lo que no muestra, mutantes, muertos y sobrevivientes, puntuación de mutación, mutantes equivalentes, el costo de una ejecución de mutación

## Ejecutar

El único requisito es Docker.

```sh
./setup-unix-mutation-testing.sh        # Linux and macOS
./setup-windows-mutation-testing.ps1    # Windows
```

El script ejecuta las pruebas, el informe de cobertura de ambas suites y la ejecución de mutación, y elimina los contenedores al final.

## Pruebas y cobertura

```sh
docker compose run --rm ts-test            # type check + all tests
docker compose run --rm coverage-weak      # coverage report of the weak suite
docker compose run --rm coverage-strong    # coverage report of the strong suite
```

Ambos comandos de cobertura fallan por debajo de 100% de líneas o funciones (`ts/bunfig.toml`). Este es el informe de la suite **débil**:

```text
-----------------|---------|---------|-------------------
File             | % Funcs | % Lines | Uncovered Line #s
-----------------|---------|---------|-------------------
All files        |  100.00 |  100.00 |
 src/shipping.ts |  100.00 |  100.00 |
-----------------|---------|---------|-------------------
```

## Demo: la ejecución de mutación

```sh
docker compose run --rm mutation
```

Genera 19 mutantes de `ts/src/shipping.ts`, ejecuta cada suite contra cada mutante (38 ejecuciones de pruebas, unos segundos) y escribe [`results/mutation-report.md`](results/mutation-report.md). El comando falla a menos que la suite débil puntúe por debajo de 60% y la suite fuerte por encima de 90%.

| Suite | Cobertura de líneas | Mutantes | Muertos | Sobrevivientes | Puntuación de mutación |
| --- | --- | --- | --- | --- | --- |
| débil (`tests/weak`) | 100% | 19 | 4 | 15 | 21.1% |
| fuerte (`tests/strong`) | 100% | 19 | 18 | 1 | 94.7% |

Cómo leerlo:

- **Muerto** significa que al menos una prueba falló con el mutante: la suite notó el bug. **Sobreviviente** significa que todas las pruebas pasaron: la suite también pasaría con ese bug en producción.
- La suite débil comprueba que un precio "es un número" y "es positivo". Cambiar 150 centavos por kilogramo a 151, o `+` a `-`, no cambia ninguna de las dos cosas, así que esos mutantes viven.
- El único sobreviviente de la suite fuerte (`>` a `>=` en la línea 45) es un **mutante equivalente**: para un paquete de exactamente 2 kg el cargo extra es `(2 - 2) * 150 = 0` de cualquier forma, así que ninguna prueba puede ver jamás una diferencia. Por eso la puntuación aquí es la cruda (muertos / todos los mutantes) y por eso 100% no siempre es alcanzable.

## El mutador

Escrito para este mini-proyecto, sin dependencias, porque construirlo es la lección (`ts/src/mutator.ts`). Divide el código fuente en tokens, se salta comentarios, strings e identificadores, y produce un mutante por operador o número:

| Tipo | Cambios |
| --- | --- |
| Aritmético | `+` y `-` intercambiados, `*` y `/` intercambiados |
| Relacional (límite) | `<` a `<=`, `<=` a `<`, `>` a `>=`, `>=` a `>` |
| Igualdad | `===` y `!==` intercambiados |
| Lógico | `&&` y `\|\|` intercambiados, `!` eliminado, `true` y `false` intercambiados |
| Constante | un número `n` se vuelve `n + 1` |

Es una herramienta de enseñanza con límites declarados: trabaja sobre tokens, no sobre el árbol sintáctico, así que no distingue un genérico `<T>` de una comparación ni una expresión regular de una división. El módulo bajo prueba evita esas formas. Una herramienta de producción (Stryker, PIT, mutmut) trabaja sobre el árbol sintáctico, tiene muchos más operadores y ejecuta solo las pruebas que cubren cada mutante.

## Estructura

```text
ts/src/shipping.ts             the module under test
ts/src/mutator.ts              tokenizer and mutant generator
ts/src/run-mutation.ts         the mutation run and its report
ts/tests/weak/                 100% line coverage, weak assertions
ts/tests/strong/               100% line coverage, exact values and boundaries
ts/tests/mutator/              tests of the mutator itself
results/mutation-report.md     the last report, one line per mutant
```

Dependencias, fijadas: `typescript` 7.0.2 y `@types/bun` 1.4.2 para la verificación de tipos, sobre `oven/bun:1.4.2`. La cobertura viene de `bun test --coverage`.
