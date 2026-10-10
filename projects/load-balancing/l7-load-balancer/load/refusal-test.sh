#!/usr/bin/env sh
# EN: Runs the benchmark script with targets that are NOT local and checks that k6 refuses to
#     start every time. Each target is a way a careless check could be fooled.
# PT: Roda o script do benchmark com alvos que NÃO são locais e confere que o k6 se recusa a
#     começar todas as vezes. Cada alvo é um jeito de enganar uma verificação descuidada.
# ES: Ejecuta el script del benchmark con destinos que NO son locales y verifica que k6 se niega a
#     arrancar todas las veces. Cada destino es una forma de engañar a una verificación descuidada.
set -u

failed=0
for target in \
	"https://example.com" \
	"http://example.com:8080" \
	"http://localhost.example.com" \
	"http://localhost@example.com" \
	"http://nginx:8080@example.com" \
	"http://192.168.0.10:8080" \
	"https://nginx:8080" \
	"nginx:8080"; do
	if output=$(TARGET="$target" k6 run --quiet /load/bench.js 2>&1); then
		echo "FAIL: k6 accepted $target"
		failed=1
	elif echo "$output" | grep -q "refusing to run"; then
		echo "PASS: k6 refused $target"
	else
		echo "$output"
		echo "FAIL: k6 failed for another reason with $target"
		failed=1
	fi
done
exit "$failed"
