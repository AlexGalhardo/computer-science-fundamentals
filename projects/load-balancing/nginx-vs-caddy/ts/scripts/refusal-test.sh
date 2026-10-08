#!/usr/bin/env sh
# EN: Runs the lab with a target that is NOT local and checks that it refuses to start.
#     The test passes only when the program fails with the refusal message.
# PT: Roda o laboratório com um alvo que NÃO é local e confere que ele se recusa a começar.
#     O teste só passa quando o programa falha com a mensagem de recusa.
set -u

echo "running the lab with NGINX_URL=$NGINX_URL (must be refused)"
if output=$(bun run src/cli.ts distribution 2>&1); then
	echo "$output"
	echo "FAIL: the lab accepted a target that is not local"
	exit 1
fi
echo "$output"
if echo "$output" | grep -q "refusing to run"; then
	echo "PASS: the lab refused the target and sent no request"
	exit 0
fi
echo "FAIL: the lab failed for another reason"
exit 1
