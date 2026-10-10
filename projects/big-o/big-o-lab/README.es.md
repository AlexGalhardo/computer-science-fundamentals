# big-o-lab

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Un laboratorio que enseña a **medir una función y reconocer su curva de crecimiento**. Seis algoritmos pequeños, uno por clase (O(1), O(log n), O(n), O(n log n), O(n²) y O(2ⁿ)), cuentan sus propias operaciones básicas mientras el tamaño de la entrada se duplica. Los conteos se comparan con una fórmula cerrada, y un paso de ajuste de curvas nombra la clase solo a partir de los números.

Explicación completa: [docs/es/big-o/big-o-lab.md](../../../docs/es/big-o/big-o-lab.md).

## Temas del quiz que demuestra

- `big-o` / `growth-of-functions`: la escalera de clases y qué le hace duplicar n a cada una.
- `big-o` / `counting-operations`: contar la operación básica de bucles, bucles anidados y bucles que dividen a la mitad.
- `big-o` / `asymptotic-notation`: las constantes y los términos de menor orden no cambian la clase (n(n − 1)/2 sigue siendo cuadrático).

## Cómo ejecutarlo

El único requisito es Docker.

```sh
./setup-unix-big-o-lab.sh        # Linux y macOS
./setup-windows-big-o-lab.ps1    # Windows
```

El script construye la imagen, ejecuta las pruebas y ejecuta la demo.

## Estructura

| Ruta | Qué es |
| --- | --- |
| `ts/src/samples.ts` | los seis algoritmos instrumentados y sus fórmulas cerradas |
| `ts/src/fit.ts` | ajuste por mínimos cuadrados de los conteos a las seis curvas candidatas |
| `ts/src/lab.ts` | ejecuta cada muestra en cada tamaño y mide el tiempo |
| `ts/src/demo.ts` | la CLI: imprime las tablas y escribe `results/` |
| `dashboard/` | página estática (HTML + Tailwind CSS v4, CSS compilado versionado) |
| `results/` | resultados versionados: `results.md`, `results.json`, `results.js` |

La implementación está en TypeScript sobre la imagen fijada `oven/bun:1.4.2`, sin dependencias.

## Pruebas

```sh
docker compose run --rm ts-test
```

Las pruebas verifican que cada conteo de operaciones sea igual a su fórmula cerrada, que los tamaños se dupliquen y que el ajuste nombre la clase correcta para las seis muestras.

## Demo y panel

```sh
docker compose run --rm ts-demo
```

Esto ejecuta `bun run demo` en el contenedor. Imprime una tabla por muestra (n, operaciones contadas, fórmula, tiempo) con el mejor ajuste y su error, y reescribe `results/`. Luego abre `dashboard/index.html` en un navegador, directo desde el disco: grafica los resultados versionados en ejes log-log.

Los conteos de operaciones son exactos e iguales en cualquier máquina. Los tiempos son la mediana de 5 ejecuciones y dependen de la máquina registrada en `results/results.md`.
