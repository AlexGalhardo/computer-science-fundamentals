# Catálogo de mini-proyectos

> English version: [docs/en/mini-project-catalog.md](../en/mini-project-catalog.md) · Versão em português: [docs/pt/mini-project-catalog.md](../pt/mini-project-catalog.md)
>
> Nota (2026-10-08): la carpeta `references/` mencionada en este documento se eliminó del repositorio y de su historial. Las referencias de estudio están en [REFERENCES.es.md](../../REFERENCES.es.md).

Ideas acordadas en el brainstorming de la Fase 2, agrupadas por área. Es el backlog que `PLAN.md` convierte en tareas con criterios de aceptación. TypeScript es el lenguaje de referencia salvo que se liste otro primero.

## Algoritmos y Big O

| Mini-proyecto | Lenguajes | Demo o benchmark |
| --- | --- | --- |
| Carrera de ordenamientos (burbuja, inserción, merge, quick, heap, radix) | los 7 | tiempo por `n` con entrada aleatoria, ordenada e invertida |
| Laboratorio de Big O | TS | mide una función, ajusta la curva y muestra la complejidad empírica |
| Programación dinámica (mochila, LCS, cambio de monedas) | TS, Python | recursión ingenua, memoización y tabulación lado a lado |
| Viajante de comercio | TS, Rust | fuerza bruta frente a una heurística, mostrando dónde `n!` se vuelve inutilizable |

## Estructuras de datos

| Mini-proyecto | Lenguajes | Demo o benchmark |
| --- | --- | --- |
| Hash map desde cero | C++, Rust, TS | encadenamiento frente a direccionamiento abierto, según el factor de carga |
| Grafos (Dijkstra, Bellman-Ford, orden topológico, árbol de expansión) | C++, Go | los 10 casos `.in/.out` de `references/usp/data-structures-2` se convierten en pruebas automatizadas |
| Árbol B en disco | C++, Rust | lecturas de páginas frente a un árbol binario |
| Caché LRU, filtro de Bloom y trie | TS, Go | tasa de aciertos y falsos positivos medidos |

## Compiladores

| Mini-proyecto | Lenguajes | Demo o benchmark |
| --- | --- | --- |
| Mini lenguaje: lexer, parser, AST e intérprete | TS | REPL que muestra los tokens y el árbol de cada línea |
| VM de bytecode para el mismo lenguaje | Rust | intérprete que recorre el árbol frente a bytecode |
| Motor de expresiones regulares (NFA a DFA) | Go | visualización del autómata |

## Máquinas de estado y teoría de la información

| Mini-proyecto | Lenguajes | Demo o benchmark |
| --- | --- | --- |
| Máquina de estados de un pedido (pagado, enviado, cancelado) | TS, Elixir | transiciones inválidas rechazadas, diagrama generado a partir del código |
| Huffman y LZ77 | Rust, Python | razón de compresión frente a la entropía de Shannon del archivo |
| Detección y corrección de errores (CRC, Hamming) | C++ | invierte bits y muestra qué se detecta y qué se corrige |

## Concurrencia y paralelismo

| Mini-proyecto | Lenguajes | Demo o benchmark |
| --- | --- | --- |
| Condición de carrera en un contador: versión con el error y arreglo | Go, Rust, Java, Elixir, TS | mutex, atómico, canal y actor resolviendo el mismo problema |
| Interbloqueo: cena de los filósofos | Go, Java | locks a propósito, luego resuelto con ordenamiento de locks |
| Escalado por núcleos (primos, Mandelbrot) | Rust, Go, C++ | aceleración real frente a la ley de Amdahl |
| 10 mil conexiones | TS, Go, Elixir | event loop, goroutines y procesos de la BEAM bajo k6 local |

## Transacciones y bases de datos

