# Registro del brainstorming

> English version: [docs/en/brainstorming.md](../en/brainstorming.md) · Versão em português: [docs/pt/brainstorming.md](../pt/brainstorming.md)
>
> Nota (2026-10-08): la carpeta `references/` mencionada en este documento se eliminó del repositorio y de su historial. Las referencias de estudio están en [REFERENCES.es.md](../../REFERENCES.es.md).

Registro de las preguntas planteadas en el brainstorming de la Fase 2, el 2026-10-07, con la opción elegida y las descartadas. Las decisiones consolidadas están en [decisions.md](decisions.md), el diseño del quiz en [quiz.md](quiz.md) y el backlog en [mini-project-catalog.md](mini-project-catalog.md).

## Contexto utilizado

- Código, notas y dos proyectos heredados importados a `references/`.
- Resúmenes de 254 PDF (libros, artículos y clases) en `references/summaries/`. Los libros largos se resumieron a partir de una muestra del texto.
- Un PDF escaneado (Modern Operating Systems, 3.ª edición) no pudo leerse y se eliminó; se resume la 4.ª edición del mismo libro.

## Ronda 1: estructura del repositorio

| Pregunta | Elección | Opciones descartadas |
| --- | --- | --- |
| Estructura de carpetas | Por área: `projects/<area>/<mini-project>/` | Por lenguaje; lista plana |
| Lenguajes por mini-proyecto | Referencia en TypeScript más los que cambian la lección | Siempre los 7; uno por mini-proyecto |
| Entorno | Todo en Docker | Herramientas instaladas localmente; ambos caminos |
| Benchmarks | Contrato JSON + hyperfine | Runner propio; herramienta nativa de cada lenguaje |
| Dashboards | Página estática por mini-proyecto | Un solo sitio Next.js; solo CLI |
| Proyectos heredados | Reconstruir como nuevos mini-proyectos | Portar y adaptar; solo referencia |
| README y comentarios | Dos archivos + un bloque de comentario por concepto | Un archivo; comentarios línea por línea |
| Imágenes en `references/images/` | Quitarlas de git | Mantenerlas; mantener solo las propias del dueño |
| Compiladores | Intérprete + VM de bytecode | Hasta WebAssembly; hasta código nativo; solo front end |
| Patrones de diseño | Selección de unos 10 patrones de back end | Catálogo GoF completo; solo dentro de otros mini-proyectos |
| Laboratorios de seguridad | Un laboratorio aislado por falla | Una app con todas las fallas; ambos |
| Observabilidad | OpenTelemetry + Prometheus, Grafana, Loki, Tempo | OpenTelemetry + Jaeger + Prometheus; solo salida por consola |
| Áreas adicionales | Las ocho: caché, limitador de tasa, sistemas de archivos, lógica digital, redes, sistemas operativos, blockchain, CI | ninguna descartada |
| Primera oleada de mini-proyectos | Mezcla de áreas: ordenamiento, condición de carrera, inyección SQL, lexer + parser, colas | Enfoque en back end web; enfoque en ciencias de la computación clásicas |
| Orden después de la primera oleada | Primero a lo ancho | Primero en profundidad; elegir en cada oleada |

## Ronda 2: quiz

Después de leer los PDF, la idea principal pasó a ser un quiz: preguntas con 5 alternativas y, tras responder, la explicación del concepto, en una cuadrícula de dos columnas (la pregunta a la izquierda, la explicación a la derecha).

| Pregunta | Elección | Opciones descartadas |
| --- | --- | --- |
| Papel del quiz | Quiz central + mini-proyectos | Primero el quiz y los mini-proyectos después; solo el quiz; un quiz por mini-proyecto |
| Pantalla | Una pregunta por pantalla | Lista con scroll y un panel fijo; pregunta por pantalla con un mapa lateral |
| Tecnología | Next.js con exportación estática | HTML plano; Next.js + API + base de datos |
| Contenido de la explicación | Los cuatro elementos: concepto, por qué es incorrecta cada alternativa errónea, ejemplo de código o diagrama, enlace al mini-proyecto y a la fuente | ninguna descartada |
| Volumen | Al menos 100 preguntas por área, con el objetivo de cubrir todo el contenido de los libros (respuesta del dueño) | 10, 20 o 30 por área; variable |
| Idioma | PT y EN desde el principio | Primero PT; solo PT |
| Áreas nuevas | Las cuatro: electrónica, arquitectura de software, bases de datos (teoría), ingeniería de software | ninguna descartada |
| Funciones | Las cuatro: progreso guardado, repasar las falladas, nivel de dificultad, mezcla | ninguna descartada |
| Fuente de las preguntas | Mapa de capítulos + conocimiento propio | Volver a poner el PDF para cada área; mixto |
| Producción | App + 5 áreas completas, luego oleadas de 5 | Todas las áreas con 20 y luego completarlas; todo a la vez |
| Revisión | Revisor independiente + validación automática | Solo validación de formato; el dueño revisa todo |

## Ronda 3: instrucciones para el plan final

Dadas por el dueño al pedir el `PLAN.md` final.

| Tema | Instrucción |
| --- | --- |
| Contenido solo teórico | Un quiz web muy completo que cubra todos los aspectos del contenido, sin mini-proyecto. Aplicado a Electrónica e Ingeniería de software |
| Contenido técnico | Ejemplos prácticos ejecutables (Docker, scripts de shell, CLI o web) más el quiz, uno complementando al otro. Aplicado a las otras 29 áreas |
| Funciones del quiz | i18n en portugués e inglés, interruptor de tema claro y oscuro, apto para móviles, construido con Next.js SSG y Tailwind CSS v4 |
| Primeras 5 áreas del quiz | Big O y análisis de algoritmos, estructuras de datos, sistemas operativos, redes, bases de datos (teoría) |

## Ideas añadidas por los resúmenes

Pasaron al catálogo de mini-proyectos, en la sección "Ideas de los libros y las clases".

- **Sistemas operativos:** simulador de planificación de CPU, paginación y TLB, asignador de memoria, detector de interbloqueos con el algoritmo del banquero, mini shell.
- **Redes:** ventana deslizante sobre un canal con pérdidas, mini TCP sobre UDP, ALOHA y CSMA/CD, resolvedor DNS, calculadora de subredes.
- **Bases de datos:** mini DBMS con joins, herramienta de normalización, ordenamiento externo, índices en disco.
- **Compiladores:** recolector de basura, optimizaciones sobre código de tres direcciones, multiplicación de matrices por bloques.
- **Análisis de algoritmos:** teorema maestro interactivo, la cota Ω(n lg n), quicksort híbrido.
- **Lógica digital y electrónica:** Karnaugh, ALU solo con NAND, mini CPU de 4 bits, calculadoras de circuitos.
- **Testing y diseño:** kata del dinero, mini xUnit, catálogo de code smells, aplicación de arquitectura limpia.

## Puntos abiertos

Ninguno. Las primeras 5 áreas del quiz y el mapa de cobertura de cada área están en `PLAN.md`.
