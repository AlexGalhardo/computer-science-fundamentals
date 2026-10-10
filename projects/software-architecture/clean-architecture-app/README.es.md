# clean-architecture-app

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Una aplicación de notas construida en los cuatro círculos de la Arquitectura Limpia, más una raíz de composición. Enseña una sola idea: **las dependencias del código fuente apuntan solo hacia adentro**, de modo que las reglas de negocio no saben nada del framework web, de la terminal ni de la base de datos. Los mismos casos de uso se alcanzan por HTTP (ElysiaJS) y por una línea de comandos, y se almacenan en memoria o en PostgreSQL, y tres cosas las verifica un programa y no un diagrama: ninguna capa interna importa una externa, los casos de uso se prueban sin base de datos y sin servidor HTTP, y reemplazar el repositorio cambia solo la raíz de composición.

Código: MP-ARCH-1. Explicación completa: [docs/es/software-architecture/clean-architecture-app.md](../../../docs/es/software-architecture/clean-architecture-app.md).

## Temas del quiz que demuestra

- `software-architecture` / `clean-architecture-dependency-rule`: los círculos, la dirección de los imports frente a la dirección de las llamadas, la inversión de dependencias, la regla impuesta por una verificación automática
- `software-architecture` / `entities-use-cases`: reglas de dominio frente a reglas de aplicación, objetos de valor que se autovalidan, puertos que pertenecen a los casos de uso, casos de uso probados sin infraestructura
- `software-architecture` / `interface-adapters`: controllers y presenters que no importan el framework, DTOs en la frontera, mapeo de errores a códigos de estado y códigos de salida, validación de formato en el borde
- `software-architecture` / `frameworks-drivers-composition-root`: el framework y la base de datos como detalles, inyección por constructor, la raíz de composición, el intercambio de un detalle
- `software-architecture` / `layered-hexagonal`: puertos y adaptadores, adaptadores conductores (HTTP, terminal) y adaptadores conducidos (repositorios), varios adaptadores para un puerto
- `software-architecture` / `domain-driven-design`: objeto de valor frente a entidad, el repositorio como una colección de objetos de dominio

## Ejecutar

El único requisito es Docker.

```sh
./setup-unix-clean-architecture-app.sh        # Linux and macOS
./setup-windows-clean-architecture-app.ps1    # Windows
```

El script construye una imagen, ejecuta las pruebas unitarias en un contenedor sin red, ejecuta las pruebas de integración contra un contenedor de PostgreSQL, ejecuta la demostración y elimina los contenedores al final. La red de compose es interna y no se publica ningún puerto en el host.

## Las capas

```text
ts/src/
  entities/     Note, Title, domain errors, Result        imports nothing but itself
  use-cases/    CreateNote, ListNotes, UpdateNote,         imports entities
                RemoveNote, and the ports they need
  adapters/     HTTP controller, CLI controller and        imports use-cases, entities, and Zod
                presenter, in-memory repository
  drivers/      Elysia server, PostgreSQL repository,      imports adapters, use-cases, entities,
                system clock, ids, terminal output         and any library
  main/         configuration, composition root,           imports everything; nothing imports it
                the two entry points
```

| Ruta | Qué es |
| --- | --- |
| `ts/src/entities/note.ts`, `title.ts` | La entidad y su objeto de valor. Los constructores son privados, así que no se puede construir una nota inválida |
| `ts/src/use-cases/ports.ts` | `NoteRepository`, `Clock`, `IdGenerator`: lo que necesitan los casos de uso, declarado por ellos |
| `ts/src/use-cases/create-note.ts` | Un caso de uso, con la regla de aplicación "no hay dos notas con el mismo título" |
| `ts/src/adapters/note-http-controller.ts` | `HttpRequest` y `HttpResponse` simples, validación con Zod, errores mapeados a códigos de estado |
| `ts/src/adapters/note-cli-controller.ts` | Los mismos casos de uso para una terminal: palabras de entrada, líneas y un código de salida |
| `ts/src/adapters/in-memory-note-repository.ts` | El puerto implementado con un `Map` |
| `ts/src/drivers/elysia-server.ts` | El único archivo que importa el framework web |
| `ts/src/drivers/postgres-note-repository.ts` | El único archivo que contiene SQL |
| `ts/src/main/composition.ts` | La raíz de composición: el único archivo que nombra un repositorio concreto |
| `ts/tools/dependency-rule.ts` | La verificación automática de la regla de dependencia |

