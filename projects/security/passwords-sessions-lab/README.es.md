# passwords-sessions-lab

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)
>
> **Laboratorio de seguridad, vulnerable a propósito.** El código de `ts/src/vulnerable/` existe solo para hacer observables fallas dentro de este laboratorio. Nunca lo copies, lo importes ni lo despliegues.

Cómo deben almacenarse las contraseñas y cómo debe protegerse un inicio de sesión. El laboratorio tiene dos partes. La primera guarda la misma contraseña falsa con cuatro esquemas (texto plano, MD5, SHA-256 con sal y Argon2id), muestra lo que cada uno escribe en la tabla y mide cuántos hashes por segundo calcula cada uno. La segunda es una pequeña API de inicio de sesión en dos versiones: la vulnerable no tiene límite de intentos, mantiene el mismo id de sesión a través del inicio de sesión (fijación de sesión), envía una cookie sin ningún atributo de protección y distingue a un usuario desconocido de una contraseña incorrecta; la corregida cierra cada una de esas fallas.

Código: MP-SEC-6. Explicación completa: [docs/es/security/passwords-sessions-lab.md](../../../docs/es/security/passwords-sessions-lab.md).

## Temas del quiz que demuestra

- `security` / `authentication`: almacenamiento de contraseñas (sal, hash rápido frente a función lenta que exige memoria, parámetros de Argon2id, actualización de hashes antiguos en el inicio de sesión), límite de intentos y bloqueo, mensajes de error genéricos
- `security` / `sessions-cookies`: sesiones en el servidor, fijación de sesión y rotación del id, cierre de sesión y tiempos de expiración, los atributos `HttpOnly`, `Secure` y `SameSite` y el prefijo `__Host-`

## Ejecución

El único requisito es Docker.

```sh
./setup-unix-passwords-sessions-lab.sh        # Linux y macOS
./setup-windows-passwords-sessions-lab.ps1    # Windows
```

El script construye la imagen, ejecuta la verificación de tipos y las pruebas en una red interna, y elimina todo al final.

## Demo

```sh
docker compose run --rm demo
docker compose down -v --remove-orphans
```

La parte 1 imprime lo que cada esquema guarda para `alice-fake` y `bob-fake`, que eligieron la misma contraseña falsa: filas idénticas para texto plano y MD5, filas distintas para SHA-256 con sal y Argon2id. La parte 2 imprime los mismos siete pasos de inicio de sesión dos veces. En la API vulnerable la cookie solo tiene `Path`, el id de sesión de antes del inicio de sesión responde como `alice-fake` después y sigue funcionando tras el cierre de sesión, los dos mensajes de error difieren, y la sexta contraseña incorrecta se evalúa igual que la primera. En la API corregida las mismas solicitudes reciben una cookie `__Host-` con todos los atributos, un id nuevo al iniciar sesión, `401` para el antiguo, un error genérico y `429` tras cinco fallos, mientras que un inicio de sesión normal sigue respondiendo `200`.

## Benchmark

```sh
docker compose run --rm bench
docker compose down -v --remove-orphans
```

En Linux, inícialo como tu propio usuario, porque el contenedor escribe en `results/`: `HOST_UID=$(id -u) HOST_GID=$(id -g) docker compose run --rm bench`. Sin las variables corre como uid 1000.

Imprime la tabla y escribe [`results/results.md`](results/results.md) y `results/results.json`, con la máquina, la versión del runtime, los parámetros de Argon2 y el comando. Cada esquema corre una ronda de calentamiento (descartada) y cinco rondas medidas en un hilo; la tabla informa la mediana, la ronda más lenta y la más rápida. Tarda unos segundos y no forma parte de las pruebas.

Ronda versionada (AMD Ryzen 7 5700X3D, Bun 1.4.2 en Docker, un hilo):

| Esquema | Hashes/s (mediana) | Mín a máx | Tiempo por hash | Costo de un hash frente a MD5 |
| --- | --- | --- | --- | --- |
| texto plano | no es un hash | | cerca de 0 | ninguno |
| MD5, sin sal | 843.636 | 797.901 a 890.710 | 1,19 µs | 1x |
| SHA-256, sal de 16 bytes | 548.724 | 500.384 a 624.058 | 1,82 µs | 1,5x |
| Argon2id, 19 MiB, t=2, p=1 (la política del laboratorio) | 22 | 19,5 a 23,1 | 45 ms | unas 38.000x |
| Argon2id, 64 MiB, t=3, p=1 | 3,5 | 3,2 a 3,8 | 285 ms | unas 241.000x |

