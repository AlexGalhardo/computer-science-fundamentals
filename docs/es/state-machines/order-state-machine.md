# Máquina de estados de un pedido

> English version: [docs/en/state-machines/order-state-machine.md](../../en/state-machines/order-state-machine.md) · Versão em português: [docs/pt/state-machines/order-state-machine.md](../../pt/state-machines/order-state-machine.md)

Miniproyecto MP-FSM-1, en [`projects/state-machines/order-state-machine`](../../../projects/state-machines/order-state-machine). Enseña cómo los estados y transiciones explícitos eliminan situaciones inválidas. Lenguajes: TypeScript y Elixir.

## El problema de las banderas

Una forma común de guardar la situación de un pedido es un booleano por cada hecho: `isPaid`, `isShipped`, `isDelivered`, `isCancelled`, `isRefunded`. Cinco booleanos se pueden combinar de 2^5 = 32 maneras, y el negocio conoce solo 6 situaciones. Las otras 26 combinaciones, como "cancelado y entregado", no significan nada, y aun así la base de datos las guarda sin quejarse. Entonces cada función que lee el pedido debe defenderse de ellas.

Una máquina de estados le da la vuelta a esto. El pedido tiene **un** campo de estado con un conjunto cerrado de valores, y los cambios permitidos se listan en **una** tabla. Lo que no está en la tabla no ocurre.

## La máquina

Estados: `created`, `paid`, `shipped`, `delivered`, `cancelled`, `refunded`. Eventos: `pay`, `ship`, `deliver`, `cancel`, `refund`.

| estado | pay | ship | deliver | cancel | refund |
| --- | --- | --- | --- | --- | --- |
| created | paid | - | - | cancelled | - |
| paid | - | shipped | - | - | refunded |
| shipped | - | - | delivered | - | - |
| delivered | - | - | - | - | refunded |
| cancelled | - | - | - | - | - |
| refunded | - | - | - | - | - |

La tabla es una función parcial de (estado, evento) al siguiente estado. Hay 6 × 5 = 30 pares: 6 están definidos y 24 se rechazan. `cancelled` y `refunded` tienen filas vacías, así que son estados terminales. Las decisiones del negocio son visibles en la tabla: un pedido solo se puede cancelar antes del pago, después del pago el camino de vuelta es un reembolso, y un paquete en tránsito no se puede cancelar ni reembolsar hasta que se entregue.

La tabla vive en [`machine.json`](../../../projects/state-machines/order-state-machine/machine.json) y ambas implementaciones leen ese único archivo.

## Reglas como datos, mecanismo como código

La implementación en TypeScript separa dos cosas:

- **Las reglas** son datos. `machine.json` se valida con Zod al cargarse: solo estados y eventos conocidos, y como máximo un destino para cada par (estado, evento). Esa última verificación es lo que hace determinista a la máquina.
- **El mecanismo** es una función genérica, `transition(state, event)`, que consulta el par. Nunca menciona un estado por su nombre. Devuelve `{ ok: true, state }` o `{ ok: false, reason }`, así que quien llama no puede usar el nuevo estado sin comprobar que existe, y un evento rechazado no cambia nada.

Pasar un pedido por n eventos cuesta n consultas, sea cual sea el número de estados. Así es como corre un autómata finito determinista.

Los estados y los eventos también son tipos cerrados de TypeScript. `labels.ts` tiene un `switch` sobre los estados que termina en una verificación de exhaustividad: añadir un estado a la lista y olvidarlo ahí es un error de compilación, no una sorpresa en producción.

## La misma tabla en Elixir

La lección cambia en Elixir, y por eso el miniproyecto tiene un segundo lenguaje. El módulo lee `machine.json` en tiempo de compilación y escribe una cláusula de función por fila:

```elixir
def transition(:created, :pay), do: {:ok, :paid}
def transition(:created, :cancel), do: {:ok, :cancelled}
# ...one clause per row of the table...
def transition(state, event), do: {:error, {:invalid_transition, state, event}}
```

La consulta se hace por pattern matching: las cláusulas se prueban de arriba abajo, y la cláusula comodín del final convierte todos los demás pares en un error explícito. El orden de las cláusulas importa. El texto escrito en la línea de comandos se compara con los nombres de eventos conocidos y nunca se convierte en un átomo nuevo.

## Pruebas generadas a partir de la tabla

La prueba principal no es una lista de casos escritos a mano. Es un bucle sobre todos los pares (estado, evento):

- los 6 pares de la tabla deben tener éxito y llegar al destino de la tabla;
- los otros 24 deben rechazarse y dejar el pedido en el mismo estado.

Un estado nuevo o un evento nuevo añade sus casos positivos y negativos sin que nadie los escriba. Una prueba extra fija los números 30, 6 y 24, para que un cambio accidental en la tabla se note en la revisión.

## El diagrama no puede quedar desactualizado

[`diagram.md`](../../../projects/state-machines/order-state-machine/diagram.md) contiene un diagrama de estados Mermaid y la tabla de arriba. Se genera a partir de `machine.json` con un comando y se confirma en el repositorio, así que se puede leer en GitHub. Una prueba compara el archivo confirmado con lo que produce el generador y falla cuando difieren.

La implementación en Elixir renderiza el mismo texto por su cuenta y tiene la misma prueba. Si los dos lenguajes alguna vez discreparan sobre la tabla, una de las dos pruebas fallaría, así que el archivo también demuestra que ambos implementan la misma máquina.

## Cómo ejecutarlo

```sh
./setup-unix-order-state-machine.sh        # Linux and macOS
./setup-windows-order-state-machine.ps1    # Windows
```

El único requisito es Docker. El script construye las imágenes, ejecuta las pruebas y ejecuta la demo: un pedido completo (`pay`, `ship`, `deliver`) y un pedido en el que `deliver` llega antes que `ship` y se rechaza.

```sh
docker compose run --rm ts-demo bun run order pay pay       # a duplicated payment is rejected
docker compose run --rm elixir-demo mix order pay refund    # paid, then refunded (terminal)
docker compose run --rm ts-diagram                          # regenerate diagram.md
```

## Lo que deja fuera

La máquina es una función pura. Un sistema real también debe guardar el estado y sobrevivir a la concurrencia y a los fallos: dos solicitudes que leen el mismo estado necesitan una actualización condicional atómica, y una transición con un efecto externo, como cobrar una tarjeta, necesita que ese efecto sea idempotente. Tampoco se usan guardas, acciones de entrada y salida ni estados jerárquicos. Estos temas los cubre el quiz.

## Quiz

El miniproyecto está enlazado desde las preguntas del área `state-machines` que demuestra, en los temas `states-transitions-events-actions`, `deterministic-finite-automata` y `state-machines-in-software`.
