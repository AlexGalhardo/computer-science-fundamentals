# Laboratorio de inyección SQL (MP-SEC-1)

> English version: [docs/en/security/sql-injection-lab.md](../../en/security/sql-injection-lab.md) · Versão em português: [docs/pt/security/sql-injection-lab.md](../../pt/security/sql-injection-lab.md)

Miniproyecto: [`projects/security/sql-injection-lab`](../../../projects/security/sql-injection-lab/README.es.md). Temas del quiz: `injection`, `owasp-threat-modelling`.

Este laboratorio es defensivo y educativo. Se ejecuta solo de forma local, en Docker, en una red interna sin puertos publicados, y todos los datos son falsos. El código vulnerable existe para compararse con la corrección, nunca para reutilizarse.

## El concepto

Una inyección ocurre siempre que un programa arma un comando para otro intérprete (SQL, un shell, HTML) mezclando su propio texto con texto que vino de fuera. El intérprete recibe una única cadena e interpreta todo. Si el texto de fuera contiene los caracteres que tienen significado en ese lenguaje, **el dato se convierte en código**.

La inyección SQL es el caso más conocido, y la inyección como categoría está en el OWASP Top 10 desde la primera edición. La causa es siempre la misma, y la cura también: mantener el código y el dato en canales separados.

## La falla

```ts
`SELECT id, username FROM users WHERE username = '${username}' AND password_hash = '${hash}'`
```

Con el nombre de usuario `' OR '1'='1' --`, la base de datos recibe:

```sql
SELECT id, username FROM users WHERE username = '' OR '1'='1' --' AND password_hash = '...'
```

La comilla cerró el literal, `OR '1'='1'` es verdadero para toda fila, y `--` convirtió la comprobación de la contraseña en comentario. La app toma la primera fila e inicia la sesión de ese usuario.

La búsqueda tiene la misma falla en un patrón `LIKE`. Con un `UNION SELECT` añadido, el resultado de una búsqueda de productos lleva las filas de una tabla que ninguna ruta debería leer. En la versión vulnerable esto alcanza todas las tablas, porque la app además se conecta como dueña de la base de datos.

Las dos entradas están fijadas en `ts/src/scenario.ts` y solo tienen sentido contra el esquema del laboratorio.

## La corrección

| Capa | Qué hace | Qué no hace |
| --- | --- | --- |
| Consultas parametrizadas | El texto SQL es una constante con `$1`, `$2`. Los valores se encajan después de que el texto fue interpretado, así que ellos mismos nunca se interpretan. **Esto elimina la falla** | No parametriza identificadores (nombres de tablas y columnas): mapéalos a una lista fija en el código |
| Validación de entrada (Zod) | Rechaza la entrada fuera del formato esperado, como un nombre de usuario con comillas | No puede prohibir las comillas en texto libre, así que nunca reemplaza los marcadores |
| Rol con mínimo privilegio | La app corregida se conecta como `lab_readonly`: solo `SELECT` en `users` y `products` | No detiene una inyección que se quede dentro de lo que el rol puede leer |

Lo que no funciona: las listas de bloqueo de palabras o caracteres "peligrosos" (rompen entradas legítimas y nunca cubren todas las formas de escribir el mismo SQL), escapar comillas a mano (se olvida en una consulta, inútil para valores sin comillas, dependiente de la base de datos y de la codificación), solo validación, ocultar los mensajes de error, y los procedimientos almacenados que concatenan texto por su cuenta.

Un detalle encontrado al construir el laboratorio: con un esquema Zod en la opción `query` de una ruta, Elysia 1.4 parte el valor de la query en las comas, formando un arreglo, antes de validar. Por eso la ruta de búsqueda corregida valida el término con Zod dentro del handler, y una búsqueda legítima con coma se acepta y llega a la base de datos como un único parámetro.

## Qué demuestran las pruebas

Una función de escenario hace las mismas cinco solicitudes a las dos apps: un inicio de sesión válido, un inicio de sesión con contraseña incorrecta, el inicio de sesión con la tautología, una búsqueda normal y la búsqueda con `UNION`.

| Elemento | Cómo se verifica |
| --- | --- |
| MP-SEC-1.1 red interna, datos falsos, sin acceso externo | `tests/network-isolation.test.ts`: una solicitud a `http://example.com` falla desde dentro del contenedor. `docker-compose.yml` no publica puertos y la única red es `internal: true` |
| MP-SEC-1.2 la versión vulnerable tiene las dos fallas | `tests/scenario.test.ts`, bloque vulnerable: la tautología responde `200` con un usuario con sesión iniciada, y la búsqueda con `UNION` devuelve los tres secretos falsos |
| MP-SEC-1.3 la versión corregida las detiene y el uso normal funciona | `tests/scenario.test.ts`, bloque corregido: la tautología responde `422`, la búsqueda con `UNION` responde `200` con cero filas, un inicio de sesión válido y una búsqueda normal siguen funcionando. Dos pruebas llaman a las consultas parametrizadas directamente, sin validación, y obtienen el mismo resultado seguro. `tests/least-privilege.test.ts`: `lab_readonly` recibe SQLSTATE `42501` al leer `secrets` o al escribir |
| MP-SEC-1.4 documentación | Los tres README tienen "Por qué ocurre la falla", "Cómo prevenirla" y "Qué no funciona como corrección" |

## Cómo ejecutarlo

```sh
cd projects/security/sql-injection-lab
./setup-unix-sql-injection-lab.sh     # verificación de tipos y pruebas, luego la limpieza
docker compose run --rm demo          # paso a paso narrado
docker compose down -v --remove-orphans
```