Qué significan los números para la defensa:

- **Lee la tasa desde el lado de quien robó la tabla.** El número de hashes por segundo que calcula un servidor es también el número de intentos por segundo que un núcleo de CPU puede probar contra una tabla filtrada. El hardware construido para esa tarea es muchos órdenes de magnitud más rápido que este único núcleo para MD5 y SHA-256.
- **Un hash rápido deja cada intento casi gratis.** MD5 y SHA-256 se diseñaron para resumir archivos grandes con rapidez. Eso es una cualidad para sumas de verificación y la propiedad equivocada para contraseñas, que son cortas y a menudo predecibles.
- **Una función lenta que exige memoria hace que cada intento sea caro.** Un hash Argon2id aquí cuesta unos 45 ms y 19 MiB. Un usuario lo paga una vez por inicio de sesión y no lo nota. Quien prueba intentos lo paga por cada intento, y el requisito de memoria es lo que impide que el hardware paralelo barato obtenga la aceleración habitual.
- **La sal hace otro trabajo.** No vuelve nada más lento: SHA-256 con sal es tan rápido como MD5. Hace que contraseñas iguales produzcan hashes distintos e inutiliza las tablas calculadas de antemano, así que cada fila robada debe trabajarse por separado.
- **El costo es una perilla.** Las dos filas de Argon2id difieren solo en los parámetros. Súbelos a medida que mejora el hardware; `needsRehash` entonces actualiza los hashes guardados a medida que los usuarios inician sesión.

Esto es una medición de las funciones de hash. Calcula el hash de una contraseña falsa de forma repetida; nunca compara contra un hash guardado y no prueba ninguna contraseña candidata.

## Pruebas

```sh
docker compose run --rm ts-test
docker compose down -v --remove-orphans
```

El contenedor ejecuta `tsc --noEmit` y luego `bun test`.

| Archivo | Qué demuestra |
| --- | --- |
| `ts/tests/password-storage.test.ts` | MP-SEC-6.1. Dos usuarios falsos con la misma contraseña: mismo texto plano, mismo MD5, SHA-256 con sal distinto, Argon2id distinto. La verificación acepta la contraseña correcta y rechaza una incorrecta en todos los esquemas. `needsRehash` es verdadero para los esquemas heredados y para Argon2id por debajo de la política. `verifyAndUpgrade` convierte un hash MD5 en Argon2id tras una comprobación exitosa y no cambia nada tras una fallida |
| `ts/tests/login.test.ts` | MP-SEC-6.2. Las mismas funciones de escenario corren contra ambas versiones: flags de la cookie, rotación de sesión al iniciar sesión, cierre de sesión, mensajes de error, bloqueo y el límite por cliente. Vulnerable: cada falla es observable. Corregida: cada intento es bloqueado y el inicio de sesión normal funciona. Además: el bloqueo expira, sigue a la cuenta entre clientes y no revela qué nombres existen; expiraciones por inactividad y absolutas; validación Zod; la fila MD5 de `carol-legacy-fake` se convierte en Argon2id al iniciar sesión |
| `ts/tests/limiter.test.ts` | El limitador de intentos por separado, con un reloj inyectado: bloqueo, cuenta regresiva, ventana, reinicio y memoria acotada. Ninguna prueba duerme |
| `ts/tests/bench.test.ts` | La aritmética del benchmark (mediana, calentamiento descartado) con un sujeto inventado |
| `ts/tests/network.test.ts` | El contenedor no puede alcanzar el exterior: una solicitud a `http://example.com` falla |

## Estructura

