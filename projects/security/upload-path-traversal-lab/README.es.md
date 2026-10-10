# upload-path-traversal-lab

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)
>
> **Laboratorio de seguridad, vulnerable a propósito.** El código de `ts/src/vulnerable/` existe solo para hacer observables fallas dentro de este laboratorio. Nunca lo copies, lo importes ni lo despliegues.

Una API de archivos pequeña con dos rutas, carga y descarga, cree todo lo que el cliente dice sobre un archivo: su nombre, su tipo y su tamaño. El nombre se une a la carpeta de cargas, así que un nombre que contiene `../` lee y escribe fuera de ella (path traversal) y un nombre repetido reemplaza el archivo de otro usuario. El `Content-Type` declarado se guarda y se sirve de vuelta, y nada limita el tamaño. Este laboratorio reproduce esas fallas y las corrige con una idea: **el servidor decide**. Genera el nombre en el disco, encuentra los archivos por id en un índice, comprueba la ruta canónica, detecta el tipo a partir de los bytes, cuenta el tamaño mientras lee y define las cabeceras que le dicen al navegador qué hacer con el archivo.

Código: MP-SEC-8. Explicación completa: [docs/es/security/upload-path-traversal-lab.md](../../../docs/es/security/upload-path-traversal-lab.md).

## Temas del quiz que demuestra

- `security` / `ssrf-path-traversal-upload`: path traversal en lectura y en escritura, comprobación de ruta canónica, enlaces simbólicos, nombres de archivo generados, validación de tipo por números mágicos, límites de tamaño
- `security` / `csp-security-headers`: `X-Content-Type-Options: nosniff`, `Content-Disposition: attachment` y un `Content-Security-Policy` restrictivo en los archivos de usuarios

## Ejecución

El único requisito es Docker.

```sh
./setup-unix-upload-path-traversal-lab.sh        # Linux y macOS
./setup-windows-upload-path-traversal-lab.ps1    # Windows
```

El script construye la imagen, ejecuta la verificación de tipos y las pruebas en una red interna, y elimina todo al final.

## Demo

```sh
docker compose run --rm demo
docker compose down -v --remove-orphans
```

Imprime los mismos nueve pasos dos veces. En la API vulnerable, `bob-fake` descarga el secreto falso que vive fuera de la carpeta de cargas (con el nombre simple y con su forma en percent-encoding), escribe un archivo fuera de la carpeta, reemplaza el informe de `alice-fake`, guarda una página HTML como `image/png` y como `text/html`, carga más que el límite, y lee el secreto a través de un enlace simbólico. En la API corregida las mismas solicitudes reciben `400`, `415`, `413` y `404`, no se escribe nada fuera de la carpeta, y el uso legítimo (un archivo de texto, un PNG y un PDF que suben y vuelven) sigue respondiendo `201` y `200`.

## Pruebas

```sh
docker compose run --rm ts-test
docker compose down -v --remove-orphans
```

El contenedor ejecuta `tsc --noEmit` y luego `bun test`. Cada prueba crea su propia carpeta temporal (`mkdtemp`) con una carpeta `uploads/` y, junto a ella, `private/FAKE-SECRET.txt` que contiene `FAKE-SECRET-not-real`. Ese archivo falso es lo único que se lee "desde fuera". No se toca ningún archivo real del sistema.

| Archivo | Qué demuestra |
| --- | --- |
| `ts/tests/traversal.test.ts` | Las mismas funciones de escenario corren contra ambas versiones. Vulnerable: un nombre de descarga con `../` devuelve el secreto falso, su forma codificada `%2e%2e%2f` también, un nombre de carga con `../` escribe fuera de la carpeta, una segunda carga reemplaza el archivo de otro usuario, se sigue un enlace simbólico. Corregida: los dos intentos de descarga reciben `400`, la carga cae dentro de la carpeta bajo un id generado, las dos cargas reciben ids distintos, no se sigue el enlace (`404`). Además: las descargas van por id a través del índice |
| `ts/tests/upload.test.ts` | Vulnerable: los bytes HTML se aceptan como `image/png` y se sirven como `text/html` sin `nosniff`, y no hay límite de tamaño. Corregida: los bytes que no coinciden con el tipo declarado reciben `415`, un archivo por encima del límite recibe `413` (y un cuerpo en streaming se corta justo después del límite), las descargas llevan el tipo detectado, `nosniff`, `attachment` y una CSP, el nombre original vuelve codificado de forma segura, Zod rechaza la entrada mal formada. En ambas: el uso normal funciona |
| `ts/tests/paths.test.ts` | La comprobación de ruta canónica y la detección de tipo por separado, sin HTTP |
| `ts/tests/network.test.ts` | El contenedor no puede alcanzar el exterior (una solicitud a `http://example.com` falla) y el proceso no corre como root |

