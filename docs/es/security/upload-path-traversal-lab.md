# Laboratorio de carga de archivos y path traversal: nombres y tipos de archivo que vienen del cliente (MP-SEC-8)

> English version: [docs/en/security/upload-path-traversal-lab.md](../../en/security/upload-path-traversal-lab.md) · Versão em português: [docs/pt/security/upload-path-traversal-lab.md](../../pt/security/upload-path-traversal-lab.md)

Miniproyecto: [`projects/security/upload-path-traversal-lab`](../../../projects/security/upload-path-traversal-lab/README.es.md). Temas del quiz: `ssrf-path-traversal-upload`, `csp-security-headers`.

Este es un laboratorio defensivo. Se ejecuta solo en Docker, en una red interna, con datos falsos, y el único archivo leído "desde fuera" es un secreto falso que el laboratorio crea en una carpeta temporal. El código vulnerable existe únicamente para hacer observables las fallas.

## El concepto

La carga de un archivo lleva los bytes del archivo y tres descripciones de él. Las descripciones son texto escrito por el cliente:

| Qué envía el cliente | Qué es realmente | Quién debe decidir en su lugar |
| --- | --- | --- |
| El nombre del archivo | Una etiqueta, que puede contener `/`, `\` y `..` | El servidor genera el nombre en el disco |
| `Content-Type` | Una afirmación sobre el contenido | El servidor lee los primeros bytes |
| `Content-Length` | Una afirmación sobre el tamaño | El servidor cuenta los bytes a medida que llegan |

**Path traversal** es lo que ocurre cuando un nombre que viene de la solicitud pasa a ser parte de una ruta. Para el sistema operativo, `..` significa "la carpeta de arriba", así que un nombre puede salir de la carpeta que la aplicación tenía en mente. La **ruta canónica** es la forma final única de una ruta después de aplicar todo `.` y `..` y de seguir todo enlace simbólico. Dos textos distintos pueden nombrar el mismo archivo, así que una decisión sobre una ruta solo es confiable cuando se toma sobre la forma canónica.

## La falla

```text
disco del laboratorio                   bob-fake -> servidor vulnerable
<tmp>/uploads/            raíz          GET /download?file=../private/FAKE-SECRET.txt
<tmp>/private/                            join(uploads, "../private/FAKE-SECRET.txt")
    FAKE-SECRET.txt       fuera           = <tmp>/private/FAKE-SECRET.txt -> 200, el secreto
