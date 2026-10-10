# gates-karnaugh-adders

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Mini-proyecto MP-DL-1. Enseña **cómo una función booleana se convierte en un circuito**, en tres pasos: una expresión se analiza y se simula con compuertas para producir su tabla de verdad, una tabla de verdad se minimiza con el método de Quine-McCluskey (el mapa de Karnaugh hecho como tabla), y las compuertas se conectan para formar un semisumador, un sumador completo y un sumador ripple-carry de 8 bits que de verdad suma.

Explicación completa: [docs/es/digital-logic/gates-karnaugh-adders.md](../../../docs/es/digital-logic/gates-karnaugh-adders.md).

## Temas del quiz que demuestra

- `digital-logic` / `logic-gates`: compuertas, tablas de verdad, lectura de un circuito.
- `digital-logic` / `boolean-algebra`: De Morgan, absorción, consenso, minterms y formas canónicas, todo comprobado comparando tablas de verdad.
- `digital-logic` / `karnaugh-maps`: agrupamiento, implicantes primos y esenciales, términos irrelevantes (don't-care), suma de productos mínima.
- `digital-logic` / `arithmetic-circuits`: semisumador, sumador completo, sumador ripple-carry y cómo viaja el acarreo.

## Ejecución

El único requisito es Docker.

```sh
./setup-unix-gates-karnaugh-adders.sh        # Linux y macOS
./setup-windows-gates-karnaugh-adders.ps1    # Windows
```

El script construye las dos imágenes, ejecuta todas las pruebas y después las dos demos.

## Estructura

| Ruta | Qué contiene |
| --- | --- |
| `ts/src/gates.ts` | NOT, AND, OR y las compuertas derivadas de ellas |
| `ts/src/expression.ts` | Parser de expresiones como `A·B + C'`, evaluación del circuito, tabla de verdad |
| `ts/src/quine-mccluskey.ts` | Implicantes primos, esenciales, cobertura mínima exacta, términos irrelevantes |
| `ts/src/adders.ts` | Semisumador, sumador completo, sumador ripple-carry de n bits |
| `python/logic.py` | Tablas de verdad como columnas bit-paralelas, analizadas con el `ast` del propio Python |
| `python/quine_mccluskey.py` | Segunda implementación, independiente, de la minimización |
| `python/adders.py` | La misma red de sumadores, sumando los 65.536 pares en una sola pasada |
| `results/` | Salida de las dos demos |

TypeScript es la implementación de referencia: una fila a la vez, como se explica el circuito en el papel. La versión en Python existe porque la lección cambia: los enteros de Python no tienen límite de tamaño, así que una columna entera de la tabla de verdad es un solo entero y cada compuerta trata todas las filas con una sola operación (simulación bit-paralela).

### Sintaxis de las expresiones (TypeScript)

| Operación | Cómo se escribe |
| --- | --- |
| NOT | `A'` (posfijo), `!A` o `~A` (prefijo) |
| AND | `A·B`, `A*B`, `A&B`, `A.B` o simplemente `AB` |
| XOR | `A ^ B` |
| OR | `A + B` o `A \| B` |

Prioridad: NOT, luego AND, luego XOR, luego OR. Una variable es una letra seguida de dígitos opcionales. La versión en Python usa los operadores de Python: `~`, `&`, `^`, `|`.

## Pruebas

```sh
docker compose run --rm ts-test        # bun test
docker compose run --rm python-test    # ruff check, ruff format --check, pytest
```

| Criterio de aceptación | Prueba |
| --- | --- |
| Las tablas de verdad coinciden con las escritas a mano para 20 expresiones | `ts/tests/expression.test.ts`, `python/test_logic.py` |
| La expresión minimizada es equivalente a la original para toda entrada | `ts/tests/quine-mccluskey.test.ts` (las 256 funciones de 3 variables, las 65.536 de 4 variables, aleatorias de 5 y 6, con y sin términos irrelevantes), `python/test_quine_mccluskey.py` |
| El sumador de 8 bits coincide con la suma nativa para los 65.536 pares de entrada | `ts/tests/adders.test.ts`, `python/test_adders.py` |

El lint y los tipos del código TypeScript se ejecutan desde la raíz del repositorio: `bunx biome check projects/digital-logic/gates-karnaugh-adders` y `bunx tsc --noEmit -p projects/digital-logic/gates-karnaugh-adders/ts`.

## Demo

```sh
docker compose run --rm ts-demo
docker compose run --rm python-demo
```

Cada demo imprime su informe y lo escribe en [`results/results-ts.md`](results/results-ts.md) y [`results/results-python.md`](results/results-python.md). Una muestra de la tabla de minimización:

| Función | Suma de productos mínima | Literales |
| --- | --- | ---: |
| Σm(0, 2, 5, 7, 8, 10, 13, 15) | `B'·D' + B·D` | 4 |
| Σm(0, 1, 2, 5, 8, 9, 10) | `A'·C'·D + B'·C' + B'·D'` | 7 |
| Σm(1, 3, 7) + d(5) | `C` | 1 |
| Σm(1, 2, 4, 7) | `A'·B'·C + A'·B·C' + A·B'·C' + A·B·C` | 12 |

No hay dependencias más allá de las imágenes fijadas (`oven/bun:1.4.2` y `python:3.14.8-slim-trixie` con ruff 0.16.10 y pytest 9.1.1).