| Ruta | Qué es |
| --- | --- |
| `ts/src/data.ts` | Cuentas falsas, la lista fija de seis contraseñas incorrectas y el tipo del reloj |
| `ts/src/vulnerable/vulnerable-password-storage.ts` | Texto plano, MD5 sin sal y SHA-256 con sal. Vulnerable a propósito |
| `ts/src/vulnerable/vulnerable-app.ts` | La API de inicio de sesión de ElysiaJS con las cinco fallas, cada una marcada `FLAW`. Vulnerable a propósito |
| `ts/src/fixed/fixed-password-storage.ts` | Argon2id mediante `Bun.password`, `needsRehash`, comparación en tiempo constante y actualización al iniciar sesión |
| `ts/src/fixed/fixed-attempt-limiter.ts` | Contador de fallos con un bloqueo temporal y un reloj inyectable |
| `ts/src/fixed/fixed-sessions.ts` | Almacén de sesiones en el servidor con ids aleatorios y tiempos de expiración por inactividad y absolutos |
| `ts/src/fixed/fixed-app.ts` | La misma API de inicio de sesión con todas las fallas cerradas y el cuerpo validado con Zod |
| `ts/src/scenario.ts` | Los intentos, escritos una vez y ejecutados contra ambas versiones |
| `ts/src/demo.ts` | El recorrido que imprime el servicio `demo` |
| `ts/src/bench.ts` | El benchmark que ejecuta el servicio `bench` |
| `ts/src/http.ts` | Lectura de las cabeceras `Cookie` y `Set-Cookie` |
| `results/` | Los resultados versionados del benchmark |

## Por qué ocurre la falla

**Almacenamiento.** Una tabla de contraseñas se trata como cualquier otra columna, o se protege con la primera función de hash que viene a la mente.

- Texto plano: quien lee la tabla (un respaldo filtrado, una inyección SQL, alguien de dentro) lee todas las contraseñas, y la gente reutiliza contraseñas en otros sitios.
- MD5 sin sal: contraseñas iguales dan hashes iguales, así que la tabla muestra quién comparte una contraseña y se aplican las tablas precalculadas. Y MD5 es rápido.
- SHA-256 con sal: la sal arregla el primer problema y deja el segundo. "Es un hash fuerte" es cierto para archivos e irrelevante aquí: la velocidad es el problema.

**Inicio de sesión.** Cada falla es algo que el código no hace, así que nada falla para un usuario honesto.

```ts
// vulnerable: el navegador ya tenía un id de sesión, así que el servidor lo mantiene
current.session.username = username;
```

- **Sin límite de intentos.** La milésima contraseña incorrecta se evalúa igual que la primera.
- **Fijación de sesión.** El sitio entrega un id de sesión a cada visitante, y el inicio de sesión marca ese mismo id como con sesión iniciada. Quien conocía el id antes del inicio de sesión (lo plantó en el navegador de la víctima, o lo leyó en un computador compartido) queda dentro de la cuenta después sin conocer la contraseña.
- **Cierre de sesión solo en el navegador.** La cookie se borra y la sesión sigue siendo válida en el servidor, sin expiración.
- **Cookie desnuda.** Sin `HttpOnly`, un script de la página la lee. Sin `Secure`, viaja por HTTP plano. Sin `SameSite`, otros sitios pueden hacer que el navegador la envíe.
- **Dos mensajes de error.** `unknown_user` frente a `wrong_password` le dice a cualquiera qué nombres de usuario están registrados.

## Cómo prevenirla

- **Guarda las contraseñas con Argon2id**, con una sal aleatoria por contraseña (la función la genera) y parámetros tan altos como el inicio de sesión pueda permitirse. El laboratorio usa el mínimo de OWASP: 19 MiB, 2 pasadas, 1 hilo.
- **Mantén el esquema y los parámetros dentro del valor guardado** y actualiza al iniciar sesión: el único momento en que el servidor tiene la contraseña real es un inicio de sesión exitoso, así que ahí es cuando se reemplaza un hash antiguo (`verifyAndUpgrade`, `needsRehash`).
- **Limita los intentos dos veces.** Por cuenta (5 fallos en 15 minutos la bloquean durante 15 minutos) y por cliente (10 fallos en 15 minutos). Cuenta por el nombre que se escribió, exista o no, para que el propio bloqueo no revele qué cuentas son reales. Identifica al cliente por la dirección de la conexión o por una cabecera escrita por tu propio proxy.
- **Rota el id de sesión en cada inicio de sesión**: destruye el id con el que llegó el navegador y emite uno nuevo aleatorio (32 bytes de `node:crypto`). **Destruye la sesión en el servidor al cerrar sesión**, y hazla expirar por inactividad (15 minutos) y por antigüedad (8 horas).
- **Define todos los atributos de la cookie**: `__Host-sid=...; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=28800`, sin `Domain`. El prefijo `__Host-` hace que el navegador rechace la cookie a menos que sea `Secure`, tenga `Path=/` y no tenga `Domain`, así que otro subdominio no puede sobrescribirla.
- **Una respuesta genérica** para un usuario desconocido y una contraseña incorrecta, con el mismo estado y cuerpo, y aproximadamente el mismo tiempo: un usuario desconocido se verifica contra un hash Argon2id falso.
- **Compara en tiempo constante** (`timingSafeEqual`, y `Bun.password.verify` para Argon2id).
- **Valida el cuerpo con Zod**: un objeto estricto, un patrón para el nombre de usuario y una longitud máxima de contraseña, para que nadie haga que el servidor calcule el hash de megabytes.