| Mini-proyecto | Lenguajes | Demo o benchmark |
| --- | --- | --- |
| Niveles de aislamiento en PostgreSQL | TS + SQL | lectura sucia, fantasma y actualización perdida reproducidas en pruebas |
| Sobreventa en el checkout | TS | bloqueo optimista, bloqueo pesimista y `SERIALIZABLE` bajo carga |
| Prisma, Drizzle y SQL puro | TS | la misma consulta, latencia y SQL generado |
| Outbox y saga | TS | falla inyectada a mitad de camino, consistencia verificada |

## Balanceo de carga, rendimiento y protocolos

| Mini-proyecto | Lenguajes | Demo o benchmark |
| --- | --- | --- |
| NGINX frente a Caddy (round-robin, least-conn, ip-hash) | config + TS | distribución de las peticiones y pérdida de un nodo |
| Balanceador de carga L7 escrito a mano | Go | health check y reintento, comparado con NGINX |
| REST, GraphQL y JSON-RPC sobre la misma API | TS (Elysia) | latencia y tamaño de la carga útil, problema N+1 en GraphQL |
| HTTP/1.1, HTTP/2 y HTTP/3 | Caddy + TS | cascada de peticiones con muchas imágenes pequeñas |
| Servidor HTTP sobre TCP puro | Go o Rust | parser de protocolo escrito a mano |
| Bun frente a Node, con y sin cluster de PM2 | TS | peticiones por segundo y memoria |

## Mensajería

| Mini-proyecto | Lenguajes | Demo o benchmark |
| --- | --- | --- |
| La misma tarea en BullMQ, RabbitMQ, Kafka y SQS (LocalStack) | TS | throughput, orden y reentrega |
| Idempotencia y dead-letter queue | TS, Go | consumidor que falla, efecto aplicado exactamente una vez |
| Cola frente a pub/sub, con contrapresión | TS, Elixir | productor más rápido que el consumidor |

## OOP, programación funcional, patrones y SOLID

| Mini-proyecto | Lenguajes | Demo o benchmark |
| --- | --- | --- |
| El mismo dominio (carrito) en estilo OOP y funcional | Java, Elixir, TS | líneas, capacidad de prueba y mutación comparadas |
| SOLID antes y después | TS, Java | código que viola, refactor, las mismas pruebas pasando |
| Unos 10 patrones de back end | TS | un pequeño ejemplo por patrón |
| Funciones puras con pruebas basadas en propiedades | TS, Elixir | una propiedad encuentra el error que la prueba de ejemplo no ve |

## Seguridad

Un laboratorio aislado por falla: versión vulnerable, versión corregida y una prueba que demuestra el arreglo. Solo local, en Docker, en una red interna.

| Laboratorio | Qué enseña |
| --- | --- |
| Inyección SQL | concatenación frente a consultas parametrizadas |
| XSS (almacenado, reflejado, DOM) y CSP | escape de la salida y política de contenido |
| CSRF | token y cookies `SameSite` |
| Control de acceso roto (IDOR) | verificación de propiedad en el servidor |
| SSRF | lista de destinos permitidos, dentro de la red interna de Docker |
| Contraseñas y sesiones | MD5 frente a Argon2, limitación de intentos |
| Errores comunes de JWT | algoritmo fijo, secreto fuerte, expiración |
| Carga de archivos y path traversal | validación de la ruta y del tipo |

## Testing

| Mini-proyecto | Demo |
| --- | --- |
| Pirámide completa en una app (unitarias, de integración, e2e con Playwright, smoke, regresión) | tiempo y costo de cada capa |
| Kata de TDD con un historial de commits rojo, verde, refactor | el historial es la lección |
| Pruebas de mutación | 100% de cobertura que no detecta el error |
| Laboratorio de pruebas inestables | causas (tiempo, orden, red) y arreglos |

## Observabilidad

Stack: OpenTelemetry, Prometheus, Grafana, Loki y Tempo, todo local.

