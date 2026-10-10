# Organización de archivos e índices

> English version: [docs/en/file-systems/file-organisation.md](../../en/file-systems/file-organisation.md) · Versão em português: [docs/pt/file-systems/file-organisation.md](../../pt/file-systems/file-organisation.md)

Mini-proyecto: [projects/file-systems/file-organisation](../../../projects/file-systems/file-organisation). Lenguajes: C++, Rust. Temas del quiz: `file-systems` / `record-organisation`, `indexes`, `compression-and-space-reclamation`.

## El problema

Para el sistema operativo un archivo es una secuencia de bytes. Los campos, los registros, las claves y el espacio libre son una interpretación que el programa tiene que escribir en el archivo, de una forma que permita leerlo de vuelta. Y como un acceso a disco cuesta unas cien mil veces más que un acceso a memoria, la organización se juzga por cuántas lecturas necesita una búsqueda, no por cuántas comparaciones.

Este mini-proyecto construye las respuestas clásicas una sobre otra: registros de longitud fija, una cabecera, una lista de libres, un índice primario, índices secundarios y compresión.

## El archivo de datos

```text
byte 0                     32             96             160
     +----------------------+--------------+--------------+-----
     | cabecera (32 bytes)  | slot, RRN 0  | slot, RRN 1  | ...
     +----------------------+--------------+--------------+-----
```

| Campo de la cabecera | Bytes | Significado |
| --- | --- | --- |
| magic | 0 a 3 | `FORG` |
| versión | 4 a 7 | 1 |
| tamaño del registro | 8 a 11 | 64 |
| cantidad de slots | 12 a 15 | slots en el archivo, vivos o libres |
| cantidad de vivos | 16 a 19 | registros en uso |
| cabeza de libres | 20 a 23 | RRN de la cima de la lista de libres, o -1 |

| Campo del slot | Bytes | Significado |
| --- | --- | --- |
| marca | 0 | 0x01 para un registro vivo, `*` para un slot libre |
| id | 1 a 4 | clave primaria (en un slot libre: RRN del siguiente slot libre) |
| año | 5 a 6 | |
| ciudad | 7 a 26 | texto completado con espacios |
| nombre | 27 a 63 | texto completado con espacios |

Los enteros son little-endian en posiciones fijas, así que el archivo no depende de la máquina ni del lenguaje que lo escribió.

Como cada slot tiene 64 bytes, el slot con número relativo de registro (RRN) n empieza en el **byte 32 + n x 64**. Los RRN empiezan en cero. Leer el registro 25 es un seek al byte 1.632, sin leer ningún otro registro. El precio es el relleno: una ciudad de 6 letras ocupa igualmente 20 bytes.

## La lista de libres

Eliminar un registro no mueve nada. El slot se marca con `*`, la cabeza antigua de la lista de libres se escribe dentro de él, y la cabecera pasa a apuntar a este slot. La lista es una pila que vive en el espacio que administra:

```text
eliminar RRN 3, luego 7, luego 2:  cabecera.cabeza_libres = 2
                                   slot 2: * siguiente 7
                                   slot 7: * siguiente 3
                                   slot 3: * siguiente -1
insertar X:                        X va al slot 2, cabecera.cabeza_libres = 7
```

Una inserción desapila la cima, y el archivo solo crece cuando la pila está vacía. Cualquier slot libre sirve para cualquier registro, y por eso aquí basta una pila. Con registros de longitud variable habría que buscar en la lista un slot que quepa (first-fit, best-fit, worst-fit).

## El índice primario

El índice es una lista de entradas de longitud fija (id, RRN) ordenadas por id. El archivo de datos queda en orden de llegada. Buscar un id es una búsqueda binaria en memoria, como máximo 14 sondeos para 10.500 entradas, seguida de la lectura de un slot.

El índice vive en memoria mientras los archivos están abiertos y `close()` lo escribe en `primary.idx`. El archivo tiene un **indicador de desactualizado** en su cabecera. Antes del primer cambio de una sesión el indicador se activa en disco, y `close()` lo limpia. Si la siguiente apertura encuentra el indicador activado, la última sesión no terminó, y el índice se reconstruye leyendo el archivo de datos. Los datos son la verdad y el índice se deriva de ellos.

## Índices secundarios y listas invertidas

Un índice secundario responde búsquedas por un campo que se repite, aquí la ciudad y el año. Tiene dos partes:

```text
tabla de claves (city.sec)       archivo de listas (city.lst)
NATAL   -> 1                     0: id 30, siguiente -1
RECIFE  -> 2                     1: id 20, siguiente -1
                                 2: id 10, siguiente 3
                                 3: id 20, siguiente 0
```

La tabla de claves tiene una entrada por ciudad, con la posición del primer nodo de una lista enlazada. Cada nodo guarda una **clave primaria** y la posición del siguiente nodo. Agregar un registro añade un nodo y cambia un enlace, sea cual sea la longitud de la lista.

Dos decisiones importan:

- **Enlace tardío (late binding).** Las listas guardan claves primarias, no RRN. Una búsqueda por ciudad pasa por el índice primario para encontrar cada registro. Eso cuesta una consulta más en memoria, y a cambio una eliminación toca solo el índice primario: la clave del registro eliminado permanece en la lista y se descarta cuando el índice primario no la conoce.
- **Listas ordenadas.** Cada lista se mantiene en orden creciente de clave primaria, así que la consulta "ciudad = RECIFE y año = 2010" es un matching cosecuencial: ambas listas se recorren una vez, avanzando la que tiene la clave menor.

## Compresión

- **Codificación run-length**: una secuencia de 4 o más bytes iguales se convierte en 3 bytes (marcador 0xFF, valor, cuenta hasta 255). Un byte de dato igual al marcador se escribe siempre como secuencia. Elimina el relleno de los registros.
- **Codificación de Huffman**: los dos nodos menos frecuentes se unen hasta que queda un árbol, y el código de un byte es su camino desde la raíz. Los bytes frecuentes reciben códigos cortos, y ningún código es el comienzo de otro. El archivo comprimido guarda la longitud original y las 256 frecuencias, a partir de las cuales el decodificador reconstruye el mismo árbol.

## Qué demuestran las pruebas

| Ítem del plan | Prueba |
| --- | --- |
| MP-FS-1.1 los slots eliminados se reutilizan | el archivo tiene el mismo tamaño tras 334 eliminaciones y tras las 334 inserciones que siguen, todo slot reutilizado está por debajo del antiguo final del archivo, y una inserción más agrega exactamente 64 bytes |
| MP-FS-1.2 la búsqueda por índice es igual al barrido completo | tras 6.000 inserciones y eliminaciones aleatorias, las búsquedas por ciudad, por año y por ambos devuelven exactamente los registros de un barrido completo, con los índices de la sesión, cargados desde disco y reconstruidos tras un final no limpio |
| MP-FS-1.3 ida y vuelta sin pérdida y razón de compresión | nueve entradas sobreviven a codificar y decodificar con ambos métodos y su encadenamiento, se verifican tamaños calculados a mano, y la demo informa las razones |

## La demo

La demo imprime cuentas, nunca tiempos, así que su salida es la misma en cualquier máquina y en los dos lenguajes. Está versionada en [results/demo.md](../../../projects/file-systems/file-organisation/results/demo.md), y una prueba en cada lenguaje compara la salida con ese archivo.

| Paso | Slots en el archivo | Registros vivos | Slots libres | Tamaño del archivo (bytes) |
| --- | ---: | ---: | ---: | ---: |
| insert 10000 records | 10000 | 10000 | 0 | 640032 |
| delete 3000 records | 10000 | 7000 | 3000 | 640032 |
| insert 3000 records | 10000 | 10000 | 0 | 640032 |
| insert 500 records | 10500 | 10500 | 0 | 672032 |

Una búsqueda por ciudad lee unos 880 slots a través del índice, los que coinciden, contra 10.500 del barrido. El archivo de datos de 672.096 bytes se reduce al 67,3% con la codificación run-length, al 57,1% con la codificación de Huffman y al 53,1% con una después de la otra.

## Límites de esta implementación

- Solo registros de longitud fija, sin registros de longitud variable ni estrategias de colocación.
- Los índices caben en memoria. Un índice demasiado grande para la memoria es el tema de [árbol B en disco](../data-structures/b-tree-on-disk.md).
- Las listas secundarias solo se limpian con una reconstrucción.
- No hay protección contra una caída a mitad de una escritura en el archivo de datos: para eso sirve un journal.

## Ejecución

```sh
cd projects/file-systems/file-organisation
./setup-unix-file-organisation.sh            # o ./setup-windows-file-organisation.ps1
docker compose run --rm cpp-test forg_demo   # o rust-test
```
