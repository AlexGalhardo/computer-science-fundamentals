# Aplicación con arquitectura limpia (MP-ARCH-1)

> English version: [docs/en/software-architecture/clean-architecture-app.md](../../en/software-architecture/clean-architecture-app.md) · Versão em português: [docs/pt/software-architecture/clean-architecture-app.md](../../pt/software-architecture/clean-architecture-app.md)

Mini-proyecto: [`projects/software-architecture/clean-architecture-app`](../../../projects/software-architecture/clean-architecture-app/README.es.md). Temas del quiz: `clean-architecture-dependency-rule`, `entities-use-cases`, `interface-adapters`, `frameworks-drivers-composition-root`, `layered-hexagonal`, `domain-driven-design`.

## El problema

En una aplicación pequeña típica la regla de negocio termina dentro del handler de la ruta, junto al SQL:

```text
handler de la ruta:  leer el cuerpo JSON -> verificar el título -> SELECT ... -> INSERT ... -> armar la respuesta JSON
```

Funciona, y tres cosas se vuelven caras. Probar la regla "no hay dos notas con el mismo título" exige un servidor web y una base de datos en ejecución. Ofrecer la misma funcionalidad en una terminal significa copiar la regla. Actualizar el framework o cambiar la base de datos significa leer todos los handlers, porque la regla y el detalle están en las mismas líneas.

## La idea: los imports apuntan hacia adentro

La Arquitectura Limpia, tal como la describe Robert Martin y la desarrolla en TypeScript Otávio Lemos, organiza el código en capas concéntricas y enuncia una regla sobre ellas, la **regla de dependencia**: un archivo solo puede importar de su propia capa o de una capa más interna.

```text
            main (raíz de composición)         lo conoce todo, nada lo importa
   +--------------------------------------+
   |  drivers: Elysia, pg, reloj,          |
   |  terminal                             |
   |  +--------------------------------+  |
   |  | adapters: controllers,         |  |
   |  | presenter, repositorio en      |  |
   |  | memoria                        |  |
   |  |  +--------------------------+  |  |
   |  |  | casos de uso + puertos   |  |  |
   |  |  |   +------------------+   |  |  |
   |  |  |   |    entidades     |   |  |  |
   |  |  |   +------------------+   |  |  |
   |  |  +--------------------------+  |  |
   |  +--------------------------------+  |
   +--------------------------------------+
        toda flecha de import apunta al centro
```

| Capa | Guarda | Cambia cuando |
| --- | --- | --- |
| Entidades | Lo que vale para una nota en cualquier aplicación: título válido, cuerpo limitado, fechas coherentes | El propio negocio cambia |
| Casos de uso | Lo que esta aplicación hace con las notas, paso a paso, y los puertos que necesita | Cambia una funcionalidad de la aplicación |
| Adaptadores de interfaz | La traducción entre el formato de afuera y el formato de los casos de uso: controllers, presenters, repositorios simples | Cambia el formato de una petición o de una pantalla |
| Frameworks y drivers | El framework web, el driver de la base de datos, el reloj, la terminal | Se actualiza o se reemplaza una herramienta |
| Main | La configuración y la raíz de composición | Se elige otro detalle |

Las capas más internas son las que menos cambian y de las que depende todo lo demás. Las cosas volátiles, frameworks y bases de datos, quedan en el borde, donde nada depende de ellas.

## Las llamadas van y vuelven, los imports no

La regla habla de código fuente, no de tiempo de ejecución. Cuando una nota se crea por HTTP, el control entra y vuelve a salir:

```text
ruta de Elysia -> NoteHttpController -> CreateNote -> NoteRepository.save() -> PostgresNoteRepository -> pg
   (driver)          (adaptador)       (caso de uso)       (puerto)                  (driver)
```

El caso de uso llama a la base de datos, y aun así `create-note.ts` no importa `postgres-note-repository.ts`. Importa `ports.ts`, una interfaz declarada en su propia capa, y `PostgresNoteRepository` implementa esa interfaz desde afuera. Esto es la **inversión de dependencias**: en la frontera, la flecha del import corre contra la dirección de la llamada. La **inyección de dependencias** es solo el mecanismo que entrega la implementación, aquí un parámetro del constructor. No se usa ningún contenedor.

## Entidades y casos de uso

`Title` es un objeto de valor y `Note` es una entidad. Ambos tienen constructor privado y una fábrica `create` que devuelve un `Result`, así que no se puede construir una nota inválida, y quien recibe una `Note` no necesita validarla de nuevo. Las fallas esperadas son valores de retorno (`invalid-title`, `duplicate-title`, `note-not-found`). Las excepciones quedan para lo que nadie esperaba.

Dos reglas parecidas viven en capas diferentes:

