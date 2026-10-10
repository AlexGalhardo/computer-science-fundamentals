#!/usr/bin/env sh
# EN: The whole "product" of the sample mini-project: prints the sum of its arguments.
# PT: Todo o "produto" do mini-projeto de exemplo: imprime a soma dos seus argumentos.
# ES: Todo el "producto" del mini-proyecto de ejemplo: imprime la suma de sus argumentos.
set -eu

total=0
for price in "$@"; do
	total=$((total + price))
done
echo "$total"
