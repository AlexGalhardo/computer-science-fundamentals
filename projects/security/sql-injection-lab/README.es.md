# sql-injection-lab

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Un laboratorio defensivo y local sobre inyección SQL. La misma app ElysiaJS pequeña (un inicio de sesión y una búsqueda de productos sobre PostgreSQL) existe dos veces: una versión que arma su SQL concatenando cadenas, etiquetada como `vulnerable`, y una versión corregida con consultas parametrizadas, validación de entrada y un rol de base de datos con mínimo privilegio. Un escenario corre contra ambas y muestra por qué la concatenación de cadenas es explotable y por qué los marcadores son la corrección.

Código: MP-SEC-1. Explicación completa: [docs/es/security/sql-injection-lab.md](../../../docs/es/security/sql-injection-lab.md).

> El código de `ts/src/vulnerable/` es vulnerable a propósito. Existe solo para estudiarse dentro de este laboratorio. Nunca lo copies ni lo importes desde otro proyecto.

## Temas del quiz que demuestra

- `security` / `injection`: SQL concatenado, consultas parametrizadas, por qué fallan las listas de bloqueo y el escape manual
- `security` / `owasp-threat-modelling`: la inyección en el OWASP Top 10, defensa en profundidad, el mínimo privilegio como limitación del daño

## Ejecución

El único requisito es Docker.

```sh
./setup-unix-sql-injection-lab.sh        # Linux y macOS
./setup-windows-sql-injection-lab.ps1    # Windows
```

El script construye la imagen, ejecuta la verificación de tipos y las pruebas contra un contenedor de PostgreSQL en una red interna, y elimina los contenedores y volúmenes al final.

## Demo

```sh
docker compose run --rm demo
docker compose down -v --remove-orphans
```

Imprime un recorrido narrado, en inglés, portugués y español (cada paso tiene una línea `EN:`, una `PT:` y una `ES:`): el texto SQL que la versión vulnerable envía a la base de datos, el escenario contra la app vulnerable (inicio de sesión sin contraseña, los secretos falsos en el resultado de la búsqueda), el mismo escenario contra la app corregida (los dos intentos fallan, el uso normal funciona) y el efecto del rol de solo lectura.

## Pruebas

```sh
docker compose run --rm ts-test
docker compose down -v --remove-orphans
```

| Archivo | Qué demuestra |
| --- | --- |
| `ts/tests/scenario.test.ts` | App vulnerable: la tautología inicia sesión y el `UNION` devuelve la tabla de secretos. App corregida: las mismas dos solicitudes son bloqueadas, y un inicio de sesión válido, una contraseña incorrecta y una búsqueda normal siguen comportándose correctamente. Dos pruebas más llaman a las consultas corregidas directamente, sin la capa de validación, para mostrar que los marcadores por sí solos detienen la inyección |
| `ts/tests/least-privilege.test.ts` | El rol de la app corregida lee `users` y `products`, no puede leer `secrets`, y no puede hacer `INSERT`, `UPDATE`, `DELETE` ni `CREATE TABLE`. Ni siquiera la consulta vulnerable puede filtrar los secretos a través de ese rol |
| `ts/tests/network-isolation.test.ts` | Una solicitud desde dentro del contenedor a un host externo falla |

## Estructura

| Ruta | Qué es |
| --- | --- |
| `db/init.sql` | Esquema, datos falsos y el rol `lab_readonly` |
| `ts/src/vulnerable/vulnerable-queries.ts` | **Vulnerable a propósito**: SQL armado por concatenación de cadenas |
| `ts/src/vulnerable/vulnerable-app.ts` | **Vulnerable a propósito**: rutas de ElysiaJS sin validación, conectadas como dueño de la base de datos |
| `ts/src/fixed/fixed-queries.ts` | Las mismas consultas con marcadores (`$1`, `$2`) |
| `ts/src/fixed/fixed-app.ts` | Las mismas rutas con validación Zod, conectadas con el rol de solo lectura |
| `ts/src/scenario.ts` | El único escenario que corre contra ambas apps, en proceso |
| `ts/src/demo.ts` | La demo narrada |
| `ts/src/config.ts`, `ts/src/db.ts` | Entorno validado, pool de conexiones, tipos compartidos |

Rutas de ambas apps: `POST /login` con `{ "username", "password" }`, y `GET /products?q=<term>`.

## Por qué ocurre la falla

El código vulnerable arma la consulta así:

```ts
`SELECT id, username FROM users WHERE username = '${username}' AND password_hash = '${hash}'`
```

La base de datos recibe una cadena. No tiene cómo saber qué caracteres escribió el programador y cuáles escribió el usuario, así que lo interpreta todo como SQL. **Los datos se están interpretando como código.** Una comilla escrita por el usuario termina el literal de texto que abrió el programador, y lo que siga se lee como SQL.

El laboratorio usa dos entradas de demostración, fijadas en `ts/src/scenario.ts`:

| Dónde | Entrada | Qué termina ejecutando la base de datos |
| --- | --- | --- |
| Nombre de usuario del inicio de sesión | `' OR '1'='1' --` | `... WHERE username = '' OR '1'='1' --' AND password_hash = '...'`. La condición es verdadera para toda fila y la comprobación de la contraseña se volvió un comentario, así que el primer usuario inicia sesión sin contraseña |
| Término de búsqueda | `%' UNION SELECT id, label, secret_value FROM secrets --` | La consulta de productos, seguida de una segunda consulta cuyas filas se añaden al resultado. La respuesta de una búsqueda de productos ahora contiene la tabla `secrets` |

Otros dos errores lo empeoran. La app acepta cualquier entrada sin comprobarla. Y se conecta a PostgreSQL como dueña de la base de datos, así que una consulta inyectada puede leer todas las tablas.

## Cómo prevenirla

1. **Consultas parametrizadas. Esta es la corrección.** El texto SQL es una constante con marcadores, y los valores se envían por separado:

   ```ts
   pool.query("SELECT id, username FROM users WHERE username = $1 AND password_hash = $2", [username, hash]);
   ```

   PostgreSQL analiza primero el texto SQL y solo después enlaza los valores. Un valor nunca se analiza, así que no puede volverse SQL, sean cuales sean los caracteres que contenga. La tautología ahora es simplemente un nombre de usuario que no existe. Los ORM y los constructores de consultas hacen lo mismo por ti, siempre que no recurras a la interpolación de cadenas cruda dentro de ellos.
2. **Valida la entrada (lista de permitidos).** La app corregida describe con Zod cómo es un nombre de usuario (`^[a-z0-9-]{3,32}$`) y limita el tamaño del término de búsqueda. Esto rechaza las tonterías pronto y es buena higiene, pero es una segunda capa: los campos de texto libre como la búsqueda deben aceptar comillas, y siguen siendo seguros solo gracias a los marcadores.
3. **Mínimo privilegio.** La app corregida se conecta como `lab_readonly`, que tiene `SELECT` sobre `users` y `products` y nada más. Si alguna vez se cuela una consulta concatenada en el código, no puede leer `secrets` ni puede escribir. Esto no elimina una inyección, limita lo que una puede alcanzar.
4. **Los identificadores no pueden ser parámetros.** El nombre de una tabla o columna (por ejemplo una opción de "ordenar por") no puede enviarse como `$1`. Mapea la elección del usuario a una lista fija de nombres escritos en el código, y nunca pongas la propia entrada en el texto SQL.

## Qué no funciona como corrección

- **Listas de bloqueo.** Quitar o rechazar piezas "peligrosas" como `'`, `--`, `OR` o `UNION` falla en ambos sentidos. Rompe entradas legítimas (un cliente llamado O'Brien, un producto llamado "Union Jack flag"), y es incompleta por naturaleza: SQL tiene muchas formas de escribir lo mismo, y la lista solo conoce las que pensó su autor. El filtro deja el problema real en su lugar, que es que los datos se analizan como código.
- **Escapar a mano.** Duplicar comillas con un `replace` es el trabajo del driver de la base de datos hecho mal. Es fácil olvidarlo en una de cincuenta consultas, no hace nada por los valores puestos fuera de comillas (un `id` numérico no necesita comilla para ser inyectado), y las reglas correctas dependen de la base de datos, su configuración y la codificación de caracteres.
- **Solo validación.** Útil, pero un campo de texto libre no puede prohibir las comillas, y basta un campo que alguien olvidó validar.
- **Ocultar los mensajes de error.** No mostrar los errores de la base de datos al usuario es correcto, pero la consulta sigue siendo inyectable sin ellos.
- **Procedimientos almacenados que concatenan.** Un procedimiento que arma texto SQL a partir de sus argumentos y lo ejecuta tiene la misma falla, solo que en otro lugar.
- **Solo el mínimo privilegio.** En este laboratorio el rol de solo lectura impide que el `UNION` lea `secrets`, pero el desvío del inicio de sesión seguiría funcionando, porque leer `users` es algo que la app necesita legítimamente.

## Alcance de seguridad del laboratorio

- Todo se ejecuta de forma local en Docker. La red de compose es `internal: true`, así que ningún contenedor alcanza internet, y una prueba lo demuestra.
- **No se publica ningún puerto en el host.** El plan permitía enlazar la app a `127.0.0.1`. Esta área va más lejos: las apps ni siquiera se inician como servidores. Las pruebas y la demo las llaman en proceso, así que el escenario no puede apuntarse a una URL.
- Todos los datos son falsos: usuarios como `alice-fake`, contraseñas como `lab-fake-password` y "secretos" como `FAKE-CARD-0000-0000-0000-0001`.
- Las dos entradas de demostración solo tienen sentido contra el esquema de este laboratorio. Aquí no hay escáner, ni lista de payloads, ni técnica de evasión.
- El paquete es `private` y los archivos vulnerables están etiquetados como tales en sus nombres y en sus primeras líneas.

## Versiones

| Componente | Versión |
| --- | --- |
| PostgreSQL | `postgres:18.6-alpine` |
| Bun | `oven/bun:1.4.2` |
| ElysiaJS | 1.4.30 |
| pg (node-postgres) | 8.23.1 |
| Zod | 4.6.5 |
| TypeScript | 7.0.2 |
