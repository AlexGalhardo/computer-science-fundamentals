# tdd-kata

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

El kata de dinero multimoneda, hecho con desarrollo guiado por pruebas, donde el entregable es el **historial de git**: 27 commits que alternan una prueba que falla (red), el cambio más pequeño que la hace pasar (green) y una limpieza con todas las pruebas pasando (refactor). El código final tiene unas 90 líneas. Lo que vale la pena estudiar es el orden en que se escribieron.

Código: MP-TEST-2. Explicación completa: [docs/es/testing/tdd-kata.md](../../../docs/es/testing/tdd-kata.md).

## Temas del quiz que demuestra

- `testing` / `tdd-cycle`: red, green, refactor; fake it, triangulación e implementación obvia; la lista de tareas; pasos pequeños; refactorizar solo con la barra en verde
- `testing` / `unit-tests-isolation`: objetos de valor e igualdad probados a través de la interfaz pública

## El problema

Sumar montos en distintas monedas y convertir el resultado, dados unos tipos de cambio: `$5 + 10 CHF = $10` cuando 2 CHF compran 1 dólar. El kata es el ejemplo clásico de la literatura de TDD. El código y los pasos de aquí se escribieron para este repositorio.

## Ejecutar

El único requisito es Docker.

```sh
./setup-unix-tdd-kata.sh        # Linux and macOS
./setup-windows-tdd-kata.ps1    # Windows
```

El script ejecuta la verificación de tipos y las pruebas del kata terminado y luego comprueba el ritmo del historial de git (ver abajo).

## Pruebas

```sh
docker compose run --rm ts-test
```

9 pruebas del kata, 7 pruebas del verificador de historial y 1 prueba que comprueba la instantánea versionada del historial.

## Demo: comprobar el historial

```sh
git log --reverse --format="%h %s" -- . | docker compose run --rm -T history
```

Git se ejecuta en el host y el verificador se ejecuta en Docker. Lee solo los prefijos de los commits:

| Prefijo | Paso | Regla |
| --- | --- | --- |
| `test(tdd-kata): red - ...` | una prueba nueva que falla | solo con la barra en verde: nunca dos pruebas fallando a la vez |
| `feat(tdd-kata): green - ...` | hacerla pasar | solo justo después de un red: ningún código de producción sin una prueba fallando |
| `refactor(tdd-kata): ...` | limpiar | solo con la barra en verde |

También exige al menos 3 ciclos, al menos una refactorización, y un historial que no termine en rojo. Los commits con cualquier otro prefijo (el esqueleto, esta documentación) no son pasos y se ignoran.

Los prefijos son una afirmación. Para probarla, el script de reproducción extrae el código de cada commit de paso y ejecuta las pruebas en un contenedor desechable: todo commit `red` debe fallar y todo commit `green` y `refactor` debe pasar.

```sh
./replay-unix-tdd-kata.sh        # or replay-windows-tdd-kata.ps1
```

Resultado sobre el historial versionado: `27 steps replayed, 0 wrong`.

Ambos comandos necesitan git y el historial completo. En un clon superficial (un job de CI con `fetch-depth: 1`) el script de setup omite la comprobación en vivo, y el ritmo igual se verifica con una prueba sobre [`ts/HISTORY.txt`](ts/HISTORY.txt), una instantánea del mismo `git log`.

**Conserva los commits.** Fusionar esta rama con squash o hacerle rebase destruye la lección, y un rebase además cambia los hashes enlazados abajo.

## Paso a paso

Cada paso enlaza a su commit. Lee el diff de cada uno: ninguno es más grande que una pantalla.

