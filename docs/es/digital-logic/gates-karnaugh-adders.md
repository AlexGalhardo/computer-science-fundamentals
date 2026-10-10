# Compuertas lógicas, Karnaugh y sumadores

> English version: [docs/en/digital-logic/gates-karnaugh-adders.md](../../en/digital-logic/gates-karnaugh-adders.md) · Versão em português: [docs/pt/digital-logic/gates-karnaugh-adders.md](../../pt/digital-logic/gates-karnaugh-adders.md)

Mini-proyecto MP-DL-1, en [`projects/digital-logic/gates-karnaugh-adders`](../../../projects/digital-logic/gates-karnaugh-adders). Enseña cómo una función booleana se convierte en un circuito: de una expresión a una tabla de verdad, de una tabla de verdad a la expresión más pequeña, y de compuertas a un circuito que suma.

## 1. Una expresión es un circuito

`A·B + C'` y el dibujo de una compuerta AND y un inversor que alimentan una compuerta OR son el mismo objeto. El parser de `ts/src/expression.ts` convierte el texto en un árbol en el que cada nodo es una compuerta y cada hoja es un cable de entrada:

```text
        OR
       /  \
    AND    NOT
    / \     |
   A   B    C
```

Las prioridades son las habituales: NOT se aplica primero, luego AND, luego XOR, luego OR. Evaluar el árbol para unos valores de entrada dados es simular el circuito, y hacerlo para las 2^n combinaciones de las entradas, en orden de conteo binario, da la tabla de verdad. La fila k de la tabla es el minterm k, con la primera variable como bit más significativo.

```text
A B C | F
---------
0 0 0 | 1
0 0 1 | 0
0 1 0 | 1
0 1 1 | 0
1 0 0 | 1
1 0 1 | 0
1 1 0 | 1
1 1 1 | 1
```

La tabla de verdad es también la herramienta que resuelve cualquier duda del álgebra booleana: dos expresiones son equivalentes exactamente cuando sus columnas de salida son iguales. Los teoremas de De Morgan, la absorción y el teorema del consenso se comprueban así en las pruebas, en lugar de aceptarse por confianza.

**Aceptación.** Se escribieron veinte tablas de verdad a mano y el generador las reproduce todas, en los dos lenguajes.

## 2. De la tabla de verdad a la expresión más pequeña