El bloqueo tiene un costo: cualquiera puede bloquear la cuenta de otra persona durante 15 minutos escribiendo contraseñas incorrectas. Por eso es temporal, y por eso los sistemas reales añaden un segundo factor, retrasos progresivos o un desafío antes del bloqueo.

## Qué no funciona como corrección

- **Un hash general más rápido o "más fuerte"** (SHA-512, SHA-3), o aplicar el hash dos veces. Todos son rápidos; el problema es el costo por intento.
- **Una sal para toda la tabla**, o una sal derivada del nombre de usuario. Las contraseñas iguales vuelven a generar hashes iguales, y una tabla precalculada sirve para todas las filas.
- **Un "pepper" secreto o cifrado en lugar de un hash lento.** Un pepper es una capa extra razonable sobre Argon2id, y solo ayuda mientras su clave quede fuera de la filtración. El cifrado es reversible: quien obtiene la clave obtiene todas las contraseñas.
- **Solo reglas de composición de contraseñas.** Cambian qué contraseñas elige la gente y no hacen nada contra un hash rápido o un inicio de sesión sin límite.
- **Un límite solo por dirección IP**, o solo por cuenta. El primero pasa por alto muchas direcciones probando una cuenta, el segundo pasa por alto una dirección probando muchas cuentas. Un límite guardado en el navegador (una cookie, un campo oculto, JavaScript) no es un límite: quien llama lo controla.
- **Un bloqueo permanente.** Convierte la protección en una manera de deshabilitar las cuentas de otras personas.
- **Borrar la cookie al cerrar sesión**, o mantener el id y solo "marcarlo como con sesión iniciada". El servidor debe olvidar el id antiguo.
- **`HttpOnly` como cura del XSS.** Impide que un script copie la cookie, y un script de la página aún puede enviar solicitudes como el usuario. Cada atributo cierra una puerta.
- **Un mensaje vago con un estado, cuerpo o tiempo distintos.** Si las dos respuestas pueden distinguirse de alguna manera, los nombres siguen siendo enumerables. Las páginas de registro y de restablecimiento de contraseña necesitan el mismo cuidado.

## Alcance de seguridad del laboratorio

- Todo se ejecuta de forma local en Docker, en una red de compose con `internal: true`. No se publica ningún puerto y una prueba demuestra que el contenedor no puede alcanzar el exterior.
- Ambas APIs corren en memoria, dentro del proceso de pruebas. Ninguna solicitud sale del contenedor, y nada aquí apunta a ningún otro sistema.
- Todos los datos son falsos: `alice-fake`, `bob-fake`, `carol-legacy-fake`, contraseñas como `lab-fake-password-alice`.
- No hay ninguna herramienta de descifrado. El benchmark calcula el hash de una contraseña falsa y no compara nada. El escenario del límite de intentos envía una lista fija de seis valores obviamente incorrectos (`wrong-fake-1` a `wrong-fake-6`) solo para contar intentos.

## Versiones

| Componente | Versión |
| --- | --- |
| Bun | `oven/bun:1.4.2` |
| ElysiaJS | 1.4.30 |
| Zod | 4.6.5 |
| TypeScript | 7.0.2 |
| @types/bun | 1.4.2 |
