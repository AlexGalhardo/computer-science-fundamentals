# Deadlock: la cena de los filósofos

> English version: [docs/en/concurrency/dining-philosophers.md](../../en/concurrency/dining-philosophers.md) · Versão em português: [docs/pt/concurrency/dining-philosophers.md](../../pt/concurrency/dining-philosophers.md)

Mini-proyecto: [projects/concurrency/dining-philosophers](../../../projects/concurrency/dining-philosophers/README.es.md) (MP-CONC-2). Lenguajes: Go, Java.

## El problema

Cinco filósofos, cinco tenedores, y cada filósofo necesita los dos tenedores a su lado para comer. Un tenedor es un lock: un dueño a la vez.

```text
            P0
       f0        f1
    P4              P1
       f4        f2
         P3  f3  P2
```

El filósofo `i` se sienta entre el tenedor `i` (izquierda) y el tenedor `i+1` (derecha). El último, P4, se sienta entre el tenedor 4 y el tenedor 0.

La regla ingenua es "toma el tenedor de la izquierda, luego el de la derecha". Cuando los cinco toman el tenedor de la izquierda en el mismo instante, P0 espera el tenedor 1 (que tiene P1), P1 espera el tenedor 2, y así hasta P4, que espera el tenedor 0, que tiene P0. Nadie puede continuar y nadie va a soltar lo que tiene. Eso es un deadlock.

Un deadlock no genera ningún error. El programa está vivo, no usa procesador y no hace nada. Desde afuera se detecta con un **tiempo límite sobre el progreso**, que es lo que hacen las pruebas: nadie comió durante 500 ms.

## Las cuatro condiciones

Un deadlock de recursos necesita cuatro condiciones al mismo tiempo (condiciones de Coffman):

| Condición | En la mesa |
| --- | --- |
| Exclusión mutua | Un tenedor tiene un dueño a la vez |
| Retener y esperar | Un filósofo conserva el primer tenedor mientras espera el segundo |
| Sin expropiación | Nadie puede quitarle un tenedor de la mano a otro filósofo |
| Espera circular | P0 espera a P1, P1 espera a P2, P2 espera a P3, P3 espera a P4 y P4 espera a P0 |

Las cuatro son necesarias. Quita una, cualquiera, y el deadlock se vuelve imposible. Las dos correcciones del mini-proyecto atacan la última condición.

## Corrección 1: ordenamiento de locks

Dale a los locks un orden global y toma siempre el menor primero. Los tenedores se numeran de 0 a 4. Cuatro filósofos no cambian: para P0 a P3 el tenedor de la izquierda ya es el menor. Solo cambia P4: ahora toma el tenedor 0 antes que el tenedor 4.

Un círculo de espera requeriría que alguien sostuviera un tenedor mayor mientras espera uno menor, y la regla prohíbe exactamente eso. Es la corrección más común en código real: "bloquea siempre las cuentas por id ascendente", "bloquea siempre el padre antes que el hijo".

## Corrección 2: un mesero

Un semáforo contador con 4 permisos hace el papel de mesero: un filósofo necesita un permiso antes de tocar un tenedor, y lo devuelve después de comer. Con a lo sumo cuatro filósofos disputando cinco tenedores, al menos uno de ellos siempre consigue dos. Un círculo necesita los cinco, así que no se forma.

El semáforo aquí no es un mutex: no protege una sección crítica, limita cuántos threads pueden estar en una región al mismo tiempo.

## No tener deadlock no es ser justo

En las mediciones, `waiter` da a todos los filósofos casi el mismo número de comidas, mientras que `ordered` es muy desigual: en una ejecución de 60 segundos en Go los filósofos comieron 3830, 7664, 15333, 45993 y 3830 veces. El ordenamiento de locks garantiza que la mesa nunca se congela. No garantiza que todos coman con la misma frecuencia. Un filósofo que casi nunca come está cerca de la **inanición** (starvation), un problema distinto del deadlock: el sistema avanza, pero no para él.

## Cómo leer la evidencia

El README del mini-proyecto anota, línea por línea, el thread dump del programa Java congelado (tomado con `jstack`) y el dump de goroutines del programa Go congelado. Las dos cosas que hay que buscar en cualquier dump son las mismas:

- threads bloqueados en un lock y que no usan tiempo de procesador;
- para cada uno de ellos, el lock que **tiene** y el lock que **espera**. Sigue esos dos y el círculo se cierra.

La JVM hace ese recorrido sola e imprime `Found one Java-level deadlock`. Go solo detecta el caso en que todas las goroutines están dormidas.

## Otras salidas

No se implementan aquí, pero vale la pena conocerlas:

- **Intentar y retroceder** (ataca retener y esperar): toma el segundo tenedor con un `tryLock` y, si falla, suelta el primero e intenta de nuevo. Hecho sin cuidado, los cinco pueden reintentar al mismo ritmo para siempre. Eso es un **livelock**: todos ocupados y nadie come.
- **Detección y recuperación**: dejar que ocurra, encontrar el ciclo y matar a un participante. Las bases de datos hacen esto con las transacciones.

## Quiz

Temas del área `concurrency` que este mini-proyecto demuestra: `deadlock-livelock-starvation`, `classic-problems` y `semaphores-and-monitors`.
