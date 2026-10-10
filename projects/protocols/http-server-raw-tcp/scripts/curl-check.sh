#!/bin/sh
# EN: Checks the server with curl, an HTTP client we did not write. If curl accepts the
#     responses, they are valid HTTP and not only consistent with our own parser.
#     Usage: curl-check.sh http://server:8080
# PT: Confere o servidor com o curl, um cliente HTTP que não escrevemos. Se o curl aceita as
#     respostas, elas são HTTP válido, e não apenas coerentes com o nosso próprio parser.
#     Uso: curl-check.sh http://server:8080
# ES: Comprueba el servidor con curl, un cliente HTTP que no escribimos. Si curl acepta las
#     respuestas, son HTTP válido y no solo coherentes con nuestro propio parser.
#     Uso: curl-check.sh http://server:8080
set -eu

BASE="${1:-http://server:8080}"

# EN: The check only ever targets a service of this lab.
# PT: A checagem só atinge um serviço deste laboratório.
# ES: La comprobación solo apunta a un servicio de este laboratorio.
case "$BASE" in
http://server:* | http://127.0.0.1:* | http://localhost:*) ;;
*)
	echo "refusing to run against $BASE: the target must be the local lab server" >&2
	exit 2
	;;
esac

failures=0

expect() {
	# expect <description> <actual> <expected>
	if [ "$2" = "$3" ]; then
		echo "ok    $1"
	else
		echo "FAIL  $1"
		echo "      got:  $2"
		echo "      want: $3"
		failures=$((failures + 1))
	fi
}

expect "GET with a route parameter" \
	"$(curl -sS -w ' [%{http_code} %{content_type}]' "$BASE/hello/curl")" \
	"hello, curl
 [200 text/plain; charset=utf-8]"

expect "POST: the body comes back, delimited by Content-Length" \
	"$(curl -sS --data-binary 'sent by curl' -w ' [%{http_code} %header{x-body-bytes}]' "$BASE/echo")" \
	"sent by curl [200 12]"

expect "chunked response, decoded by curl" \
	"$(curl -sS "$BASE/stream" | tr '\n' ',')" \
	"line 1,line 2,line 3,line 4,line 5,"

# EN: --raw shows the body as it is on the wire: each chunk preceded by its size (7) and the
#     final zero-sized chunk.
# PT: --raw mostra o corpo como ele está no fio: cada pedaço precedido pelo tamanho (7) e o
#     pedaço final de tamanho zero.
# ES: --raw muestra el cuerpo como está en la red: cada chunk precedido por su tamaño (7) y el
#     chunk final de tamaño cero.
expect "chunked response, raw framing" \
	"$(curl -sS --raw "$BASE/stream" | tr -d '\r' | tr '\n' ',')" \
	"7,line 1,,7,line 2,,7,line 3,,7,line 4,,7,line 5,,0,,"

# EN: Two URLs in one curl command. With keep-alive the second one reuses the TCP connection.
# PT: Duas URLs em um comando curl. Com keep-alive a segunda reaproveita a conexão TCP.
# ES: Dos URLs en un comando curl. Con keep-alive el segundo reutiliza la conexión TCP.
expect "keep-alive: the second request reuses the connection" \
	"$(curl -sS -v "$BASE/hello/one" "$BASE/hello/two" 2>&1 | grep -ci 're-using existing')" \
	"1"

expect "HEAD: headers of GET and no body" \
	"$(curl -sS -I "$BASE/hello/curl" | tr -d '\r' | grep -i '^content-length') [$(curl -sS -I -o /dev/null -w '%{size_download}' "$BASE/hello/curl")]" \
	"Content-Length: 12 [0]"

expect "404 for an unknown path" \
	"$(curl -sS -o /dev/null -w '%{http_code}' "$BASE/nowhere")" \
	"404"

expect "405 with an Allow header for a known path and the wrong method" \
	"$(curl -sS -o /dev/null -w '%{http_code} %header{allow}' "$BASE/echo")" \
	"405 POST"

big="$(head -c 20000 /dev/zero | tr '\0' 'a')"
expect "431 for oversized headers" \
	"$(curl -sS -o /dev/null -w '%{http_code}' -H "X-Big: $big" "$BASE/health")" \
	"431"

if [ "$failures" -ne 0 ]; then
	echo "curl-check: $failures check(s) failed" >&2
	exit 1
fi
echo "curl-check: all checks passed ($(curl --version | head -n 1 | cut -d' ' -f1-2))"
