#!/usr/bin/env sh
# EN: Runs the load script with a target that is NOT local and checks that k6 refuses to start.
#     The test passes only when k6 fails with the refusal message.
# PT: Roda o script de carga com um alvo que NÃO é local e confere que o k6 se recusa a começar.
#     O teste só passa quando o k6 falha com a mensagem de recusa.
# ES: Ejecuta el script de carga con un objetivo que NO es local y comprueba que k6 se niega a empezar.
#     La prueba solo pasa cuando k6 falla con el mensaje de rechazo.
set -u

echo "running k6 with TARGET=$TARGET (must be refused)"
if output=$(k6 run --quiet /load/overload.js 2>&1); then
	echo "$output"
	echo "FAIL: k6 accepted a target that is not local"
	exit 1
fi
echo "$output"
if echo "$output" | grep -q "refusing to run"; then
	echo "PASS: k6 refused the target and sent no request"
	exit 0
fi
echo "FAIL: k6 failed for another reason"
exit 1
