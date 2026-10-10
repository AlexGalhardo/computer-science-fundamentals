# Detección de deadlocks y un mini shell

> English version: [docs/en/operating-systems/deadlock-mini-shell.md](../../en/operating-systems/deadlock-mini-shell.md) · Versão em português: [docs/pt/operating-systems/deadlock-mini-shell.md](../../pt/operating-systems/deadlock-mini-shell.md)

Mini-proyecto: [`projects/operating-systems/deadlock-mini-shell`](../../../projects/operating-systems/deadlock-mini-shell/). Elemento del plan: MP-OS-4. Temas del quiz: `operating-systems` / `deadlocks`, `introduction-and-system-calls` y `processes-and-threads`.

## Qué enseña

Dos caras del mismo tema. El mini shell muestra cómo se crean y se conectan los procesos: `fork`, `exec`, `pipe`, `dup2`, `waitpid` y señales. Los programas de deadlock muestran qué puede salir mal cuando los procesos retienen recursos y esperan por más: cómo ver un deadlock en un grafo, y cómo el algoritmo del banquero rechaza las solicitudes que podrían llevar a uno.

## Parte 1: deadlocks (Go)

Un deadlock de recursos necesita cuatro condiciones al mismo tiempo: exclusión mutua, retención y espera (hold and wait), no apropiación (no preemption) y espera circular.

### Grafo de asignación de recursos

Con una instancia por recurso, el estado es un grafo: un arco de un recurso a un proceso significa "retiene", y un arco de un proceso a un recurso significa "está esperando". Hay un deadlock exactamente cuando el grafo tiene un ciclo. El programa reduce el grafo a solo procesos (P espera a Q cuando P solicita un recurso que Q retiene) e informa dos conjuntos:

- **en deadlock**: los procesos que están en un ciclo;
- **bloqueados detrás del ciclo**: procesos fuera del ciclo que esperan un recurso retenido dentro de él. No forman parte de la espera circular, pero también esperarán para siempre.

Grafos verificados por las pruebas:

| Grafo | Retiene y solicita | En deadlock | Bloqueados detrás |
| --- | --- | --- | --- |
| De libro de texto, 7 procesos | A retiene R, quiere S. B quiere T. C quiere S. D retiene U, quiere S y T. E retiene T, quiere V. F retiene W, quiere S. G retiene V, quiere U | D, E, G | B |
| Quiz, 5 procesos | A retiene R, quiere S. B retiene S, quiere T. C retiene T, quiere R. D retiene U, quiere V. E quiere U | A, B, C | ninguno |
| Cadena, 3 procesos | A retiene R, quiere S. B retiene S, quiere T. C retiene T | ninguno | ninguno |

En el primer grafo el ciclo es D → T → E → V → G → U → D. S está libre, así que A, C y F solo esperan un recurso libre. B espera T, que E retiene dentro del ciclo.

### Detección con varias instancias

Cuando un tipo de recurso tiene varias instancias, un ciclo ya no basta y se usan matrices: qué está disponible, qué retiene cada proceso y qué está solicitando ahora cada proceso. El algoritmo busca un proceso cuya solicitud quepa en lo disponible, supone que termina y devuelve lo que retiene, y repite. Quien queda al final está en deadlock.

Ejemplo con disponible = (2, 1, 0, 0):

| Proceso | Retiene | Solicita |
| --- | --- | --- |
| P0 | 0 0 1 0 | 2 0 0 1 |
| P1 | 2 0 0 1 | 1 0 1 0 |
| P2 | 0 1 2 0 | 2 1 0 0 |

P2 cabe y termina, dejando (2, 2, 2, 0). Luego cabe P1, dejando (4, 2, 2, 1). Luego P0. No hay deadlock. Si P2 también pide una unidad del último recurso, (2, 1, 0, 1), nadie cabe y los tres están en deadlock.

### Algoritmo del banquero

La detección mira el presente. La evitación (avoidance) mira el peor caso: cada proceso declara de antemano su necesidad máxima, y un estado es **seguro** cuando algún orden permite que todos los procesos terminen aunque cada uno pida su máximo. El banquero concede una solicitud solo si el estado resultante es seguro. Inseguro no significa en deadlock: significa que la garantía se perdió.

Estados verificados por las pruebas:

**Un solo recurso, 10 unidades.** A retiene 3 de un máximo de 9, B retiene 2 de un máximo de 4, C retiene 2 de un máximo de 7, y 3 están libres. Seguro: B necesita 2 y termina, dejando 5. C necesita 5 y termina, dejando 7. A necesita 6.

- A pide 1: quedan libres 2. B termina y deja 4, pero A y C necesitan 5 ambos. **Inseguro, denegado.**
- B pide 1: quedan libres 2 y B necesita 1 más. **Seguro, concedido.**

**Cuatro tipos de recurso, cinco procesos.** Disponible (1, 0, 2, 0).

| Proceso | Retiene | Máximo | Aún necesita |
| --- | --- | --- | --- |
| P0 | 3 0 1 1 | 4 1 1 1 | 1 1 0 0 |
| P1 | 0 1 0 0 | 0 2 1 2 | 0 1 1 2 |
| P2 | 1 1 1 0 | 4 2 1 0 | 3 1 0 0 |
| P3 | 1 1 0 1 | 1 1 1 1 | 0 0 1 0 |
| P4 | 0 0 0 0 | 2 1 1 0 | 2 1 1 0 |

