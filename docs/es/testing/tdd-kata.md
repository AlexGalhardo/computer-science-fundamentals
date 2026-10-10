# Kata de TDD con historial de commits (MP-TEST-2)

> English version: [docs/en/testing/tdd-kata.md](../../en/testing/tdd-kata.md) · Versão em português: [docs/pt/testing/tdd-kata.md](../../pt/testing/tdd-kata.md)

Mini-proyecto: [`projects/testing/tdd-kata`](../../../projects/testing/tdd-kata/README.es.md). Temas del quiz: `tdd-cycle`, `unit-tests-isolation`.

## El concepto

El desarrollo guiado por pruebas es un ritmo de tres pasos, siempre en el mismo orden:

```text
   +-----------+   write the smallest code   +-----------+
   |    RED    | --------------------------> |   GREEN   |
   | a failing |                             | all tests |
   |   test    | <-------------------------- |   pass    |
   +-----------+     next item of the list   +-----------+
                                               |       ^
                                               v       |
                                             +-----------+
                                             | REFACTOR  |  remove duplication,
                                             | still all |  behaviour unchanged
                                             |  passing  |
                                             +-----------+
```

- **Red.** Escribe una prueba para un comportamiento que todavía no existe, y mírala fallar. Una prueba que nunca se vio fallar no ha demostrado que pueda detectar nada.
- **Green.** Escribe el menor código que la haga pasar. Feo está permitido: una constante, una copia de otra clase.
- **Refactor.** Con todas las pruebas pasando, quita el desorden hecho en el paso anterior. Aquí no hay comportamiento nuevo.

De ahí salen dos reglas: ningún código de producción sin una prueba fallando que lo pida, y ninguna limpieza mientras una prueba esté fallando.

## El mini-proyecto

El entregable es el historial de git de la carpeta: 27 commits de pasos (10 red, 10 green, 7 refactor) que resuelven el problema del dinero multimoneda, `$5 + 10 CHF = $10` a una tasa de 2. El [README](../../../projects/testing/tdd-kata/README.es.md) tiene el paso a paso, una línea y un enlace por commit.

El prefijo del commit lleva el paso:

| Prefijo | Paso |
| --- | --- |
| `test(tdd-kata): red - ...` | una prueba nueva que falla |
| `feat(tdd-kata): green - ...` | el cambio que la hace pasar |
| `refactor(tdd-kata): ...` | una limpieza con la barra en verde |

## Tres formas de llegar a green

| Estrategia | Cuándo | En el kata |
| --- | --- | --- |
| Fake it | No estás seguro del código. Devuelve una constante, y deja que el siguiente paso fuerce lo real | `times` devuelve `$10`; `reduce` devuelve `$10` |
| Triangulación | Hay un fake puesto. Un segundo ejemplo con otro valor hace imposible la constante | `$5 times 3`; `$3 + $4` |
| Implementación obvia | El código está claro en tu cabeza. Escríbelo | `equals` compara los montos |

Son marchas, no un ritual. Una sorpresa (un red inesperado) es la señal para bajar de marcha a pasos más pequeños.

## Cómo apareció el diseño

No se dibujó nada antes de la primera prueba. El diseño salió de quitar duplicación:

1. `Dollar` solo, luego `Franc` como una copia descarada para poner una prueba en verde.
2. La copia se elimina en refactorizaciones pequeñas: `equals` sube a `Money`, luego `times`, luego las subclases quedan vacías y se borran.
3. Subir `equals` hizo que 5 CHF fuera igual a $5. Ninguna prueba se quejó, porque ninguna lo preguntó. La siguiente prueba red lo preguntó, y la moneda entró en la comparación.
4. `$5 + 10 CHF` no podía responderse con un `Money`, porque el resultado depende de una tasa. Esa prueba es la que creó `Sum` y la interfaz `Expression`.

## Cómo se comprueba el historial

- **Prefijos** (`ts/scripts/history.ts`, en Docker): una máquina de estados sobre los asuntos de los commits. Red solo con la barra en verde, green solo justo después de un red, refactor solo con la barra en verde, ningún historial que termine en red, al menos 3 ciclos y una refactorización. El verificador tiene sus propias pruebas, una por cada forma de romper el ritmo.
- **Reproducción** (`replay-unix-tdd-kata.sh`): los prefijos son una afirmación, así que el script extrae el código de cada commit de paso y ejecuta las pruebas en un contenedor desechable. Todo commit red falla y todo commit green y refactor pasa: `27 steps replayed, 0 wrong`.
- **Instantánea** (`ts/HISTORY.txt`): una copia del `git log` de la carpeta, comprobada por una prueba, para lugares donde el historial no existe (un clon superficial de CI).

Como la lección es el historial, la rama debe fusionarse sin squash y sin rebase.

## Límites

- El historial muestra el orden de los pasos, no el pensamiento entre ellos. La lista de tareas (`TODO.md`) registra una parte.
- Un historial así de ordenado es un recurso de enseñanza. El trabajo real tiene falsos comienzos. Lo importante es la dirección: primero la prueba, pasos pequeños, limpiar en verde.
- TDD produce una suite de regresión y un diseño fácil de probar. No reemplaza las pruebas de integración, y es difícil de aplicar a interfaces de usuario y a código cuyo resultado no se conoce de antemano.

## Ejecutar

```sh
./setup-unix-tdd-kata.sh        # Linux and macOS
./setup-windows-tdd-kata.ps1    # Windows
```
