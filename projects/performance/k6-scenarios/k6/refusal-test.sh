#!/usr/bin/env sh
# EN: Runs each of the four scenarios with a target that is NOT local and checks that k6 refuses
#     to start. The test passes only when every run fails with the refusal message.
# PT: Roda cada um dos quatro cenários com um alvo que NÃO é local e confere que o k6 se recusa a
#     começar. O teste só passa quando toda execução falha com a mensagem de recusa.
# ES: Ejecuta cada uno de los cuatro escenarios con un destino que NO es local y comprueba que k6 se
#     niega a empezar. La prueba solo pasa cuando toda ejecución falla con el mensaje de rechazo.
set -u

for scenario in load stress spike soak; do
	echo "running k6 scenario $scenario with BASE_URL=$BASE_URL (must be refused)"
	if output=$(SCENARIO="$scenario" k6 run --quiet --no-usage-report /k6/scenario.js 2>&1); then
		echo "$output"
		echo "FAIL: k6 accepted a target that is not local"
		exit 1
	fi
	if ! echo "$output" | grep -q "refusing to run"; then
		echo "$output"
		echo "FAIL: k6 failed for another reason"
		exit 1
	fi
done
echo "PASS: k6 refused the target in the four scenarios and sent no request"