| # | Paso | Qué ocurre | Commit |
| --- | --- | --- | --- |
| 1 | red | $5 por 2 es $10 | [`350b73b`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/350b73b) |
| 2 | green | fake it: times devuelve $10 | [`4009c9b`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/4009c9b) |
| 3 | red | triangular con $5 por 3 | [`37fbac3`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/37fbac3) |
| 4 | green | times multiplica el monto | [`f659df2`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/f659df2) |
| 5 | red | los dólares son iguales cuando sus montos son iguales | [`09782c5`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/09782c5) |
| 6 | green | implementación obvia: equals compara los montos | [`c30c7dd`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/c30c7dd) |
| 7 | refactor | comparar valores completos con equals en las pruebas | [`e03cb61`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/e03cb61) |
| 8 | red | 5 CHF por 2 es 10 CHF | [`e81bdce`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/e81bdce) |
| 9 | green | copiar Dollar a Franc | [`1c184df`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/1c184df) |
| 10 | refactor | subir el monto y equals a Money | [`737fdc8`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/737fdc8) |
| 11 | red | 5 CHF no es igual a $5 | [`e236d10`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/e236d10) |
| 12 | green | equals también compara la moneda | [`3726797`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/3726797) |
| 13 | refactor | mover times a Money | [`15eb25a`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/15eb25a) |
| 14 | refactor | crear dinero con Money.dollar y Money.franc | [`4253425`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/4253425) |
| 15 | refactor | eliminar las subclases vacías Dollar y Franc | [`512f11c`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/512f11c) |
| 16 | red | $5 + $5 es $10 | [`17702bc`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/17702bc) |
| 17 | green | fake it: reduce devuelve $10 | [`5de03f7`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/5de03f7) |
| 18 | red | triangular con $3 + $4 | [`b46ef1a`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/b46ef1a) |
| 19 | green | reduce devuelve la suma que recibió | [`4d8f892`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/4d8f892) |
| 20 | red | 2 CHF son $1 a una tasa de 2 | [`214e092`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/214e092) |
| 21 | green | el Bank guarda las tasas y un Money se convierte a sí mismo | [`912e09e`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/912e09e) |
| 22 | refactor | nombrar la clave de una tasa | [`c82506d`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/c82506d) |
| 23 | red | $5 + 10 CHF es $10 | [`a671f72`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/a671f72) |
| 24 | green | una expresión Sum reduce ambos lados antes de sumar | [`f7eebe5`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/f7eebe5) |
| 25 | red | a una suma se le puede sumar y multiplicar | [`5cc8402`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/5cc8402) |
| 26 | green | plus y times pertenecen a toda Expression | [`c4343b1`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/c4343b1) |
| 27 | refactor | agrupar las pruebas por comportamiento | [`326a071`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/326a071) |

La lista de tareas ([`TODO.md`](TODO.md)) cambia en los mismos commits: una idea que surge en medio de un paso se anota y se deja para después.

## Qué notar

- **Fake it (pasos 2 y 17).** El primer green devuelve una constante. Demuestra que la prueba puede pasar y que está bien conectada, a casi ningún costo.
- **Triangulación (pasos 3 y 18).** Un segundo ejemplo hace imposible la constante, y solo entonces se escribe el código real.
- **Implementación obvia (paso 6).** Cuando el código es claro, se escribe directamente. Falsear es una forma de ir más despacio cuando uno no está seguro, no un ritual.
- **Un pecado deliberado (paso 9).** Franc es una copia de Dollar. Llegar rápido al verde está permitido. Quedarse ahí no: los pasos 10 a 15 eliminan la copia.
- **Refactorizar encuentra bugs (pasos 10 y 11).** Subir `equals` hizo que 5 CHF fuera igual a $5. Ninguna prueba lo notó, porque ninguna lo preguntó. El siguiente red lo pregunta.
- **Las pruebas también cambian en una refactorización (pasos 7, 14 y 27),** pero nunca junto con un cambio de comportamiento.
- **El diseño llega tarde (paso 24).** `Expression` y `Sum` existen solo porque una prueba no podía satisfacerse sin ellos.

## Estructura

```text
ts/src/money.ts            Money, Sum and the Expression interface
ts/src/bank.ts             exchange rates and reduce
ts/tests/money.test.ts     the tests of the kata
ts/scripts/history.ts      the checker of the commit prefixes
ts/HISTORY.txt             snapshot of the git log of this folder
TODO.md                    the to-do list of the kata
```

Dependencias, fijadas: `typescript` 7.0.2 y `@types/bun` 1.4.2 para la verificación de tipos, sobre `oven/bun:1.4.2`. El kata usa solo el ejecutor de pruebas integrado en Bun.
