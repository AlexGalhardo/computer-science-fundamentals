# Benchmarks

> English version: [docs/en/benchmarks.md](../en/benchmarks.md)

Um contrato e um runner para todos os benchmarks do repositório, para que um resultado em C++ e um em Python caibam na mesma tabela. Regras: [.claude/rules/load-tests.md](../../.claude/rules/load-tests.md).

## O contrato

Toda implementação lê sua entrada, faz o trabalho e imprime **um objeto JSON na última linha da saída**:

```json
{ "n": 100000, "elapsedMs": 4.59, "memoryKb": 10040, "language": "python", "implementation": "sum-loop", "checksum": "5000050000" }
```

| Campo | Significado |
| --- | --- |
| `n` | tamanho da entrada |
| `elapsedMs` | tempo apenas do trecho medido, sem a inicialização do runtime e sem a leitura da entrada |
| `memoryKb` | pico de memória residente do processo, em KiB |
| `language` | `ts`, `python`, `go`, `rust`, `cpp`, `java` ou `elixir` |
| `implementation` | nome do algoritmo ou da variante |
| `checksum` | resumo opcional da saída, para provar que as implementações concordam |

O JSON Schema é `tools/bench/schema.json`, gerado a partir do schema Zod em `tools/bench/src/contract.ts`. Campos desconhecidos são rejeitados.

## `bench.json`

Cada mini-projeto com benchmark tem um `bench.json` que descreve uma grade: todo alvo (linguagem e imagem) roda toda implementação em todo tamanho, uma vez por variante.

```json
{
	"project": "sample",
	"runs": 3,
	"warmup": 1,
	"sizes": [1000, 100000],
	"variants": ["default"],
	"maxN": { "bubble": 10000 },
	"targets": [
		{
			"language": "ts",
			"image": "oven/bun:1.4.2",
			"version": "bun --version",
			"implementations": ["sum-loop", "sum-formula"],
			"command": "bun run ts/bench.ts {implementation} {n}"
		}
	]
}
```

- `image` é uma imagem fixada. Use `dockerfile` no lugar para construir uma a partir do projeto.
- `build` é um comando opcional executado uma vez no contêiner antes de medir, por exemplo uma compilação.
- `maxN` limita uma implementação, e é assim que algoritmos quadráticos ficam fora dos tamanhos maiores.
- `{implementation}`, `{n}` e `{variant}` são substituídos em `command`.

## Como rodar

```sh
bun run bench -- --project <nome ou caminho>
```

Para cada linha o runner sobe um contêiner da imagem da linguagem **sem rede**, e dentro dele o [hyperfine](https://github.com/sharkdp/hyperfine) roda o comando `runs` vezes depois de `warmup` execuções descartadas. Medir dentro do contêiner deixa o custo de subir o Docker fora dos números.

Ele escreve, em `results/` do mini-projeto:

| Arquivo | Uso |
| --- | --- |
| `results.md` | a tabela para pessoas, com máquina, versões dos runtimes e os comandos exatos |
| `results.json` | os mesmos dados para ferramentas |
| `results.js` | os mesmos dados como script, para o dashboard estático funcionar aberto direto do disco |

Cada linha traz o processo inteiro medido pelo hyperfine (média, desvio padrão, intervalo, tempo de CPU e pico de memória) e o trecho medido informado pelo programa. Tempo de CPU acima do tempo de relógio significa que mais de um núcleo trabalhou.

## Como ler os números

- Compare iguais com iguais: mesma carga, mesmo tamanho, mesma máquina.
- Informe a dispersão, não só a melhor execução. Uma diferença menor que o desvio padrão não é diferença.
- `process` inclui a inicialização do runtime, que domina entradas pequenas. `section` não inclui.
- Os resultados dependem da máquina. As tabelas versionadas registram onde foram medidas.
