# dining-philosophers

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Cinco filósofos se sientan a una mesa redonda con cinco tenedores, uno entre cada par. Para comer, un filósofo necesita los dos tenedores a su lado. Si los cinco toman el tenedor de la izquierda en el mismo instante, cada uno espera para siempre el tenedor de la derecha, que está en la mano de un vecino. Eso es un deadlock. Este mini-proyecto construye la mesa que se congela, en Go y en Java, muestra cómo leer el thread dump del programa congelado y luego lo corrige de dos formas: ordenamiento de locks y un mesero (un semáforo).

La explicación más larga, con las cuatro condiciones del deadlock, está en [docs/es/concurrency/dining-philosophers.md](../../../docs/es/concurrency/dining-philosophers.md).

> La estrategia `naive` es **deliberadamente incorrecta** y está marcada así en el código.

## Temas del quiz que demuestra

- `concurrency` / `deadlock-livelock-starvation`: las cuatro condiciones, espera circular, ordenamiento de locks, lectura de un thread dump
- `concurrency` / `classic-problems`: la cena de los filósofos y sus correcciones
- `concurrency` / `semaphores-and-monitors`: un semáforo contador usado como mesero

## Cómo ejecutarlo

El único requisito es Docker.

```sh
./setup-unix-dining-philosophers.sh        # Linux y macOS
./setup-windows-dining-philosophers.ps1    # Windows
```

El script construye las dos imágenes y ejecuta todas las pruebas. Tarda unos tres minutos, porque cada corrección cena durante 60 segundos.

## Estructura

| Carpeta | Tenedores | Mesero |
| --- | --- | --- |
| `go/` | `sync.Mutex` | un canal con buffer de 4 posiciones |
| `java/` | `synchronized` sobre un objeto `Fork` | `java.util.concurrent.Semaphore` con 4 permisos |

Ambas implementan las mismas tres estrategias:

| Estrategia | Qué hace cada filósofo | Resultado |
| --- | --- | --- |
| `naive` | tenedor de la izquierda, luego el de la derecha | deadlock |
| `ordered` | primero el tenedor de menor número | sin deadlock: el círculo de espera no puede cerrarse |
| `waiter` | le pide un lugar al mesero primero, y solo 4 de los 5 pueden estar sentados | sin deadlock: un círculo necesita los cinco |

Entre el primer y el segundo tenedor todo filósofo hace una pausa de 1 ms. La pausa vuelve común la mala suerte en el tiempo, así que la mesa ingenua se congela en milisegundos en lugar de una vez cada mucho tiempo. Las correcciones usan la misma pausa.

## Pruebas

```sh
docker compose run --rm go-test
docker compose run --rm java-test
```

| Qué se prueba | Cómo |
| --- | --- |
| La mesa ingenua entra en deadlock en al menos 9 de 10 ejecuciones | un tiempo límite sobre el progreso: nadie comió durante 500 ms. En Java, la JVM también debe señalar los cinco threads en un ciclo de locks (`ThreadMXBean.findDeadlockedThreads`) |
| `ordered` y `waiter` se ejecutan 60 segundos con todos los filósofos comiendo | el contador de comidas de cada filósofo debe estar por encima de cero y la mesa nunca puede detenerse por 2 segundos |
| `ordered` realmente toma primero el tenedor menor | prueba unitaria del orden de los tenedores |

`SOAK_SECONDS=5` acorta la cena larga, por ejemplo `docker compose run --rm -e SOAK_SECONDS=5 go-test`.

Los formateadores y compiladores se ejecutan en los mismos contenedores, antes de las pruebas: `gofmt` y `go vet`, Spotless con google-java-format y `javac -Xlint:all -Werror`. golangci-lint usa la configuración de la raíz del repositorio:

```sh
docker run --rm --network none -v "$PWD/go:/app:ro" -v "$PWD/../../..:/repo:ro" -w /app sef-go:local golangci-lint run -c /repo/.golangci.yml ./...
```

## Demo

