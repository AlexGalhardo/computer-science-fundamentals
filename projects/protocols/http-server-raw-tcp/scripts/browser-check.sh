#!/bin/sh
# EN: Checks the server with a real browser. Headless Chromium (already inside the pinned
#     Playwright image) loads the page, runs its script, which calls the other routes with
#     fetch(), and prints the final DOM. The script then looks for the results in that DOM.
#     Usage: browser-check.sh http://server:8080
# PT: Confere o servidor com um navegador de verdade. O Chromium headless (já presente na imagem
#     fixada do Playwright) carrega a página, roda o script dela, que chama as outras rotas com
#     fetch(), e imprime o DOM final. O script então procura os resultados nesse DOM.
#     Uso: browser-check.sh http://server:8080
# ES: Comprueba el servidor con un navegador de verdad. Chromium headless (ya presente en la
#     imagen fijada de Playwright) carga la página, ejecuta su script, que llama a las otras
#     rutas con fetch(), e imprime el DOM final. El script luego busca los resultados en ese DOM.
#     Uso: browser-check.sh http://server:8080
set -eu

BASE="${1:-http://server:8080}"

case "$BASE" in
http://server:* | http://127.0.0.1:* | http://localhost:*) ;;
*)
	echo "refusing to run against $BASE: the target must be the local lab server" >&2
	exit 2
	;;
esac

CHROME="$(find /ms-playwright -type f -name chrome -path '*chromium-*' | head -n 1)"
if [ -z "$CHROME" ]; then
	echo "Chromium not found in this image" >&2
	exit 2
fi

# EN: --virtual-time-budget makes the browser wait until the page's timers and network requests
#     are done before the DOM is printed.
# PT: --virtual-time-budget faz o navegador esperar os temporizadores e as requisições de rede
#     da página terminarem antes de o DOM ser impresso.
# ES: --virtual-time-budget hace que el navegador espere a que terminen los temporizadores y las
#     peticiones de red de la página antes de imprimir el DOM.
DOM="$(HOME=/tmp "$CHROME" --headless --no-sandbox --disable-gpu --virtual-time-budget=15000 --dump-dom "$BASE/" 2>/dev/null)"

failures=0

expect() {
	# expect <description> <text that must be in the DOM>
	if printf '%s' "$DOM" | grep -qF -- "$2"; then
		echo "ok    $1"
	else
		echo "FAIL  $1"
		echo "      not found: $2"
		failures=$((failures + 1))
	fi
}

expect "the HTML page was parsed" '<h1>HTTP on raw TCP</h1>'
expect "fetch GET with a route parameter" '<code id="hello">200 hello, browser</code>'
expect "fetch POST: the body came back" '<code id="echo">200 sent by fetch</code>'
expect "fetch of the chunked stream, decoded by the browser" '<code id="stream">200 line 1 | line 2 | line 3 | line 4 | line 5</code>'
expect "fetch of an unknown path" '<code id="missing">404 no route for /missing</code>'

if [ "$failures" -ne 0 ]; then
	echo "browser-check: $failures check(s) failed" >&2
	printf '%s\n' "$DOM" >&2
	exit 1
fi
echo "browser-check: all checks passed ($("$CHROME" --version 2>/dev/null))"