La suma de productos canónica tiene un término por cada fila con salida 1, lo cual es correcto y derrochador. El mapa de Karnaugh elimina el derroche a simple vista: las celdas vecinas difieren en una variable, así que un par de celdas con 1 es un término sin esa variable (X·Y + X·Y' = X), un grupo de cuatro pierde dos variables, y así sucesivamente.

El método de Quine-McCluskey es la misma idea escrita como un procedimiento, así que funciona para cualquier número de variables:

1. **Encontrar todos los implicantes primos.** Se parte de los minterms. Se fusionan cada dos términos que difieren en exactamente una variable en un término sin ella, y se repite con los términos fusionados. Un término que nunca se fusionó es un grupo que no puede crecer: un implicante primo.
2. **Elegir una cobertura.** Un implicante primo es **esencial** cuando es el único que cubre algún minterm, así que debe estar en la respuesta. Para los minterms que siguen sin cubrir, `minimise` ejecuta una búsqueda exacta y se queda con la cobertura de menos términos y, entre esas, la de menos literales.

Los **términos irrelevantes (don't-care)** participan en el paso 1, donde ayudan a formar grupos más grandes, pero no están en la lista que el paso 2 debe cubrir.

| Función | Implicantes primos | Esenciales | Suma de productos mínima |
| --- | ---: | ---: | --- |
| Σm(0, 2, 4, 5, 6) | 2 | 2 | `A·B' + C'` |
| Σm(1, 3, 7) | 2 | 2 | `A'·C + B·C` |
| Σm(1, 3, 7) + d(5) | 1 | 1 | `C` |
| Σm(0, 2, 5, 7, 8, 10, 13, 15) | 2 | 2 | `B'·D' + B·D` |
| Σm(0, 1, 2, 5, 8, 9, 10) | 3 | 3 | `A'·C'·D + B'·C' + B'·D'` |
| Σm(1, 2, 4, 7) | 4 | 4 | los cuatro minterms: nada se fusiona |
| Σm(0, 1, 2, 5, 6, 7) | 6 | 0 | tres términos de dos literales |

Tres filas merecen una segunda mirada. La cuarta es el XNOR de B y D: sus grupos son las cuatro esquinas y las cuatro celdas del centro, que solo existen porque el mapa se enrolla sobre sí mismo. La sexta es el patrón de tablero de ajedrez de A xor B xor C, donde no hay dos celdas con 1 que sean vecinas y la suma de productos no puede encogerse. La última es un mapa cíclico: ningún implicante primo es esencial, así que elegir de forma voraz no basta y la búsqueda exacta es lo que garantiza tres términos.

**Aceptación.** La expresión minimizada se escribe de nuevo como texto, se analiza otra vez y su tabla de verdad se compara con la original en cada fila. Esto se hace para las 256 funciones de 3 variables, las 65.536 funciones de 4 variables y funciones aleatorias de 5 y 6 variables. Con términos irrelevantes, toda fila exigida debe coincidir y las filas irrelevantes quedan libres.

Un límite que conviene conocer: la minimización exacta es exponencial en el peor caso. Está bien para los tamaños de un curso, y las herramientas de síntesis reales usan heurísticas como Espresso en su lugar.

## 3. De las compuertas a la aritmética

Sumar dos bits da un bit de suma y un acarreo. La tabla muestra que la suma es XOR y el acarreo es AND: ese es el **semisumador**. Para sumar una columna en medio de un número hace falta una tercera entrada, el acarreo que viene de la derecha. El **sumador completo** son dos semisumadores y una OR:

```text
Suma           = A xor B xor Cin
Acarreo salida = A·B + Cin·(A xor B)        (1 cuando al menos dos entradas son 1)
```

Encadenar n sumadores completos, con el acarreo de salida de cada etapa conectado al acarreo de entrada de la siguiente, da el **sumador ripple-carry**:

```text
acarreo de salida de cada etapa:    01111000
A = 109                             01101101
B = 58                              00111010
suma = 167, acarreo de salida = 0   10100111
```

La línea de acarreo muestra el costo de este diseño: un acarreo puede tener que recorrer todas las etapas, así que el retardo en el peor caso crece con el número de bits. `255 + 1` es el peor caso, con un acarreo de salida de las ocho etapas.

**Aceptación.** El sumador de 8 bits construido con compuertas coincide con la suma nativa para los 65.536 pares de entrada, acarreo de salida incluido.

## Por qué hay una versión en Python

El código TypeScript simula una fila a la vez, que es como se explica el tema en el papel. Los enteros de Python no tienen límite de tamaño, y eso cambia la lección: una columna entera de la tabla de verdad cabe en **un entero**, donde el bit r es el valor de la señal en la fila r.

```text
A           00001111   = 240
B           00110011   = 204
C           01010101   = 170
A & B | ~C  10101011   = 213
```

Una compuerta procesa entonces todas las filas con un solo `&`, `|` o `^`. Esto es simulación bit-paralela. Hay dos detalles que conviene notar en `python/logic.py`: NOT es un XOR con la columna de unos, porque el `~` de Python daría un número negativo, y no se escribe ningún parser, porque `ast.parse` ya conoce las prioridades de `~`, `&`, `^` y `|`. Solo se aceptan los tipos de nodo de una expresión booleana y nunca se ejecuta nada con `eval`.

El sumador muestra la ganancia. Las 16 entradas del sumador de 8 bits se convierten en 16 columnas de 65.536 bits cada una, y ejecutar la red de compuertas **una vez**, 40 operaciones de compuerta, suma todos los pares de bytes al mismo tiempo.

## Ejecución

```sh
./setup-unix-gates-karnaugh-adders.sh        # Linux y macOS
./setup-windows-gates-karnaugh-adders.ps1    # Windows
```

El script necesita solo Docker. Construye las imágenes, ejecuta las pruebas de ambos lenguajes y después las demos, que escriben `results/results-ts.md` y `results/results-python.md`.

## Temas del quiz

`logic-gates`, `boolean-algebra`, `karnaugh-maps` y `arithmetic-circuits`, en el área `digital-logic`. El siguiente mini-proyecto, [nand-alu-cpu](nand-alu-cpu.md), parte de una sola compuerta y llega hasta un procesador pequeño.