```

La API vulnerable hace `join(uploadRoot, name)` y usa el resultado, para leer y para escribir:

- **Lectura fuera de la carpeta.** La descarga devuelve el secreto falso. La forma en percent-encoding del mismo nombre también funciona, porque la URL se decodifica antes de que el handler se ejecute.
- **Escritura fuera de la carpeta.** La carga guarda el archivo donde el nombre apunte.
- **Sobrescritura.** Los nombres se comparten, así que un segundo `report.txt` reemplaza al primero, sea de quien sea.
- **Tipo elegido por el cliente.** El `Content-Type` declarado se guarda y se devuelve sin `nosniff` y sin `Content-Disposition`. Una página HTML enviada como `text/html` se sirve como página de la aplicación.
- **Sin límite de tamaño.** Todo el cuerpo se lee en memoria antes de cualquier verificación.
- **Se siguen los enlaces simbólicos.** Un enlace dentro de la carpeta que apunta hacia afuera se lee como cualquier archivo.

## La corrección

| Capa | Qué hace la API corregida |
| --- | --- |
| Nombre en el disco | `randomUUID()` generado por el servidor. Escrito con la flag `wx`, que nunca reemplaza un archivo |
| Nombre original | Solo metadato: validado con Zod, reducido al último segmento, devuelto en un `Content-Disposition: attachment` codificado |
| Búsqueda | Descarga por id: el id se valida como UUID con Zod y se busca en un índice. Los ids desconocidos y los archivos de otros usuarios responden `404` |
| Ruta canónica | `resolve`, exigir "raíz + separador" como prefijo, luego `realpath` (de la raíz y del archivo) y exigir de nuevo. La ruta comprobada es la ruta leída |
| Tipo | Lista de permitidos decidida por los primeros bytes: PNG, PDF, texto plano en UTF-8. Un tipo declarado fuera de la lista, bytes desconocidos o una divergencia responden `415` |
| Tamaño | El cuerpo se lee en trozos y se corta en el primer byte por encima del límite: `413` |
| Respuesta | Tipo detectado, `X-Content-Type-Options: nosniff`, `Content-Disposition: attachment`, `Content-Security-Policy: default-src 'none'; sandbox` |
| Proceso | Usuario no root `bun`, carpeta de cargas fuera de cualquier carpeta estática |

Las dos primeras filas eliminan el problema (el nombre del cliente deja de usarse), y las demás son capas que siguen valiendo si una de ellas falla. El separador en la comparación de prefijo importa: sin él, `/data/uploads-old` contaría como dentro de `/data/uploads`.

Dos límites están declarados en el código. Un número mágico dice cómo empieza un archivo y no prueba nada sobre el resto, así que son las cabeceras de la respuesta las que mantienen inerte un archivo aceptado. Y entre `realpath` y la lectura existe una pequeña ventana (una carrera llamada TOCTOU), cerrada en la práctica por el hecho de que solo el servidor escribe en la carpeta, con nombres que él generó.

### Qué no es una corrección

- **Quitar `../` una vez**: una pasada por el texto puede dejar atrás una secuencia que luego se convierte en `../`, así que el filtro y el sistema de archivos leen cadenas distintas.
- **Comprobar la extensión**, **confiar en `Content-Type`** o **confiar en `Content-Length`**: los tres los escribe el cliente.
- **Una lista de bloqueo de extensiones**: debe recordar todo caso peligroso, mientras que una lista de permitidos rechaza lo que no conoce.
- **Comprobar la ruta solo como texto**: un enlace simbólico tiene un nombre inocente.

## Qué demuestran las pruebas

| Elemento | Cómo se verifica |
| --- | --- |
| MP-SEC-8.1 una prueba lee un archivo fuera de la carpeta de cargas dentro del contenedor | `tests/traversal.test.ts`, "vulnerable API: the flaw is observable": la descarga de `../private/FAKE-SECRET.txt` responde `200` con `FAKE-SECRET-not-real`, un archivo creado por el laboratorio en una carpeta temporal. También la forma codificada, la escritura fuera de la carpeta, la sobrescritura y el enlace simbólico seguido |
| MP-SEC-8.1 tipo en el que se confía, sin límite de tamaño | `tests/upload.test.ts`: bytes HTML aceptados como `image/png`, servidos como `text/html` sin `nosniff`, y 1 MiB + 1 byte aceptado |
| MP-SEC-8.2 la misma prueba es bloqueada | `tests/traversal.test.ts`, "fixed API: the same attempts are blocked": las mismas funciones de escenario reciben `400`, y el secreto no está en la respuesta |
| MP-SEC-8.2 las cargas válidas siguen funcionando | `tests/upload.test.ts`, "normal use works", en las dos versiones: un texto, un PNG y un PDF suben y vuelven byte a byte |
| Escritura fuera de la carpeta bloqueada | La carga llamada `../private/...` no deja nada afuera; aparece un archivo en la carpeta, con un UUID como nombre |
| Sobrescritura imposible | Dos cargas con el mismo nombre reciben ids distintos y la primera dueña lee su propio contenido |
| Bytes que no coinciden con el tipo declarado | HTML como `image/png`, PNG como `text/plain` y bytes desconocidos llamados `chart.png` responden `415` |
| Archivo por encima del límite | `413` para 1 MiB + 1 byte, nada guardado; un stream de 64 MiB se cancela después del límite; exactamente 1 MiB se acepta |
| Traversal codificado `%2e%2e%2f` | `400` en el parámetro de descarga |
| Enlace simbólico no seguido | Un enlace en la carpeta de cargas que apunta al secreto responde `404`; `tests/paths.test.ts` prueba `realPathInsideRoot` por separado |
| Cabeceras y Zod | `nosniff`, `attachment`, CSP y el nombre original codificado en toda descarga; los ids, nombres y `Content-Length` mal formados responden `400` |
| Aislamiento del laboratorio | `tests/network.test.ts`: una solicitud a `http://example.com` falla desde dentro del contenedor, y el proceso no es root |

## Cómo ejecutarlo

```sh
cd projects/security/upload-path-traversal-lab
./setup-unix-upload-path-traversal-lab.sh     # build, verificación de tipos y pruebas
docker compose run --rm demo                  # el paso a paso
docker compose down -v --remove-orphans
```