## Estructura

| Ruta | Qué es |
| --- | --- |
| `ts/src/data.ts` | Usuarios falsos, tokens falsos, el secreto falso y los archivos de ejemplo |
| `ts/src/vulnerable/vulnerable-app.ts` | La API de ElysiaJS que confía en el nombre, tipo y tamaño del cliente. Vulnerable a propósito |
| `ts/src/fixed/fixed-paths.ts` | La comprobación de ruta canónica: `resolve`, luego `realpath`, luego "¿está dentro de la raíz?" |
| `ts/src/fixed/fixed-file-type.ts` | La lista de permitidos de tipos, decidida por los bytes iniciales |
| `ts/src/fixed/fixed-app.ts` | La misma API: ids generados, un índice, un límite de tamaño mientras se lee, cabeceras de respuesta seguras, Zod |
| `ts/src/scenario.ts` | Los intentos, escritos una vez y ejecutados contra ambas versiones |
| `ts/src/demo.ts` | El recorrido que imprime el servicio `demo` |
| `ts/src/http.ts` | El tipo de error que lleva el código de estado |

## Por qué ocurre la falla

Un archivo llega con tres piezas de texto adjuntas: un nombre, un tipo y un tamaño. Las tres las escribe quien envía la solicitud. La API vulnerable las usa como hechos.

```ts
// vulnerable: el cliente elige la ruta
await writeFile(join(uploadRoot, name), bytes);
```

- **`join` construye una ruta, no la confina.** `join("/data/uploads", "../private/x")` es `/data/private/x`. El segmento `..` significa "una carpeta arriba" para el sistema operativo, y el nombre vino de la solicitud, así que quien llama elige dónde lee el servidor y dónde escribe.
- **La decodificación ocurre antes de que el código vea el valor.** El framework convierte `%2e%2e%2f` en `../` al analizar la URL. Una comprobación sobre el texto crudo y un uso del texto decodificado están mirando dos cadenas distintas.
- **Los nombres son un espacio compartido.** Cuando el cliente elige el nombre en el disco, dos personas que elijan el mismo nombre escriben el mismo archivo.
- **`Content-Type` es una afirmación.** La API vulnerable lo guarda y lo envía de vuelta, así que quien carga decide cómo trata el archivo el navegador de cualquier otro visitante. Una página HTML servida como `text/html` desde la propia dirección de la aplicación se ejecuta como una página de la aplicación.
- **Un navegador puede adivinar.** Sin `X-Content-Type-Options: nosniff`, algunos navegadores miran el contenido y eligen un tipo distinto del declarado.
- **Leer todo el cuerpo primero** significa que el servidor ya pagó la memoria cuando descubre que el archivo es demasiado grande.
- **`readFile` sigue los enlaces simbólicos.** Una ruta que está dentro de la carpeta como texto puede terminar en otro lugar del disco.

Nada falla para un usuario honesto, y por eso estas fallas sobreviven a las pruebas del camino feliz.

## Cómo prevenirla

