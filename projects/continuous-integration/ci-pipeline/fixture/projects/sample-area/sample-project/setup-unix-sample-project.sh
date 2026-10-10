#!/usr/bin/env sh
# EN: Setup script of the sample mini-project. A real mini-project builds a pinned Docker image
#     here and runs its tests in it. This one runs inside the container of the demo, where there
#     is no Docker, so it needs only a shell. What the CI job relies on is the same: the name
#     setup-unix-<folder>.sh and the exit code.
# PT: Script de setup do mini-projeto de exemplo. Um mini-projeto de verdade constrói aqui uma
#     imagem Docker fixada e roda os testes nela. Este roda dentro do contêiner da demo, onde não
#     há Docker, então só precisa de um shell. O que o job do CI usa é igual: o nome
#     setup-unix-<pasta>.sh e o código de saída.
# ES: Script de setup del mini-proyecto de ejemplo. Un mini-proyecto real construye aquí una
#     imagen Docker fijada y ejecuta sus pruebas en ella. Este corre dentro del contenedor de la
#     demo, donde no hay Docker, así que solo necesita un shell. Lo que usa el job de CI es igual:
#     el nombre setup-unix-<carpeta>.sh y el código de salida.
set -eu

cd "$(dirname "$0")"

sh tests/total-test.sh
echo "sample-project: all tests passed"
