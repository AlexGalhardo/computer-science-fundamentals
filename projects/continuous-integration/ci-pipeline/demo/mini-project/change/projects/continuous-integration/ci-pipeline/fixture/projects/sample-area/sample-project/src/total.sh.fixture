#!/usr/bin/env sh
# EN: Demonstration change: the broken version of src/total.sh. It subtracts instead of adding,
#     so the test of the sample mini-project fails.
# PT: Mudança de demonstração: a versão quebrada de src/total.sh. Ela subtrai em vez de somar,
#     então o teste do mini-projeto de exemplo falha.
# ES: Cambio de demostración: la versión rota de src/total.sh. Resta en vez de sumar, así que la
#     prueba del mini-proyecto de ejemplo falla.
set -eu

total=0
for price in "$@"; do
	total=$((total - price))
done
echo "$total"