- **Genera el nombre en el servidor.** El archivo se guarda como un id aleatorio (`randomUUID()`). El nombre del cliente nunca pasa a ser parte de una ruta, así que no hay nada con lo que hacer traversal y dos cargas no pueden colisionar. La escritura usa la flag `wx`, que falla en lugar de reemplazar un archivo existente.
- **Conserva el nombre original solo como metadato.** Se valida con Zod (longitud, sin caracteres de control), se reduce a su último segmento y se devuelve en `Content-Disposition: attachment; filename="..."; filename*=UTF-8''...`, con una alternativa ASCII y percent-encoding, para que una comilla o un salto de línea no puedan llegar a la cabecera.
- **Descarga por id, a través de un índice.** La ruta recibe un id, lo valida como UUID con Zod y lo busca en un índice. Un archivo que está en el disco y no en el índice no existe para la API. La ruta se arma a partir del id que el servidor guardó.
- **Comprueba igualmente la ruta canónica.** Aplica `resolve` a la ruta final y exige que empiece con la raíz más un separador, luego pregunta a `realpath` dónde termina realmente (siguiendo los enlaces simbólicos) y exige lo mismo otra vez. Lee la ruta que devolvió la comprobación.
- **Decide el tipo por los bytes, con una lista de permitidos.** PNG y PDF se reconocen por sus bytes iniciales (números mágicos) y el texto plano por ser UTF-8 válido sin caracteres de control. Todo lo demás se rechaza con `415`, y también un archivo cuyos bytes no concuerdan con el tipo declarado. El tipo que se guarda y se sirve es el detectado.
- **Limita el tamaño mientras lees.** El cuerpo se lee en trozos y la lectura se detiene en el primer byte por encima del límite (`413`). `Content-Length` es solo un atajo para rechazar pronto, porque lo escribe el cliente.
- **Sirve los archivos de usuarios como datos inertes.** `X-Content-Type-Options: nosniff`, `Content-Disposition: attachment` y `Content-Security-Policy: default-src 'none'; sandbox` en cada descarga. En producción, sirve además los archivos de usuarios desde un dominio separado que no tenga sesión.
- **Mínimo privilegio y separación.** El proceso corre como el usuario no root `bun`, y la carpeta de cargas no está dentro de ninguna carpeta servida como archivos estáticos: el único camino hacia un archivo guardado es la ruta de descarga.

Una firma dice cómo empieza un archivo y no prueba nada sobre el resto. La detección de tipo reduce lo que se acepta; las cabeceras de la respuesta son lo que evita que un archivo aceptado se trate como una página.

## Qué no funciona como corrección

- **Quitar `../` del nombre una vez.** Una sola pasada por el texto puede dejar atrás una secuencia que se convierte en `../` después de la eliminación o en un paso posterior de decodificación, así que el filtro y el sistema de archivos terminan leyendo dos cadenas distintas. Compara rutas canónicas en lugar de limpiar texto, o mejor, no uses el nombre en absoluto.
- **Comprobar solo la extensión.** La extensión es parte del nombre, y el cliente escribe el nombre. `chart.png` no dice nada sobre los bytes de dentro, y la prueba carga HTML con exactamente ese nombre.
- **Confiar en `Content-Type`.** Es una cabecera de la solicitud: el cliente la pone en lo que pase la comprobación.
- **Una lista de bloqueo de extensiones.** Una lista de cosas prohibidas vale tanto como la memoria de su autor: debe nombrar toda extensión peligrosa, en toda grafía, en toda plataforma, para siempre. Una lista de permitidos nombra las pocas cosas que se aceptan y rechaza el resto por defecto.
- **Comprobar la ruta solo como texto.** Un enlace simbólico tiene un nombre perfectamente inocente. Solo el sistema operativo sabe dónde termina, que es lo que pregunta `realpath`.
- **Confiar en `Content-Length` para el límite de tamaño.** Por la misma razón que `Content-Type`: cuenta los bytes que realmente llegan.

## Alcance de seguridad del laboratorio

- Todo se ejecuta de forma local en Docker, en una red de compose con `internal: true`. No se publica ningún puerto y una prueba demuestra que el contenedor no puede alcanzar el exterior.
- Ambas APIs corren dentro del proceso de pruebas (`app.handle`). Ninguna solicitud sale del contenedor, y nada aquí apunta a ningún otro sistema.
- El único archivo leído "desde fuera de la carpeta" es `FAKE-SECRET.txt`, creado por el laboratorio en una carpeta temporal y eliminado después. No se lee ni se escribe ningún archivo real del sistema.
- Todos los datos son falsos: `alice-fake`, `bob-fake`, tokens como `FAKE-TOKEN-alice-not-real`, el secreto `FAKE-SECRET-not-real`. La muestra de HTML cargada no contiene ningún script.
- Las entradas de demostración son un nombre de traversal y su forma en percent-encoding. No hay escáner, ni fuzzer, ni lista de payloads.

## Versiones

| Componente | Versión |
| --- | --- |
| Bun | `oven/bun:1.4.2` |
| ElysiaJS | 1.4.30 |
| Zod | 4.6.5 |
| TypeScript | 7.0.2 |
| @types/bun | 1.4.2 |
