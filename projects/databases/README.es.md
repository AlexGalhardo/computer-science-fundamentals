# Bases de datos (teoría)

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

La teoría de bases de datos explica cómo se modelan los datos como relaciones, se consultan con un lenguaje declarativo y se almacenan de modo que las consultas sigan siendo rápidas y los datos sigan siendo correctos. El modelo relacional, el álgebra relacional, la normalización, los índices y la optimización de consultas son las ideas detrás de toda base de datos SQL, y son lo que permite diseñar un esquema y leer un plan de consulta en lugar de adivinar.

## Miniproyectos

| Miniproyecto | Qué enseña | Estado |
| --- | --- | --- |
| [Mini SGBD relacional](mini-dbms/) | Cómo funcionan la selección, la proyección y tres algoritmos de join | disponible |
| [Herramienta de normalización](normalisation-tool/) | Cómo las dependencias funcionales determinan las formas normales | disponible |

## Quiz y documentación

- Preguntas del quiz: [quiz/content/databases/](../../quiz/content/databases/)
- Documentación: [docs/es/databases/](../../docs/es/databases/)
- Referencias de todas las áreas: [REFERENCES.es.md](../../REFERENCES.es.md)

## Referencias

Fuentes seleccionadas, no una lista exhaustiva. Todos los enlaces se verificaron cuando se escribió la lista.

### Empieza aquí

- [SQLBolt](https://sqlbolt.com/), SQLBolt. Gratuito. Lecciones interactivas cortas que enseñan SQL ejecutando consultas en el navegador.
- [Use The Index, Luke](https://use-the-index-luke.com/), Markus Winand. Gratuito. Libro en línea gratuito sobre cómo funcionan los índices de árbol B y cómo escribir consultas que los usen.
- [Let's Build a Simple Database](https://cstack.github.io/db_tutorial/), Connor Stack. Gratuito. Tutorial que escribe un pequeño clon de SQLite en C, desde el REPL hasta el árbol B en disco.

### Libros

- [Database System Concepts, 7th edition](https://db-book.com/), Silberschatz, Korth and Sudarshan. De pago. Libro de texto completo; el sitio ofrece gratis diapositivas y ejercicios de práctica de cada capítulo.
- [Database Internals](https://www.databass.dev/), Alex Petrov. De pago. Cómo se construyen los motores de almacenamiento: árboles B, almacenamiento estructurado en log, gestión de buffers y recuperación.
- [Readings in Database Systems, 5th edition (the Red Book)](http://www.redbook.io/), Peter Bailis, Joseph Hellerstein and Michael Stonebraker. Gratuito. Selección comentada de los artículos que dieron forma al campo, con una introducción para cada grupo.
- [An Introduction to Database Systems, 8th edition](https://en.wikipedia.org/wiki/Christopher_J._Date), C. J. Date (Addison-Wesley, 2004). De pago. El libro de texto que sigue el quiz, hoy fuera del catálogo de la editorial; el enlace es el artículo de enciclopedia sobre el autor y sus libros.

### Cursos y clases

- [CMU 15-445/645 Database Systems](https://15445.courses.cs.cmu.edu/), Andy Pavlo, Carnegie Mellon University. Gratuito. Diapositivas, notas, videos y proyectos sobre almacenamiento, índices, ejecución de consultas, optimización y concurrencia.
- [CS 186 Introduction to Database Systems](https://cs186berkeley.net/), UC Berkeley. Gratuito. Notas de curso y ejercicios sobre álgebra relacional, joins, optimización de consultas y normalización.
- [Curso de Banco de Dados MySQL](https://www.cursoemvideo.com/curso/mysql/), Gustavo Guanabara, Curso em Vídeo. En portugués. Gratuito. Curso en video para principiantes, en portugués, sobre tablas, claves, relaciones y consultas SQL.

### Artículos y especificaciones

- [A Relational Model of Data for Large Shared Data Banks](https://www.engineering.upenn.edu/~zives/03f/cis550/codd.pdf), Edgar F. Codd (1970). Gratuito. El artículo que propuso las relaciones, las claves y las formas normales, y dio inicio a las bases de datos relacionales.
- [Architecture of a Database System](https://dsf.berkeley.edu/papers/fntdb07-architecture.pdf), Hellerstein, Stonebraker and Hamilton (2007). Gratuito. Un extenso panorama de cómo se organiza un SGBD relacional real, desde el analizador sintáctico hasta el gestor de almacenamiento.
- [Access Path Selection in a Relational Database Management System](https://courses.cs.duke.edu/compsci516/cps216/spring03/papers/selinger-etal-1979.pdf), Selinger and others, IBM (1979). Gratuito. El artículo de System R que definió la optimización de consultas basada en costos y el orden de los joins.

### Documentación oficial

- [PostgreSQL documentation](https://www.postgresql.org/docs/current/), PostgreSQL Global Development Group. Gratuito. El manual más claro de un sistema real: SQL, índices, el planificador y EXPLAIN.
- [SQLite: Query Planning](https://www.sqlite.org/queryplanner.html), SQLite. Gratuito. Explicación corta e ilustrada de cómo los índices aceleran búsquedas, ordenamiento y joins.

### Videos

- [CMU Database Group](https://www.youtube.com/@CMUDatabaseGroup), Carnegie Mellon University. Gratuito. Las clases grabadas de 15-445 y 15-721, además de charlas de ingenieros de bases de datos.

### Práctica y herramientas

- [RelaX: relational algebra calculator](https://dbis-uibk.github.io/relax/), University of Innsbruck. Gratuito. Ejecuta expresiones de álgebra relacional sobre datos de ejemplo y muestra el árbol de operadores.
- [PostgreSQL Exercises](https://pgexercises.com/), Alisdair Owens. Gratuito. Ejercicios de SQL con corrección sobre un esquema pequeño, desde consultas simples hasta funciones de ventana.

### Comunidades

- [Database Administrators Stack Exchange](https://dba.stackexchange.com/), Stack Exchange. Gratuito. Preguntas y respuestas sobre diseño de esquemas, normalización, índices y planes de consulta.
- [r/Database](https://www.reddit.com/r/Database/), Reddit. Gratuito. Discusión general sobre diseño y sistemas de bases de datos.