- "Un título no está vacío y tiene como máximo 80 caracteres" vale para cualquier nota: entidad.
- "No hay dos notas con el mismo título" es una elección de esta aplicación y necesita mirar las otras notas: caso de uso, por medio del repositorio.

Dónde queda una regla es una decisión de diseño. La prueba es preguntar si la regla valdría en otra aplicación construida sobre el mismo concepto.

Un caso de uso devuelve un DTO `NoteData`, no la entidad, y no conoce códigos de estado, códigos de salida ni `console`. El reloj y el generador de ids también son puertos, y eso es lo que permite a una prueba comparar un resultado completo con un valor esperado exacto.

## Adaptadores, drivers y la raíz de composición

`NoteHttpController` declara sus propios tipos `HttpRequest` y `HttpResponse`, así que nunca importa Elysia. Verifica el formato de la entrada con Zod, llama a un caso de uso y mapea el resultado: `duplicate-title` se vuelve 409 aquí, y código de salida 1 en `NoteCliController`. Los dos controllers son la prueba de que los casos de uso son independientes del mecanismo de entrega: el segundo se agregó sin tocar `use-cases/`.

En términos hexagonales, los controllers son adaptadores conductores (llaman a la aplicación) y los repositorios son adaptadores conducidos (la aplicación los llama por un puerto). Un puerto tiene dos adaptadores, un `Map` y PostgreSQL, y un único archivo de prueba de contrato corre contra los dos.

Siguiendo a Lemos, un adaptador que habla directamente con una biblioteca externa pertenece a la capa más externa. Por eso el repositorio PostgreSQL está en `drivers/`, y por eso la verificación automática solo deja que `adapters/` importe Zod.

`main/composition.ts` es el único archivo que nombra un repositorio concreto. Arma el grafo de objetos una vez y lo entrega a los puntos de entrada. Las variables de entorno se leen y validan en `main/config.ts` y viajan hacia adentro como valores simples.

## Tres afirmaciones, tres verificaciones

| Afirmación | Cómo se verifica |
| --- | --- |
| Ninguna capa interna importa una externa | `bun run check:layers`, parte del comando por defecto del contenedor de pruebas. `tests/unit/dependency-rule.test.ts` agrega un `import type` prohibido a una copia del código y espera código de salida 1 |
| Los casos de uso se prueban sin base de datos y sin servidor HTTP | El contenedor `ts-test` tiene `network_mode: "none"` y corre todas las pruebas de los casos de uso |
| Cambiar el repositorio modifica solo la raíz de composición | El diff en el README toca solo `src/main/`. `tests/unit/swap.test.ts` falla si otro archivo cita un repositorio concreto |

La verificación de imports cuenta también `import type`. Un import solo de tipo desaparece en tiempo de ejecución, pero el archivo interno ya no puede compilarse ni entenderse sin el externo, y esa es la dependencia que la regla prohíbe.

## Qué cuesta, y cuándo no usarlo

- Más archivos y más indirección. Una funcionalidad toca una entidad, un caso de uso, un controller y quizá un repositorio. Para un programa de unos pocos cientos de líneas eso es costo sin retorno.
- Las interfaces compensan en las fronteras entre capas. Una interfaz para cada clase dentro de una capa es exceso de ingeniería.
- El puerto oculta la tecnología de almacenamiento, no su semántica. Un `Map` y PostgreSQL difieren en durabilidad, en transacciones y en lo que ocurre cuando dos peticiones verifican el mismo título al mismo tiempo. Aquí la restricción `UNIQUE` es la última línea de defensa para esa carrera.
- Cambiar de base de datos sigue exigiendo migrar los datos. La arquitectura reduce el código que cambia, no el trabajo operativo.
- La verificación de dependencias de este proyecto es un lector didáctico basado en expresiones regulares. En código de producción usa una regla de lint o una herramienta basada en el compilador.

## Pruébalo

1. Agrega `import type { HttpResponse } from "../adapters/note-http-controller";` a un caso de uso y ejecuta `docker compose run --rm ts-test`.
2. Agrega un comando `count` solo en la terminal. ¿Qué capas editaste?
3. Escribe un tercer repositorio que guarde las notas en un archivo JSON, haz que pase `describeNoteRepositoryContract`, y conéctalo. Compara tu diff con el del README.
4. Mueve la regla del título duplicado a la entidad. ¿Qué pasa a necesitar la entidad que antes no necesitaba?

## Fuentes

- Otávio Lemos, *Arquitetura Limpa na Prática*: capítulos 3 (las capas y la regla de dependencia), 6 (entidades), 7 (casos de uso), 8 (adaptadores de interfaz), 9 (frameworks y drivers) y 10 (principal y configuración). Resumen en `references/summaries/books/arquitetura-limpa-na-pratica-otavio-lemos.md`.
- Sommerville, *Engenharia de Software*, 9.ª edición, capítulo 6 (diseño de arquitectura, el patrón en capas).