## 1. La regla de dependencia, verificada por un programa

```sh
docker compose run --rm ts-test bun run check:layers
```

```text
ok   entities   4 files, 0 violations
ok   use-cases  6 files, 0 violations
ok   adapters   3 files, 0 violations
ok   drivers    3 files, 0 violations
ok   main       4 files, 0 violations

dependency rule holds: every import points inward
```

La verificación lee cada import de `ts/src/`, incluidos `import type`, las re-exportaciones y los imports dinámicos. Un archivo puede importar de su propia capa y de las capas que están dentro de ella. Las dos capas internas no pueden importar ningún paquete, los adaptadores solo Zod. El comando termina con código 1 en el primer import hacia afuera, y es parte del comando por defecto del contenedor de pruebas, así que un import así hace fallar el build. Pruébalo: agrega `import type { HttpResponse } from "../adapters/note-http-controller";` a `ts/src/use-cases/create-note.ts` y ejecuta las pruebas de nuevo.

```text
FAIL use-cases  6 files, 1 violations
use-cases/create-note.ts:1 imports "../adapters/note-http-controller": "use-cases" is an inner layer and cannot import from "adapters"

dependency rule broken: 1 violation(s)
```

`ts/tests/unit/dependency-rule.test.ts` hace exactamente esto sobre una copia temporal del código fuente, y además le entrega a la verificación nueve tipos de violación, uno por uno.

La verificación es un escáner didáctico construido sobre expresiones regulares, no un parser de TypeScript. Un proyecto real usaría una regla de lint o una herramienta construida sobre el compilador.

## 2. Casos de uso sin base de datos y sin servidor HTTP

```sh
docker compose run --rm ts-test
docker compose down -v
```

El servicio `ts-test` tiene `network_mode: "none"`. Ejecuta la verificación de tipos, la verificación de la regla de dependencia y 50 pruebas unitarias, entre ellas cada regla de cada caso de uso (`ts/tests/unit/use-cases.test.ts`), con un repositorio en memoria, un reloj fijo e ids secuenciales. No se abre ningún socket: incluso las rutas de Elysia se ejercitan mediante `app.handle(request)`, en memoria.

Las 7 pruebas de integración son las únicas que necesitan PostgreSQL:

```sh
docker compose run --rm ts-integration
docker compose down -v
```

Ejecutan el mismo contrato de repositorio (`ts/tests/repository-contract.ts`) que supera el adaptador en memoria, ahora contra el adaptador de PostgreSQL.

## 3. Experimento de intercambio

La aplicación se escribió primero solo con el repositorio en memoria. Luego se conectó el adaptador de PostgreSQL (`ts/src/drivers/postgres-note-repository.ts`, un archivo nuevo que implementa el puerto existente). Este es el diff completo de los archivos que ya existían, obtenido con `diff -ru` entre las dos versiones de `ts/src/`:

```diff
--- a/src/main/composition.ts
+++ b/src/main/composition.ts
@@ -12,6 +12,7 @@
 import { InMemoryNoteRepository } from "../adapters/in-memory-note-repository";
 import { NoteCliController } from "../adapters/note-cli-controller";
 import { NoteHttpController } from "../adapters/note-http-controller";
+import { PostgresNoteRepository } from "../drivers/postgres-note-repository";
 import { SystemClock, UuidIdGenerator } from "../drivers/system";
 import type { NoteUseCases } from "../use-cases";
 import { CreateNote } from "../use-cases/create-note";
@@ -27,8 +28,12 @@
 
 // EN: The swap experiment happens in this function. See "Swap experiment" in the README.
 // PT: O experimento de troca acontece nesta função. Veja "Experimento de troca" no README.
 // ES: El experimento de intercambio ocurre en esta función. Mira "Experimento de intercambio" en el README.
-async function createRepository(_config: Config): Promise<RepositoryHandle> {
+async function createRepository(config: Config): Promise<RepositoryHandle> {
+	if (config.NOTES_REPOSITORY === "postgres") {
+		const repository = await PostgresNoteRepository.connect(config.DATABASE_URL);
+		return { repository, close: () => repository.close() };
+	}
 	return { repository: new InMemoryNoteRepository(), close: async () => {} };
 }
 
--- a/src/main/config.ts
+++ b/src/main/config.ts
@@ -6,6 +6,8 @@
 //     viajam para dentro como valores simples e tipados. Nenhum caso de uso lê `process.env`.
 const envSchema = z.object({
 	PORT: z.coerce.number().int().min(1).max(65535).default(3000),
+	NOTES_REPOSITORY: z.enum(["memory", "postgres"]).default("memory"),
+	DATABASE_URL: z.url().default("postgres://lab:lab-fake-password@db:5432/lab"),
 });
 
 export type Config = z.infer<typeof envSchema>;
@@ -13,5 +15,7 @@
 export function loadConfig(env: Record<string, string | undefined> = process.env): Config {
 	return envSchema.parse({
 		PORT: env.PORT,
+		NOTES_REPOSITORY: env.NOTES_REPOSITORY,
+		DATABASE_URL: env.DATABASE_URL,
 	});
 }
```

Nueve líneas agregadas y una modificada, todas en `ts/src/main/`. Nada en `entities/`, `use-cases/` ni `adapters/` se tocó, y las 10 pruebas de casos de uso pasaron antes y después sin editar nada. `ts/tests/unit/swap.test.ts` lo mantiene así: falla si algún archivo distinto de `main/composition.ts` nombra `InMemoryNoteRepository` o `PostgresNoteRepository`.

Lo que el experimento no muestra: una migración de datos existentes, y las diferencias que un puerto no puede ocultar, como las transacciones que abarcan varias llamadas o dos peticiones compitiendo por el mismo título. Aislar la base de datos hace barato el intercambio en código. No lo hace gratuito.

## Demostración

```sh
docker compose run --rm demo
docker compose down -v
```

Un solo comando: inicia PostgreSQL y la API HTTP, luego crea una nota en la terminal, la lee por HTTP, crea otra por HTTP, lista ambas en la terminal y muestra la misma regla respondida en dos vocabularios:

```text
== 4. One rule, two vocabularies: a repeated title is 409 over HTTP and exit code 1 in the terminal
$ POST /notes {"title":"Written over HTTP"}
409 {"error":"duplicate-title","message":"a note titled \"Written over HTTP\" already exists"}
$ NOTES_REPOSITORY=postgres cli "add" "Written over HTTP"
error (duplicate-title): a note titled "Written over HTTP" already exists
(exit code 1)
```

La demostración solo llama al servicio `api` de este archivo compose y rechaza cualquier otro host.

## Usarlo a mano

```sh
docker compose run --rm ts-integration bun run cli add "Buy milk" "two litres"
docker compose run --rm ts-integration bun run cli list
docker compose run --rm ts-test bun run cli list     # memory: a new, empty repository per process
docker compose down -v
```

| Ruta HTTP | Comando de terminal | Caso de uso |
| --- | --- | --- |
| `POST /notes` con `{ "title", "body" }` | `add <title> [body]` | `CreateNote` |
| `GET /notes` | `list` | `ListNotes` |
| `PUT /notes/:id` con `{ "title"?, "body"? }` | `edit <id> <title> [body]` | `UpdateNote` |
| `DELETE /notes/:id` | `remove <id>` | `RemoveNote` |

## Decisiones y límites

- El cuerpo de la petición se valida con Zod en el controller, no con el esquema propio de Elysia, de modo que la validación pertenece al adaptador y sobrevive a un cambio de framework.
- El repositorio en memoria está en `adapters/` y el de PostgreSQL en `drivers/`, porque el segundo habla directamente con un driver de base de datos. Un adaptador que importe `pg` es reportado por la verificación.
- `Result` vive en `entities/` porque todas las capas pueden importar la más interna.
- Las credenciales en `docker-compose.yml` son falsas y solo se alcanzan dentro de la red interna.
