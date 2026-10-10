# Máquina virtual de bytecode

> English version: [docs/en/compilers/bytecode-vm.md](../../en/compilers/bytecode-vm.md) · Versión en español: [docs/es/compilers/bytecode-vm.md](../../es/compilers/bytecode-vm.md)

Mini-projeto MP-COMP-3, em [`projects/compilers/bytecode-vm`](../../../projects/compilers/bytecode-vm). Ensina por que bytecode roda mais rápido do que percorrer uma árvore. A linguagem é a do [MP-COMP-1](mini-language-parser.md), e o comportamento a reproduzir é o do [MP-COMP-2](tree-walking-interpreter.md).

## De uma árvore para uma linha

O interpretador de árvore executa a árvore diretamente. Este projeto acrescenta um estágio entre a árvore e a execução:

```text
código-fonte -> tokens -> árvore -> bytecode -> máquina virtual
```

Bytecode é o programa escrito para uma máquina imaginária e muito simples. A máquina aqui é uma **máquina de pilha**: as instruções não nomeiam seus operandos, elas os retiram de uma pilha e deixam o resultado lá.

```text
1 + 2 * 3        CONSTANT 1     pilha: 1
                 CONSTANT 2     pilha: 1 2
                 CONSTANT 3     pilha: 1 2 3
                 MULTIPLY       pilha: 1 6
                 ADD            pilha: 7
```

O compilador produz isso visitando a árvore em pós-ordem: operandos primeiro, operador por último. É a árvore escrita em notação pós-fixa, e a precedência já está resolvida pela ordem das instruções.

## O que o compilador decide com antecedência

O interpretador do MP-COMP-2 repete algumas decisões toda vez que um nó é executado. O compilador as toma uma vez.

| Pergunta | Interpretador de árvore, durante a execução | Compilador, antes de o programa rodar |
| --- | --- | --- |
| Qual variável é `x`? | procura o nome em uma cadeia de tabelas hash | um número de posição: `GET_LOCAL 2`, `GET_GLOBAL 0`, `GET_UPVALUE 1` |
| O que roda depois de um `if`? | a recursão retorna pelas chamadas aninhadas | um salto para um índice de instrução conhecido |
| Que tipo de nó é este? | um `switch` em um objeto nó alcançado por ponteiro | o próximo elemento de um vetor plano |
| Onde um bloco guarda suas variáveis? | um objeto ambiente novo por bloco e por chamada | posições na única pilha de valores |

## Saltos e backpatching

`if` e `while` viram saltos:

```text
if c { A } else { B }        c, JUMP_IF_FALSE else, A, JUMP end, else: B, end:
while c { A }                start: c, JUMP_IF_FALSE exit, A, JUMP start, exit:
```

Quando o compilador emite um salto para frente, o código que ele pula ainda não existe, então o destino é desconhecido. Ele emite o salto com um valor provisório, compila o ramo, e volta para preencher o destino. Isso é **backpatching**. Um salto para trás (o fim de um laço) não precisa disso, porque seu destino já foi emitido.

## Chamadas e quadros

Todos os valores moram em uma única pilha. Uma chamada não copia seus argumentos: eles já estão no topo da pilha, então a nova chamada apenas declara que suas posições começam ali.

```text
pilha:  ... | <fn area> | 3 | 4 | result |
                          ^ base da chamada: posição 0 = width, posição 1 = height, posição 2 = result
```

O que a máquina guarda sobre quem chamou (sua função, sua próxima instrução, sua base) é um **quadro** (frame): o registro de ativação da linguagem em três campos. `RETURN` corta a pilha de volta ao ponto em que a chamada começou, empilha o resultado e restaura quem chamou.

## Closures: upvalues