Seguro: P3, P4, P0, P1, P2. P1 pide (0, 0, 1, 0): sigue siendo seguro, **concedido**. Luego P4 pide (0, 0, 1, 0): lo disponible sería (1, 0, 0, 0) y ningún proceso cabe, **denegado por inseguro**.

**Tres tipos de recurso, cinco procesos.** Disponible (3, 3, 2), retienen (0 1 0), (2 0 0), (3 0 2), (2 1 1), (0 0 2), máximos (7 5 3), (3 2 2), (9 0 2), (2 2 2), (4 3 3). Seguro: P1, P3, P4, P0, P2. P1 pide (1, 0, 2): **concedido**. Luego P4 pide (3, 3, 0): solo hay libre (2, 3, 0), **debe esperar**. Luego P0 pide (0, 2, 0): **denegado por inseguro**.

**Estado del quiz** (pregunta `operating-systems-deadlocks-05`): disponible (2, 1, 2), seguro. De los cinco órdenes listados en la pregunta solo P1, P3, P2, P0 es una secuencia segura, y una prueba reproduce los cinco.

La salida completa de la demo está en [`results/results.md`](../../../projects/operating-systems/deadlock-mini-shell/results/results.md).

## Parte 2: el mini shell (C++)

`msh` lee una línea, la analiza (parse) como un pipeline y la ejecuta.

```text
sort < in.txt | uniq | wc -l > out.txt

  in.txt --> [ sort ] --pipe--> [ uniq ] --pipe--> [ wc -l ] --> out.txt
              child 1            child 2            child 3
                   \________________|________________/
                        the shell waits for all three
```

| Llamada al sistema | Papel en el shell |
| --- | --- |
| `fork` | crea un hijo por comando, una copia del shell |
| `pipe` | crea el canal entre dos vecinos del pipeline |
| `dup2` | hace que el pipe, o un archivo, se convierta en la entrada o salida estándar del hijo |
| `exec` | reemplaza la copia del shell en el hijo por el programa solicitado |
| `waitpid` | el shell espera a cada hijo, para que ninguno quede como zombie |

Tres detalles que el código explica donde ocurren:

- **Por qué `fork` y `exec` están separados.** Entre los dos, el hijo todavía ejecuta el código del shell y puede reorganizar sus propios descriptores. El programa nuevo simplemente lee el descriptor 0 y escribe en el descriptor 1.
- **Por qué el shell cierra sus copias de los extremos del pipe.** Un lector recibe fin de archivo solo cuando todos los extremos de escritura están cerrados. Si el shell mantuviera uno abierto, el último comando esperaría para siempre. La prueba `seq 1 100000 | head -n 3 | wc -l` verifica la dirección contraria: cuando `head` termina, `seq` debe detenerse.
- **Por qué `cd` es un builtin.** El directorio de trabajo pertenece a cada proceso. Un hijo que lo cambiara terminaría justo después, dejando al shell donde estaba.

### Señales

Ctrl-C hace que la terminal envíe SIGINT a todos los procesos del grupo en primer plano, el shell incluido. El shell ignora SIGINT, y cada hijo restaura la acción por defecto antes de `exec`, porque una señal ignorada sigue ignorada a través de `exec`. Así el pipeline en ejecución muere y el shell continúa. El shell informa `terminated by signal 2` y fija el estado en 128 + 2.

### El script de prueba

`cpp/test_shell.sh` se ejecuta dentro del contenedor:

| Verificación | Comandos |
| --- | --- |
| Pipeline de tres comandos | `printf ... \| sort \| uniq` |
| Tres comandos con `<`, `>` y `>>` | `sort < in \| uniq \| wc -l > out`, luego `echo extra >> out` |
| Un lector que sale antes termina el pipeline | `seq 1 100000 \| head -n 3 \| wc -l` |
| Comillas, `cd`, estado de salida, `exit`, comando desconocido (127), error de sintaxis (2) | varios |
| Interrupción | `sleep 30 \| cat \| cat` recibe SIGINT tras un segundo: el pipeline se detiene de inmediato, el shell imprime el informe y ejecuta la siguiente línea |

### Lo que el shell no hace

Sin variables, sin globbing, sin `&&` ni `;`, sin trabajos en segundo plano, y sin grupo de procesos por trabajo: depende de que la terminal entregue Ctrl-C a todo el grupo en primer plano. Es una herramienta didáctica.

## Ejecútalo

```sh
cd projects/operating-systems/deadlock-mini-shell
./setup-unix-deadlock-mini-shell.sh    # o setup-windows-deadlock-mini-shell.ps1
docker compose run --rm demo           # informe de deadlock, escribe results/
docker compose run --rm shell-demo     # un script en el mini shell
docker compose run --rm shell          # mini shell interactivo
```

## Dos lenguajes

Aquí los lenguajes hacen trabajos distintos en lugar del mismo dos veces. Go se adapta a los algoritmos de grafos y matrices: slices, maps y pruebas basadas en tablas. C++ se adapta al shell, porque `fork`, `exec`, `pipe` y `dup2` son interfaces en C del sistema operativo y se pueden llamar directamente.

## Fuente

Tanenbaum, Modern Operating Systems (4.ª edición), capítulo 6 (deadlocks) y capítulo 1, secciones 1.5 y 1.6 (el shell y las llamadas al sistema para la gestión de procesos).