| Mini-proyecto | Demo |
| --- | --- |
| Tres servicios con trazas, métricas y logs | una petición lenta trazada de extremo a extremo |
| Logs estructurados e id de correlación | encontrar un error por id de petición |
| SLO y alerta | k6 local provoca la violación y la alerta se dispara |
| Profiling con un flame graph | cuello de botella encontrado y corregido, antes y después |

## Áreas adicionales

| Área | Idea de mini-proyecto |
| --- | --- |
| Caché | Redis, estrategias de invalidación, cache stampede, cache-aside frente a write-through, medido con k6 local |
| Limitador de tasa | token bucket, leaky bucket y ventana deslizante, en memoria y en Redis |
| Sistemas de archivos | organización de archivos, índices, compresión y desfragmentación |
| Lógica digital | compuertas lógicas, sumador, flip-flop y un simulador de circuitos |
| Redes | sockets TCP y UDP, handshake, DNS y un protocolo sencillo hecho a mano |
| Sistemas operativos | planificador de procesos, memoria virtual y paginación, semáforos, simulados y visualizados |
| Blockchain | cadena de bloques con hashing, prueba de trabajo y validación |
| CI | GitHub Actions ejecutando lint, pruebas y benchmarks de cada mini-proyecto |

## Áreas nuevas a partir de los libros

| Área | Idea de mini-proyecto |
| --- | --- |
| Electrónica | solo teoría: sin mini-proyecto, un quiz de 170 preguntas que sigue los 34 capítulos del libro |
| Arquitectura de software | la misma aplicación pequeña en capas de arquitectura limpia, mostrando la regla de dependencia con entidades, casos de uso y adaptadores |
| Bases de datos (teoría) | mini DBMS relacional con joins de bucles anidados, hash y merge, y una herramienta de normalización (cierre, claves candidatas, 3FN y BCNF) |
| Ingeniería de software | solo teoría: sin mini-proyecto, un quiz de 150 preguntas |

## Ideas de los libros y las clases

Añadidas después de leer los resúmenes en `references/summaries/`.

| Área | Idea de mini-proyecto | Fuente |
| --- | --- | --- |
| Sistemas operativos | simulador de planificación de CPU con diagrama de Gantt (FCFS, SJF, round-robin, prioridad) | Tanenbaum |
| Sistemas operativos | simulador de paginación y TLB con reemplazo de páginas y la anomalía de Belady | Tanenbaum |
| Sistemas operativos | asignador de memoria (first, best y worst fit, buddy) con benchmark de fragmentación | Tanenbaum |
| Sistemas operativos | detector de interbloqueos y algoritmo del banquero, mini shell con pipes y señales | Tanenbaum |
| Redes | protocolos de ventana deslizante sobre un canal con pérdidas, mini TCP sobre UDP | Tanenbaum |
| Redes | simulador de ALOHA y CSMA/CD, resolvedor DNS iterativo, calculadora de subredes | Tanenbaum |
| Sistemas de archivos | ordenamiento externo con merge multivía, índices en disco con listas invertidas | USP Data Structures II |
| Compiladores | recolector de basura mark-and-sweep, optimizaciones simples sobre código de tres direcciones | Dragon Book |
| Rendimiento | multiplicación de matrices ingenua frente a por bloques, midiendo fallos de caché | Dragon Book |
| Big O | teorema maestro interactivo, la cota Ω(n lg n) mostrada con un árbol de decisión | USP Algorithm Analysis |
| Algoritmos | quicksort híbrido, variando el umbral del ordenamiento por inserción y la estrategia del pivote | USP Algorithm Analysis |
| Estructuras de datos | BST sin balancear frente a árboles AVL y rojinegros, con visualizador de rotaciones | USP Data Structures I |
| Lógica digital | minimización de Karnaugh y Quine-McCluskey, ALU solo con NAND, mini CPU de 4 bits | USP Digital Logic |
| Testing | kata del dinero multimoneda, mini xUnit desde cero | Kent Beck |
| OOP y SOLID | catálogo ejecutable de code smells con antes y después | Clean Code, OO and SOLID |
