# Quiz

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

El producto principal de este repositorio: un quiz que cubre todas las áreas de fundamentos de ciencias de la computación. Cada pregunta tiene 5 alternativas, y después de la respuesta la explicación aparece al lado: el concepto, por qué la alternativa correcta es correcta, por qué cada una de las otras es incorrecta, un ejemplo opcional, y enlaces al mini-proyecto que muestra el concepto funcionando y a la fuente.

Diseño: [docs/es/quiz.md](../docs/es/quiz.md). Cómo escribir preguntas: [docs/es/quiz-authoring.md](../docs/es/quiz-authoring.md).

## Cómo ejecutarlo

El único requisito es Docker.

```sh
./setup-unix-quiz.sh        # Linux y macOS
./setup-windows-quiz.ps1    # Windows
```

El quiz queda en <http://localhost:3000> (define `QUIZ_PORT` para cambiar el puerto). Para detenerlo: `docker compose down`.

## De qué está hecho

| Parte | Elección | Motivo |
| --- | --- | --- |
| Framework | Next.js con generación estática (`output: "export"`) | cada página se pre-renderiza en el build en archivos simples en `out/` |
| Componentes | Base UI (`@base-ui/react`), sin estilos | los controles interactivos (botones, interruptores, selects, el medidor de progreso y el popup de un término) reciben uso por teclado, manejo de foco y ARIA de la biblioteca, en lugar de código escrito a mano |
| Estilos | Tailwind CSS v4, tokens de color por tema | Base UI no tiene estilos: Tailwind da la apariencia, solo con tokens, así que los temas claro y oscuro usan los mismos componentes |
| Servidor | ninguno. Un servidor de archivos estáticos (Caddy) sirve `out/` | sin back end, sin ruta de API, sin datos obtenidos en tiempo de ejecución |
| Contenido | archivos JSON en `content/<area>/<tema>.json`, validados con Zod | una pregunta rota hace fallar el build |
| Almacenamiento | `localStorage` para el progreso, `sessionStorage` para la ronda actual | el progreso queda en el navegador, sin cuenta |

## Funcionalidades

- **Tres idiomas.** Inglés, portugués y español en la interfaz y en todas las preguntas, en `/en/`, `/pt/` y `/es/`. La primera visita sigue el idioma del navegador y la elección se recuerda. Cambiar de idioma en medio de una pregunta mantiene la pregunta, la respuesta elegida y la explicación.
- **Tema claro y oscuro.** La primera visita sigue la preferencia del sistema. El tema se aplica antes del primer pintado, así que recargar nunca parpadea con el otro tema.
- **Pensado para celular.** Una columna por debajo de 768 px, con la explicación debajo de las alternativas, y dos columnas a partir de ahí. Usable desde 320 px de ancho, con áreas táctiles de al menos 44 por 44 px.
- **Progreso** por área, con un botón para reiniciarlo.
- **Repasar solo las que fallé.** Una pregunta sale de esa lista cuando se responde correctamente.
- **Filtro de dificultad**: básico, intermedio, avanzado.
- **Mezcla** de preguntas y alternativas en cada intento.
- **Teclado**: las teclas 1 a 5 o A a E eligen una alternativa, Enter pasa a la siguiente pregunta.

## Estructura

```text
quiz/
  content/            preguntas, mapas de cobertura y los dos catálogos
  scripts/            validate, blind y compare (pipeline de contenido)
  src/app/            rutas: /[lang], /[lang]/[area], .../quiz, .../result
  src/components/     encabezado, lista y panel de áreas, pantalla de la pregunta, explicación, resultado
  src/content/        schemas Zod, verificaciones del repositorio, revisión ciega
  src/i18n/           un diccionario tipado por idioma
  src/lib/            mezcla, ronda, progreso, resaltado de código, cargador de contenido del build
  tests/unit/         schema, mezcla, ronda, puntuación, progreso, diccionarios
  tests/e2e/          flujos en Playwright contra el build estático
  tests/fixtures/     un área pequeña con tres preguntas, usada por las pruebas
```

## Pruebas

```sh
./setup-unix-quiz.sh test        # o: ./setup-windows-quiz.ps1 test
```

Esto construye el sitio a partir del fixture de prueba y ejecuta, dentro de Docker, las pruebas unitarias (`bun test`) y las de extremo a extremo (`playwright test`): flujo de la pregunta en ancho de celular y de escritorio, ronda solo con teclado, verificaciones automáticas de accesibilidad y contraste en los dos temas, cambio de idioma en medio de una pregunta, progreso, modo de repaso, filtro de dificultad, y ausencia de desplazamiento horizontal en 320, 390, 768 y 1280 px.

## Comandos de contenido

Ejecuta desde la raíz del repositorio, con Bun instalado:

```sh
bun run quiz:validate [area] [--strict]      # schema, ids únicos, temas y metas
bun run quiz:blind <area>                    # exporta las preguntas sin la clave de respuestas
bun run quiz:compare <area> <respuestas.json> # escribe review.md con los desacuerdos
```

## Desarrollo local

```sh
bun install
cd quiz
bun run dev          # http://localhost:3000
bun run build        # sitio estático en out/
bun test tests/unit
```
