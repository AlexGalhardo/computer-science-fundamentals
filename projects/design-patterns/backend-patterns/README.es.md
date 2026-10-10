# backend-patterns

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Diez patrones de diseño en situaciones de back-end en las que valen la pena. Cada patrón tiene una carpeta con **el diseño que falla** (`before.ts`), **la versión con el patrón** (`after.ts`) y pruebas que ejecutan ambos, para que veas el problema antes que la solución. Enseña **qué dolor elimina cada patrón** y, en el caso de Singleton, por qué el patrón es el dolor.

Explicación completa: [docs/es/design-patterns/backend-patterns.md](../../../docs/es/design-patterns/backend-patterns.md).

## Temas del quiz que demuestra

- `design-patterns` / `creational-patterns`: Factory, Builder, Singleton y su estado compartido oculto.
- `design-patterns` / `structural-patterns`: Adapter y Decorator (orden de apilamiento, el contrato que un decorator debe mantener).
- `design-patterns` / `behavioural-patterns`: Strategy, Observer, Command y State.
- `design-patterns` / `repository-dependency-injection`: Repository, inyección por constructor y la composition root.

## Ejecución

El único requisito es Docker.

```sh
./setup-unix-backend-patterns.sh        # Linux and macOS
./setup-windows-backend-patterns.ps1    # Windows
```

El script construye la imagen, ejecuta las pruebas y ejecuta la demo.

## Estructura

| Ruta | Diseño que falla (`before.ts`) | Versión con el patrón (`after.ts`) |
| --- | --- | --- |
| `ts/src/strategy/` | una función con una rama por tipo de envío | un objeto por tipo, elegido desde fuera |
| `ts/src/observer/` | el pedido llama a cada reacción a su pago | un bus de eventos: las reacciones se suscriben |
| `ts/src/factory/` | la decisión de creación copiada en dos funciones, una desactualizada | una tabla tipada decide la clase |
| `ts/src/adapter/` | la regla llama al SDK del proveedor y devuelve sus tipos | un `PaymentGateway` y un adaptador por proveedor |
| `ts/src/decorator/` | una subclase por combinación de funcionalidades | envoltorios `Logged` y `Cached`, apilados en cualquier orden |
| `ts/src/repository/` | el caso de uso escribe SQL | una interfaz `UserRepository` y una implementación en memoria |
| `ts/src/command/` | operaciones como métodos, deshechas por un solo `switch` | objetos de comando con `execute` y `undo`, y un historial con rehacer |
| `ts/src/state/` | un campo de estado comprobado en cada método | un objeto de estado por cada estado |
| `ts/src/builder/` | un constructor con siete parámetros posicionales | pasos con nombre y un `build` que valida |
| `ts/src/singleton/` | **el propio Singleton**: `getInstance()` y estado compartido oculto | una clase común, inyectada, conectada en una composition root |

`ts/src/demo.ts` es la demo, y `ts/tests/` tiene un archivo de pruebas por patrón.

TypeScript sobre la imagen fijada `oven/bun:1.4.2`, sin dependencias: Bun es el runtime y el ejecutor de pruebas.

## Pruebas

```sh
docker compose run --rm ts-test
```

Cada archivo de pruebas tiene un bloque `before` y un bloque `after`. El bloque `before` demuestra que el diseño que falla funciona **y** fija su defecto: un tipo de envío que no se puede añadir desde fuera, una copia olvidada de una decisión de creación, una petición POST creada sin cuerpo. El bloque `after` muestra el mismo comportamiento sin el defecto. Donde ambos diseños deben comportarse igual (State, Decorator), un solo contrato se ejecuta contra ambos.

`tests/singleton.test.ts` es especial: sus dos pruebas `before` dependen del orden en que se ejecutan. Es deliberado. Es el estado compartido oculto, mostrado por una prueba.

## Demo

```sh
docker compose run --rm ts-demo
```

Imprime un escenario por patrón, ejecutado en ambos diseños:

```text
strategy
  before: throws "unknown shipping kind: drone"
  after:  drone shipping added from outside: total 15300 cents
...
singleton
  before: after 3 logins, the first search is allowed: false
  after:  after 3 logins, the first search is allowed: true
```

No hay panel: la lección está en el código y en las pruebas, y la demo es un recorrido por ellos desde la línea de comandos.
