# EN: Bun runs TypeScript directly: it strips the types and JavaScriptCore compiles the hot code
#     at run time (JIT). There is no build step, the image only carries the files.
# PT: O Bun roda TypeScript direto: ele remove os tipos e o JavaScriptCore compila o código
#     quente em tempo de execução (JIT). Não há etapa de build, a imagem só carrega os arquivos.
# ES: Bun ejecuta TypeScript directo: quita los tipos y JavaScriptCore compila el código caliente
#     en tiempo de ejecución (JIT). No hay paso de build, la imagen solo carga los archivos.
FROM oven/bun:1.4.2
COPY ts/ /opt/bench/
