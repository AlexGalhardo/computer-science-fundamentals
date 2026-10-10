#!/usr/bin/env sh
# EN: The test of the sample mini-project. A test is a program that ends with exit code 0 when
#     the behaviour is right and with another code when it is wrong. CI reads only that code.
# PT: O teste do mini-projeto de exemplo. Um teste é um programa que termina com código de saída
#     0 quando o comportamento está certo e com outro código quando está errado. O CI lê só esse
#     código.
# ES: La prueba del mini-proyecto de ejemplo. Una prueba es un programa que termina con código de
#     salida 0 cuando el comportamiento es correcto y con otro código cuando es incorrecto. CI lee
#     solo ese código.
set -eu

result="$(sh src/total.sh 2 3 5)"
if [ "$result" = "10" ]; then
	echo "ok   the total of 2 3 5 is 10"
else
	echo "FAIL the total of 2 3 5 should be 10, got $result"
	exit 1
fi