```sh
docker compose run --rm go-demo
docker compose run --rm java-demo
```

Cada estrategia cena durante 3 segundos. Salida versionada en [results/demo-go.txt](results/demo-go.txt) y [results/demo-java.txt](results/demo-java.txt):

```text
strategy deadlock   meals per philosopher
naive    true       [0 0 0 0 0]
ordered  false      [189 377 754 2266 191]
waiter   false      [1468 1468 1469 1468 1470]
```

Dos cosas que notar. La mesa ingenua no sirvió nada: se congeló en la primera ronda. Y `ordered` nunca se congela, pero es injusta: el filósofo 3 comió cerca de doce veces más que el filósofo 0. El ordenamiento de locks elimina el deadlock, no el riesgo de inanición. En la prueba de 60 segundos todo filósofo aún comió miles de veces en Go, y al menos cien veces en Java.

## El thread dump del deadlock, línea por línea

```sh
docker compose run --rm java-dump    # jstack sobre la JVM congelada
docker compose run --rm go-dump      # la pila de cada goroutine
```

Las capturas completas están en [results/thread-dump-java.txt](results/thread-dump-java.txt) y [results/goroutine-dump-go.txt](results/goroutine-dump-go.txt).

### Java (`jstack`)

Un thread dump lista todos los threads de la JVM. Los que importan son los cinco filósofos. Este es el primero, y los otros cuatro tienen la misma forma:

| Línea del dump | Qué dice |
| --- | --- |
| `"philosopher-0" #34 [30] daemon prio=5 os_prio=0 cpu=1.15ms elapsed=3.25s tid=0x0000798fe8174070 nid=30 waiting for monitor entry  [0x0000798f97afe000]` | El nombre que le dimos al thread, su número en la JVM (`#34`) y en el sistema operativo (`[30]`, `nid=30`). `cpu=1.15ms` frente a `elapsed=3.25s`: en más de tres segundos de vida usó un milisegundo de procesador. No está trabajando, está atascado. `waiting for monitor entry` significa que está en la puerta de un bloque `synchronized` |
| `java.lang.Thread.State: BLOCKED (on object monitor)` | El estado del thread. `BLOCKED` es exactamente "esperando un lock que otro thread tiene". Un thread que duerme o espera una notificación estaría en `TIMED_WAITING` o `WAITING` |
| `at philosophers.Table.lambda$run$0(Table.java:122)` | Dónde se detuvo: dentro del bucle del filósofo en `Table.run`, en el `synchronized` interno, el del segundo tenedor |
| `- waiting to lock <0x0000000716236fd0> (a philosophers.Table$Fork)` | El lock que quiere: el objeto en la dirección `...6fd0`, que es un `Fork`. Es su segundo tenedor |
| `- locked <0x0000000716236fc0> (a philosophers.Table$Fork)` | El lock que ya tiene: el `Fork` en `...6fc0`, su primer tenedor. Tener uno y esperar otro es la condición "retener y esperar", visible en dos líneas |
| `at philosophers.Table$$Lambda/0x0000000063041410.run(Unknown Source)` | La lambda pasada a `new Thread(...)`. No tiene línea de código fuente porque la JVM genera esa clase en tiempo de ejecución |
| `at java.lang.Thread.runWith(java.base@25.0.4.1/Thread.java:1487)` y `at java.lang.Thread.run(java.base@25.0.4.1/Thread.java:1474)` | El fondo de toda pila de thread: el código del JDK que inició el thread |

Sigue las direcciones y el círculo aparece. `philosopher-0` espera `...6fd0`, y en el bloque siguiente `philosopher-1` tiene `locked <...6fd0>` y espera `...6fe0`, y así hasta `philosopher-4`, que espera `...6fc0`, que tiene `philosopher-0`.

Nadie tiene que seguir las direcciones a mano, porque la JVM lo hace e imprime el ciclo al final del dump:

