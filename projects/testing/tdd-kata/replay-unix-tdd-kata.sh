#!/usr/bin/env sh
# EN: Replays the kata. For every step commit it extracts the code exactly as it was in that
#     commit and runs the tests in a throw-away container, with no network. A "red" commit must
#     fail and a "green" or "refactor" commit must pass. The prefix check trusts the commit
#     messages. This script proves that the messages tell the truth.
#     It needs git and a full clone, besides Docker.
# PT: Reencena o kata. Para cada commit de passo, extrai o código exatamente como estava naquele
#     commit e roda os testes em um contêiner descartável, sem rede. Um commit "red" precisa
#     falhar e um commit "green" ou "refactor" precisa passar. A checagem de prefixos confia nas
#     mensagens de commit. Este script prova que as mensagens dizem a verdade.
#     Ele precisa de git e de um clone completo, além do Docker.
# ES: Reproduce el kata. Para cada commit de paso, extrae el código exactamente como estaba en ese
#     commit y ejecuta las pruebas en un contenedor desechable, sin red. Un commit "red" debe
#     fallar y un commit "green" o "refactor" debe pasar. La comprobación de prefijos confía en los
#     mensajes de commit. Este script prueba que los mensajes dicen la verdad.
#     Necesita git y un clon completo, además de Docker.
set -eu

cd "$(dirname "$0")"

IMAGE="oven/bun:1.4.2"

git log --reverse --format="%h %s" -- . | {
	wrong=0
	steps=0
	while read -r sha subject; do
		case "$subject" in
			"test(tdd-kata): red - "*) expected=fail ;;
			"feat(tdd-kata): green - "* | "refactor(tdd-kata): "*) expected=pass ;;
			*) continue ;;
		esac
		steps=$((steps + 1))
		if output=$(git archive "$sha" ts |
			docker run --rm -i --network none "$IMAGE" \
				sh -c 'mkdir /home/bun/kata && cd /home/bun/kata && tar -xf - && cd ts && bun test' 2>&1); then
			actual=pass
		else
			actual=fail
		fi
		if [ "$actual" = "$expected" ]; then
			echo "ok    $sha tests $actual  $subject"
		else
			echo "WRONG $sha tests $actual, expected $expected  $subject"
			echo "$output"
			wrong=$((wrong + 1))
		fi
	done
	echo "$steps steps replayed, $wrong wrong"
	[ "$steps" -gt 0 ] && [ "$wrong" -eq 0 ]
}
