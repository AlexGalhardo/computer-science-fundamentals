# master-theorem

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Un teorema maestro interactivo. Enseña **cómo los tres casos del teorema maestro deciden el costo de una recurrencia** `T(n) = a·T(n/b) + f(n)`: un clasificador devuelve el caso y la solución, una función recursiva generada comprueba la predicción contando llamadas reales, y una página estática dibuja el árbol de recursión para los `a`, `b` y `f(n)` que elijas.

Explicación completa: [docs/es/big-o/master-theorem.md](../../../docs/es/big-o/master-theorem.md).

## Temas del quiz que demuestra

- `big-o` / `recurrences-master-theorem`: escribir la recurrencia de un algoritmo de divide y vencerás, los tres casos, el árbol de recursión y las recurrencias que el teorema no cubre.

## Cómo ejecutarlo

El único requisito es Docker.

```sh
./setup-unix-master-theorem.sh        # Linux y macOS
./setup-windows-master-theorem.ps1    # Windows
```

El script construye la imagen, ejecuta las pruebas y ejecuta la demo.

## Estructura

| Ruta | Qué es |
| --- | --- |
| `ts/src/classify.ts` | el clasificador: caso, solución y un aviso cuando el teorema no se aplica |
| `ts/src/tree.ts` | el árbol de recursión, nivel por nivel |
| `ts/src/empirical.ts` | una función recursiva generada que cuenta sus llamadas y su trabajo |
| `ts/src/cli.ts` | `bun run classify <a> <b> <d> [k]` |
| `ts/src/demo.ts` | `bun run demo`: recurrencias conocidas, comprobación empírica, `results/` |
| `dashboard/` | página estática (HTML + Tailwind CSS v4, CSS compilado versionado) |
| `results/` | resultados versionados: `results.md`, `results.json`, `results.js` |

TypeScript sobre la imagen fijada `oven/bun:1.4.2`. La única dependencia es `zod` 4.6.5, que valida la entrada de la línea de comandos contra las hipótesis del teorema (`a ≥ 1`, `b > 1`).

## Pruebas

```sh
docker compose run --rm ts-test
```

Las pruebas cubren una recurrencia por caso y recurrencias que no encajan, y verifican que el crecimiento medido concuerde con la clase predicha para merge sort, búsqueda binaria y una división en 7.

## Demo, línea de comandos y página

```sh
docker compose run --rm ts-demo                              # todas las recurrencias conocidas y la comprobación empírica
docker compose run --rm ts-demo bun run classify 7 2 2       # una recurrencia: T(n) = 7T(n/2) + n^2
docker compose run --rm ts-demo bun run classify 2 2 1 1     # T(n) = 2T(n/2) + n log n: no se aplica
```

Los argumentos son `a`, `b`, `d` y un `k` opcional, para `f(n) = n^d · (log n)^k`. El comando imprime el caso, el motivo en inglés, portugués y español (una línea `EN:`, una `PT:` y una `ES:`), la solución y el árbol de recursión para un `n` pequeño.

Luego abre `dashboard/index.html` en un navegador, directo desde el disco. Elige `a`, `b` y `f(n)`: la página muestra el caso y dibuja el árbol con una barra por nivel, para que veas si quienes pagan la cuenta son las hojas, todos los niveles o la raíz.