Locais em uma pilha morrem quando sua função retorna, mas uma closure ainda pode precisar deles. O compilador sabe, para cada função, quais variáveis externas ela usa, e as registra como **upvalues**. Em tempo de execução um upvalue começa *aberto*, apontando para a posição da variável na pilha. Quando essa posição está prestes a sumir (`CLOSE_UPVALUE` no fim de um bloco, ou um retorno), o valor é movido para dentro do upvalue, que passa a estar *fechado*. Closures que capturaram a mesma variável compartilham um upvalue, então continuam vendo as atribuições umas das outras. Variáveis que ninguém captura nunca pagam por isso.

## O laço de despacho

`rust/src/vm.rs` é um laço: busque a instrução em `ip`, avance `ip`, execute. Fluxo de controle é uma atribuição a `ip`. Cada instrução é um valor pequeno de tamanho fixo em um vetor contíguo (aqui um enum de Rust de 8 bytes, onde máquinas virtuais de produção empacotam bytes de tamanho variável), que a cache e o preditor de desvios do processador tratam muito melhor do que objetos espalhados na memória.

## Concordância com o interpretador

A suíte de exemplos do MP-COMP-2 é a especificação: `rust/tests/examples.rs` executa todo `examples/*.mini` e compara a saída com o arquivo `.out` produzido pelo interpretador. Os erros de execução têm o mesmo texto, linha e coluna, porque o compilador guarda a posição no código-fonte de cada instrução ao lado dela.

Uma diferença é deliberada e instrutiva. O compilador resolve um nome quando compila a função, e o interpretador o procura quando a função roda. Eles discordam apenas em uma função que usa uma variável de bloco declarada *depois* da função no mesmo bloco:

```text
{
	fn peek() { return late; }
	let late = 1;
	print peek();
}
```

O interpretador encontra `late` no bloco no momento da chamada e imprime `1`. O compilador ainda não viu um local `late` quando compila `peek`, trata o nome como global, e a máquina reporta `undefined variable 'late'`. No nível superior os dois concordam, porque globais são procuradas tardiamente em ambos. Linguagens reais escolhem uma regra e a documentam.

## Benchmark

`bun run bench -- --project projects/compilers/bytecode-vm` executa `bench/loop.mini` e `bench/recursion.mini` nas duas implementações e grava `results/`. Na execução versionada a máquina virtual foi cerca de 2 vezes mais rápida no laço e de 3 a 5 vezes mais rápida na função recursiva, com cerca de 2 MiB de memória contra 58 a 98 MiB.

Leia o resultado com cuidado. A comparação mistura duas diferenças: a técnica, e a linguagem de implementação (Rust contra TypeScript no Bun, cujo JIT compila o próprio interpretador para código de máquina). O programa recursivo é o que melhor mostra a técnica, porque uma chamada é onde um interpretador de árvore faz mais trabalho extra: aloca um ambiente e resolve cada nome por busca. A tabela, a máquina e os comandos exatos estão em `results/results.md`.

## Como rodar

```sh
./setup-unix-bytecode-vm.sh                                       # constrói, checa formato, lint, testes
docker compose run --rm vm disasm ../examples/closures.mini       # imprime o bytecode de um programa
docker compose run --rm vm run ../examples/closures.mini          # executa um programa
bun run bench -- --project projects/compilers/bytecode-vm         # benchmark, a partir da raiz do repositório
```

## Critérios de aceite

| Item | Critério | Onde é verificado |
| --- | --- | --- |
| MP-COMP-3.1 | um disassembler imprime bytecode legível, conferido por testes de snapshot | `rust/tests/disassembler.rs`, `rust/tests/snapshots/` |
| MP-COMP-3.2 | os programas de exemplo do MP-COMP-2 dão a mesma saída | `rust/tests/examples.rs` contra `examples/*.out` |
| MP-COMP-3.3 | tabela para um laço e uma função recursiva, com máquina e versões registradas | `results/results.md` |

## Tópicos relacionados do quiz

- `compilers` / `compiler-structure`
- `compilers` / `intermediate-code-generation`
- `compilers` / `code-generation`
- `compilers` / `run-time-environments`
- `compilers` / `interpreters-vms-jit`
