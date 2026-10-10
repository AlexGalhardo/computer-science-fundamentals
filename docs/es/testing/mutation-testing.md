# Pruebas de mutación (MP-TEST-3)

> English version: [docs/en/testing/mutation-testing.md](../../en/testing/mutation-testing.md) · Versão em português: [docs/pt/testing/mutation-testing.md](../../pt/testing/mutation-testing.md)

Mini-proyecto: [`projects/testing/mutation-testing`](../../../projects/testing/mutation-testing/README.es.md). Tema del quiz: `coverage-mutation`.

## El concepto

La **cobertura** responde "¿qué líneas ejecutaron las pruebas?". No responde "¿notarían las pruebas si esta línea estuviera mal?". Una prueba sin ninguna aserción ejecuta una línea igual que la mejor prueba del mundo.

Las **pruebas de mutación** hacen directamente la segunda pregunta:

```text
original program ---- mutate one token ----> mutant           (a + b  becomes  a - b)
                                                |
                                         run the test suite
                                                |
                       +------------------------+------------------------+
                       |                                                 |
              a test fails: KILLED                         every test passes: SURVIVED
           the suite noticed the bug                 the suite accepts the bug as correct
```

```text
mutation score = killed mutants / all mutants
```

Un mutante es un modelo de un descuido real: un operador equivocado, un límite desplazado en uno, una constante errónea. Una suite que mata a la mayoría de los mutantes probablemente notaría la mayoría de los descuidos del mismo tipo.

## Qué muestra el mini-proyecto

Un módulo (`shipping.ts`, el precio de un envío) y dos suites:

| | Suite débil | Suite fuerte |
| --- | --- | --- |
| Cobertura de líneas | 100% | 100% |
| Aserción típica | `typeof cents === "number"`, `toBeGreaterThan(0)` | `toBe(1700)`, valores en cada límite |
| Mutantes muertos | 4 de 19 | 18 de 19 |
| Puntuación de mutación | 21.1% | 94.7% |

La columna de cobertura es idéntica. La última fila no. Esa es toda la lección: la cobertura es una condición necesaria (una línea que nunca se ejecutó ciertamente no está probada) y no una suficiente.

## Leer a los sobrevivientes

Cada mutante sobreviviente es una pregunta que la suite no hizo. Tres ejemplos del informe:

| Mutante | Por qué la suite débil lo deja vivir | La prueba que lo mata |
| --- | --- | --- |
| `150` a `151` (precio por kg) | el resultado sigue siendo un número positivo | `expect(shippingCents(3 kg)).toBe(650)` |
| `>=` a `>` (distancia de 100 km) | ninguna prueba usa exactamente 100 km | una prueba a 99 km y una a 100 km |
| `<=` a `<` (límite de 30 kg) | ninguna prueba usa exactamente 30 kg | `isAccepted(30 kg)` es `true`, `isAccepted(30.5 kg)` es `false` |

Los mutantes de límite mueren solo en el valor límite. Las pruebas de mutación y el análisis de valores límite señalan las mismas pruebas desde dos direcciones.

## El mutante equivalente

```ts
if (parcel.weightKg > FREE_WEIGHT_KG) {                       // mutant: >=
	cents = cents + (parcel.weightKg - FREE_WEIGHT_KG) * CENTS_PER_EXTRA_KG;
}
```

Con `>=` la rama también se toma en exactamente 2 kg, donde suma `(2 - 2) * 150 = 0`. El mutante es un texto distinto con el mismo comportamiento, así que ninguna prueba puede matarlo. Decidir si un mutante es equivalente es indecidible en general, por eso las herramientas informan la puntuación cruda y las personas revisan a los sobrevivientes. Una meta de 100% no siempre es alcanzable, y perseguirla a ciegas es tan equivocado como perseguir un número de cobertura.

## Cómo funciona el mutador

`ts/src/mutator.ts`, unas 100 líneas, sin dependencias:

1. **Tokenizar.** Una expresión regular divide el código fuente en comentarios, strings, identificadores, números, operadores y el resto. Los tokens más largos van primero, así `>=` es un token.
2. **Mutar.** Para cada operador o número, produce una copia del código fuente con ese único token reemplazado (`+` y `-` intercambiados, `<` a `<=`, `&&` y `||` intercambiados, `!` eliminado, `n` a `n + 1`).
3. **Ejecutar.** Para cada mutante, escribe el archivo en una copia borrador del proyecto y ejecuta una suite, con un límite de tiempo, porque un mutante puede crear un bucle infinito.
4. **Contar.** El código de salida 0 significa sobrevivió, cualquier otro significa muerto.

Antes de cualquier mutante, cada suite se ejecuta sobre el código original: una suite que ya está en rojo "mataría" todo por la razón equivocada.

## Costo y límites

- El costo es `mutantes x tiempo de la suite`. Aquí 19 mutantes y una suite de milisegundos. En un proyecto real hay miles de mutantes, así que las herramientas ejecutan solo las pruebas que cubren la línea mutada, se detienen en la primera prueba que falla y mutan solo el código modificado.
- Este mutador trabaja sobre tokens, no sobre el árbol sintáctico. No distingue un genérico `<T>` de una comparación. Tiene un puñado de operadores y ninguno que elimine una sentencia.
- Una puntuación alta dice que las aserciones son sensibles a cambios pequeños. No dice nada sobre requisitos faltantes: el código que nunca se escribió no tiene mutantes.

## Ejecutar

```sh
./setup-unix-mutation-testing.sh        # Linux and macOS
./setup-windows-mutation-testing.ps1    # Windows
```
