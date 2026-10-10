# Patrones de diseño en el back-end

> English version: [docs/en/design-patterns/backend-patterns.md](../../en/design-patterns/backend-patterns.md) · Versão em português: [docs/pt/design-patterns/backend-patterns.md](../../pt/design-patterns/backend-patterns.md)

Miniproyecto MP-PAT-1, en [`projects/design-patterns/backend-patterns`](../../../projects/design-patterns/backend-patterns). Enseña qué dolor elimina cada uno de diez patrones de diseño, mostrando primero el diseño que falla.

## Cómo leerlo

Un patrón es una respuesta con nombre a un problema que siempre vuelve. Aprender la respuesta sin el problema produce código lleno de patrones que nadie necesitaba. Por eso cada carpeta de `ts/src/` tiene dos archivos:

- `before.ts`: un diseño que funciona y duele. El comentario de la cabecera dice dónde duele.
- `after.ts`: el mismo comportamiento, con el patrón.

Las pruebas de `ts/tests/` ejecutan ambos. El bloque `before` de cada archivo fija el defecto con una aserción, de modo que el defecto es un hecho y no una opinión.

## Los diez patrones

| Patrón | Tipo | El dolor en `before.ts` | Qué cambia `after.ts` |
| --- | --- | --- | --- |
| Strategy | de comportamiento | una rama por tipo de envío; un tipo nuevo implica editar la función | cada tipo es un objeto con la misma interfaz, y uno nuevo se escribe en cualquier lugar |
| Observer | de comportamiento | el pedido llama a cada reacción a su propio pago | el pedido publica un evento; las reacciones se suscriben |
| Command | de comportamiento | cada operación está dividida entre un método y una rama de `undo` | cada operación es un objeto que sabe ejecutarse y revertirse |
| State | de comportamiento | el estado se comprueba en cada método | cada estado es un objeto que responde a cada operación |
| Factory | creacional | la decisión de qué clase crear está copiada, y una copia está desactualizada | una tabla toma la decisión, y el compilador comprueba que esté completa |
| Builder | creacional | siete parámetros posicionales, sin validación entre campos | pasos con nombre, y `build` rechaza una petición incoherente |
| Singleton | creacional | **es el diseño que falla** | una clase común, inyectada |
| Adapter | estructural | la regla de negocio habla el vocabulario del proveedor | la regla es dueña de un contrato, y una clase pequeña por proveedor traduce |
| Decorator | estructural | una subclase por combinación de funcionalidades | un envoltorio por funcionalidad, combinados al ensamblar |
| Repository | arquitectónico | el caso de uso escribe SQL | el caso de uso ve una colección, y el almacenamiento queda detrás de una interfaz |

## Detalles que muestran las pruebas

**Strategy.** La prueba añade una estrategia `drone` dentro del propio archivo de pruebas. Nada en `src/` cambia: eso es el principio abierto-cerrado visto desde fuera.

**Observer.** El bus publica sobre una copia instantánea de su lista. Un oyente que se cancela a sí mismo durante la entrega no hace que se omita el siguiente, y un oyente suscrito durante la entrega espera al siguiente evento. Cada oyente está aislado, así que uno que lanza una excepción no detiene a los demás, y su error se devuelve al publicador. Suscribirse devuelve la función que cancela, porque un oyente que vive menos que el bus nunca sería recolectado.

**Factory.** En el diseño que falla, `welcome` admite el canal push y `orderShipped` no. La versión con factory tipa su tabla como `Record<Channel, ...>`, de modo que añadir un canal a la lista sin un creador es un error de compilación.

**Adapter.** Dos proveedores inventados hacen el mismo trabajo con nombres de método, unidades (unidades monetarias frente a centavos) y respuestas distintos. La regla se prueba con ambos adaptadores y con un objeto simple, sin ningún proveedor.

**Decorator.** Con dos funcionalidades, la herencia ya necesita tres clases y repite el código de la caché; con n funcionalidades necesita 2ⁿ − 1. El orden de los envoltorios es parte del comportamiento: `Logged` por fuera registra cada llamada, `Cached` por fuera registra solo las llamadas que llegan al almacén. Un decorator es un subtipo de lo que envuelve, así que el mismo contrato (una lectura después de una escritura devuelve lo escrito) se ejecuta contra cada combinación.

**Repository.** El doble de prueba del diseño que falla tiene que reconocer tres cadenas SQL exactas. La versión con el patrón prueba la misma regla con un `Map` detrás de una interfaz.

**Command.** El historial tiene dos pilas. Deshacer revierte primero el comando más reciente, y ejecutar un comando nuevo vacía la pila de rehacer. La prueba añade un comando `DoubleQuantity` sin editar el carrito ni el historial.

**State.** Una tabla de transiciones se escribe en la prueba y ambos diseños deben obedecerla: 12 casos cada uno (4 estados × 3 operaciones). Una última prueba lee los dos archivos fuente y cuenta los condicionales sobre el estado: tres en `before.ts`, ninguno en `after.ts`.

**Builder.** `build` es la única puerta: allí se rechazan un POST sin cuerpo, un GET con cuerpo y un tiempo de espera no positivo. El producto está congelado y sus cabeceras son una copia, así que un builder que sigue usándose no puede cambiar una petición que ya entregó.

## Singleton, y por qué evitarlo

Un Singleton une dos decisiones: hay una sola instancia, y es accesible desde cualquier lugar. La primera suele ser legítima. La segunda es una variable global.

En `singleton/before.ts`, `RateLimiter` tiene un constructor que recibe solo un límite. Parece independiente. Dentro de `allow` llama a `RequestCounter.getInstance()`, y así dos limitadores que nunca se presentaron cuentan sobre los mismos números. Las pruebas lo muestran dos veces:

1. Tres llamadas a través del limitador `login` hacen que se rechace la primera llamada a través de un limitador `search` recién creado.
2. La siguiente prueba crea un limitador nuevo y es rechazada de inmediato, porque el estado sobrevivió de la prueba anterior. Esa prueba pasa solo cuando se ejecuta después de la primera.

`singleton/after.ts` conserva la clase y descarta el patrón. `RequestCounter` es una clase común y el limitador la recibe por el constructor. Los limitadores con sus propios contadores son independientes, un contador nuevo empieza desde cero en cada prueba, y "una sola instancia" sigue disponible como una decisión visible: `createApp`, la composition root, entrega el mismo contador a `login` y `passwordReset` a propósito.

## Cómo ejecutarlo

```sh
cd projects/design-patterns/backend-patterns
docker compose run --rm ts-test    # tests
docker compose run --rm ts-demo    # one scenario per pattern, on both designs
```

No hay dependencias ni red: la imagen es `oven/bun:1.4.2` y ambos servicios se ejecutan con `network_mode: none`.

## Criterios de aceptación

| Ítem | Criterio | Dónde se verifica |
| --- | --- | --- |
| MP-PAT-1.1 | Strategy, Observer, Factory, Adapter y Decorator tienen cada uno una versión con el diseño que falla, la versión con el patrón y pruebas | `ts/src/<pattern>/before.ts`, `after.ts`, `ts/tests/<pattern>.test.ts` |
| MP-PAT-1.2 | Repository, Command, State y Builder tienen la misma estructura | mismas rutas |
| MP-PAT-1.3 | una prueba muestra el estado compartido oculto, y la versión inyectada lo elimina | `ts/tests/singleton.test.ts` |

## Temas del quiz relacionados

`design-patterns` / `creational-patterns`, `structural-patterns`, `behavioural-patterns`, `repository-dependency-injection`.