| Línea del dump | Qué dice |
| --- | --- |
| `Found one Java-level deadlock:` | La JVM recorrió el grafo "thread espera un lock que tiene otro thread" y encontró un ciclo. "Java-level" significa que los locks son monitores de Java, no nativos |
| `"philosopher-0":` | Primer thread del ciclo |
| `waiting to lock monitor 0x0000798f78002430 (object 0x0000000716236fd0, a philosophers.Table$Fork),` | Lo que espera. La dirección del objeto es la misma `...6fd0` de la pila de arriba. La dirección del monitor es la estructura interna de lock de la JVM para ese objeto |
| `which is held by "philosopher-1"` | El dueño de ese lock. Es una arista del ciclo: 0 espera a 1 |
| `"philosopher-1": ... which is held by "philosopher-2"` | Las aristas siguientes, con las mismas dos líneas cada una: 1 espera a 2, 2 espera a 3, 3 espera a 4 |
| `"philosopher-4": ... which is held by "philosopher-0"` | La arista que cierra el círculo: 4 espera a 0. Es la condición "espera circular", escrita por la propia JVM |
| `Java stack information for the threads listed above:` | Las pilas de los threads del ciclo se repiten debajo de esta línea, para que el reporte pueda leerse solo |
| `Found 1 deadlock.` | El resumen. Una JVM sana no imprime esta sección |

### Go (dump de goroutines)

Go no tiene un reporte de ciclos incorporado, pero el dump trae la misma información. Un bloque por goroutine:

| Línea del dump | Qué dice |
| --- | --- |
| `goroutine 19 [sync.Mutex.Lock]:` | La goroutine número 19 y, entre corchetes, por qué no está corriendo: está bloqueada dentro de `sync.Mutex.Lock`. Una goroutine atascada por más de un minuto también muestra el tiempo, por ejemplo `[sync.Mutex.Lock, 2 minutes]` |
| `internal/sync.runtime_SemacquireMutex(0x0?, 0x0?, 0x0?)` y `/usr/local/go/src/runtime/sema.go:95 +0x25` | El marco más profundo: el runtime puso a dormir la goroutine en el semáforo interno del mutex. Todo marco ocupa dos líneas: la función y, después, el archivo y la línea |
| `internal/sync.(*Mutex).lockSlow(0x1a9431996008)` | El camino lento de `Lock`, usado cuando el mutex ya está ocupado. El argumento es la dirección del mutex: `...6008`. Los tenedores son un slice de mutexes de 8 bytes que empieza en `...6000`, así que este es el tenedor 1 |
| `internal/sync.(*Mutex).Lock(...)` y `sync.(*Mutex).Lock(...)` | La llamada pública a `Lock`. `(...)` significa que el compilador incorporó la función (inline), así que los argumentos no aparecen |
| `dining-philosophers.Run.func1()` y `/src/philosophers.go:112 +0x1fe` | Nuestro código: el bucle del filósofo, detenido en la línea 112, `table[second].Lock()`. Ya bloqueó su primer tenedor dos líneas arriba |
| `sync.(*WaitGroup).Go.func1()` | El envoltorio que `wg.Go` pone alrededor de nuestra función |
| `created by sync.(*WaitGroup).Go in goroutine 1` | Quién inició esta goroutine: la goroutine principal |

Las cinco goroutines de filósofos (19 a 23) están todas en `[sync.Mutex.Lock]` en la misma línea 112, esperando los mutexes en `...6008`, `...6010`, `...6018`, `...6020` y `...6000`: tenedores 1, 2, 3, 4 y 0. Cada una espera el tenedor que la siguiente tomó primero. El dump no dice quién tiene un mutex, porque un mutex de Go no tiene dueño: el círculo se deduce a partir del código.

La goroutine 1 está `[running]`: es la goroutine principal escribiendo el dump. Si también estuviera bloqueada, el runtime de Go detendría el programa por sí solo con `fatal error: all goroutines are asleep - deadlock!`. Esa verificación solo funciona cuando todas las goroutines están atascadas, lo cual es raro en un servidor real.
