# Sistemas de archivos

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Un sistema de archivos convierte un dispositivo de bloques en bruto en archivos y directorios con nombre que sobreviven a un corte de energía. Debajo de la interfaz conocida están los métodos de asignación, los i-nodes, la gestión del espacio libre y el journaling, y encima de ella están las organizaciones de archivo que usan las bases de datos: registros, índices, árboles B y ordenación externa para datos que no caben en memoria. Ambas mitades las moldea un solo hecho: el almacenamiento es lento, así que lo que cuenta es el número de accesos.

## Miniproyectos

| Miniproyecto | Qué enseña | Estado |
| --- | --- | --- |
| Organización de archivos e índices (`file-organisation`) | Cómo viven los registros, las listas de espacio libre y los índices dentro de un archivo | planeado |
| Ordenación externa (`external-sorting`) | Cómo ordenar un archivo más grande que la memoria | planeado |

## Quiz y documentación

- Preguntas del quiz: planeadas (`quiz/content/file-systems/`).
- Documentación: planeada (`docs/es/file-systems/`).
- Referencias de todas las áreas: [REFERENCES.es.md](../../REFERENCES.es.md)

## Referencias

Fuentes seleccionadas, no una lista exhaustiva. Todos los enlaces se verificaron cuando se escribió la lista.

### Empieza aquí

- [Operating Systems: Three Easy Pieces (Persistence part)](https://pages.cs.wisc.edu/~remzi/OSTEP/), Remzi and Andrea Arpaci-Dusseau. Gratis en línea, de pago impreso. Capítulos gratuitos sobre discos, RAID, archivos y directorios, implementación de sistemas de archivos, journaling y flash.
- [Sistemas Operacionais: Conceitos e Mecanismos](https://wiki.inf.ufpr.br/maziero/doku.php?id=socm:start), Carlos Maziero, UFPR. En portugués. Gratuito. El libro de texto gratuito en portugués tiene una parte entera sobre archivos, directorios y asignación.
- [Files are hard](https://danluu.com/file-consistency/), Dan Luu. Gratuito. Un estudio de lo difícil que es escribir un archivo de forma segura, con la investigación que encontró los errores.

### Libros

- [Modern Operating Systems, 5th edition](https://www.pearson.com/en-us/subject-catalog/p/modern-operating-systems/P200000003295), Andrew S. Tanenbaum and Herbert Bos. De pago. La fuente del quiz para archivos, directorios, asignación, espacio libre y journaling.
- [Database Internals](https://www.databass.dev/), Alex Petrov. De pago. La primera mitad trata de las estructuras en disco: formatos de archivo, variantes de árbol B y almacenamiento estructurado en log.
- [Practical File System Design with the Be File System](http://www.nobius.org/dbg/practical-file-system-design.pdf), Dominic Giampaolo. Gratuito. Un libro del diseñador de un sistema de archivos real, publicado como PDF gratuito en el sitio del autor.

### Cursos y clases

- [CMU 15-445/645 Database Systems](https://15445.courses.cs.cmu.edu/), Andy Pavlo, Carnegie Mellon University. Gratuito. Las clases sobre almacenamiento, árboles B+ y ordenación externa por mezcla coinciden con la segunda mitad de esta área.
- [MIT 6.1810 Operating System Engineering](https://pdos.csail.mit.edu/6.1810/), MIT PDOS. Gratuito. Laboratorios sobre el sistema de archivos de xv6: i-nodes, directorios, la caché de buffers y el logging.

### Artículos y especificaciones

- [A Fast File System for UNIX](https://dsf.berkeley.edu/cs262/FFS.pdf), McKusick, Joy, Leffler and Fabry (1984). Gratuito. El artículo que introdujo los grupos de cilindros y las políticas de disposición, el ancestro de ext2 a ext4.
- [The Design and Implementation of a Log-Structured File System](https://people.eecs.berkeley.edu/~brewer/cs262/LFS.pdf), Mendel Rosenblum and John Ousterhout (1992). Gratuito. Escribe todo en secuencia en un log, la idea que después usaron el almacenamiento flash y los árboles LSM.
- [The Ubiquitous B-Tree](https://carlosproal.com/ir/papers/p121-comer.pdf), Douglas Comer (1979). Gratuito. El estudio clásico de los árboles B y B+ y por qué se adaptan a los discos.
- [The Google File System](https://research.google/pubs/the-google-file-system/), Ghemawat, Gobioff and Leung (2003). Gratuito. Cómo se diseña un sistema de archivos cuando los archivos son enormes y las máquinas fallan todo el tiempo.
- [All File Systems Are Not Created Equal](https://www.usenix.org/conference/osdi14/technical-sessions/presentation/pillai), Pillai and others (2014). Gratuito. Un estudio de los supuestos de consistencia ante caídas que hacen las aplicaciones y que los sistemas de archivos rompen.

### Documentación oficial

- [ext4 Data Structures and Algorithms](https://docs.kernel.org/filesystems/ext4/), kernel.org. Gratuito. La disposición en disco de un sistema de archivos de producción: grupos de bloques, i-nodes, extents y el journal.
- [SQLite Database File Format](https://www.sqlite.org/fileformat2.html), SQLite. Gratuito. Una descripción completa y legible de cómo las tablas y los índices se guardan como páginas de árbol B en un solo archivo.
- [inode(7)](https://man7.org/linux/man-pages/man7/inode.7.html), Linux man-pages project. Gratuito. Lo que guarda un i-node: tipo, permisos, contador de enlaces, tamaños y marcas de tiempo.
- [PostgreSQL: Database Physical Storage](https://www.postgresql.org/docs/current/storage.html), PostgreSQL Global Development Group. Gratuito. Cómo una base de datos real dispone en archivos las páginas, los mapas de espacio libre y los valores grandes.

### Videos

- [CMU Database Group](https://www.youtube.com/@CMUDatabaseGroup), Carnegie Mellon University. Gratuito. Las clases grabadas sobre almacenamiento, estructuras de índice y ordenación.

### Práctica y herramientas

- [OSTEP homework simulators](https://github.com/remzi-arpacidusseau/ostep-homework), Remzi Arpaci-Dusseau. Gratuito. Simuladores de discos, RAID, un sistema de archivos muy simple y journaling.
- [Let's Build a Simple Database](https://cstack.github.io/db_tutorial/), Connor Stack. Gratuito. Un tutorial que guarda filas en páginas y luego en un árbol B, cercano a los miniproyectos de esta área.

### Comunidades

- [Unix and Linux Stack Exchange: filesystems tag](https://unix.stackexchange.com/questions/tagged/filesystems), Stack Exchange. Gratuito. Preguntas respondidas sobre i-nodes, enlaces, journaling y comportamiento de los sistemas de archivos.
- [LWN.net Kernel index](https://lwn.net/Kernel/Index/), LWN.net. Gratis en línea, de pago impreso. Años de artículos cuidadosos sobre los sistemas de archivos y el almacenamiento de Linux, organizados por tema.
