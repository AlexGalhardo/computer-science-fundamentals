# bytecode-vm

> English version: [README.md](README.md)

Um compilador da árvore sintática da mini linguagem para bytecode de pilha, e a máquina virtual que o executa, em Rust. Ensina **por que bytecode roda mais rápido do que percorrer uma árvore**: o compilador decide com antecedência o que o interpretador de árvore decide de novo a cada visita (a qual variável um nome se refere, para onde o controle vai em seguida), e sobra para a máquina um vetor plano de instruções pequenas e uma pilha.

Este é o terceiro passo da trilha de compiladores. A linguagem vem do [mini-language-parser](../mini-language-parser) (MP-COMP-1) e o comportamento de referência vem do [tree-walking-interpreter](../tree-walking-interpreter) (MP-COMP-2).

Explicação completa: [docs/pt/compilers/bytecode-vm.md](../../../docs/pt/compilers/bytecode-vm.md).

## Tópicos do quiz que ele demonstra

- `compilers` / `compiler-structure`: tradução de uma árvore para código pós-fixo de uma máquina de pilha.
- `compilers` / `intermediate-code-generation`: fluxo de controle como saltos, backpatching de saltos para frente.
- `compilers` / `code-generation`: código para uma máquina de pilha.
- `compilers` / `run-time-environments`: quadros de chamada em uma pilha, variáveis que sobrevivem à sua chamada.
- `compilers` / `interpreters-vms-jit`: bytecode, o laço de despacho, bytecode contra caminhamento na árvore.

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-bytecode-vm.sh        # Linux e macOS
./setup-windows-bytecode-vm.ps1    # Windows
```

O script constrói a imagem e roda a checagem do formatador, o linter e os testes. Depois:

```sh
docker compose run --rm vm disasm ../examples/closures.mini    # imprime o bytecode
docker compose run --rm vm run ../examples/closures.mini       # executa o programa
```

## Estrutura

| Caminho | O que é |
| --- | --- |
| `rust/src/lexer.rs`, `parser.rs`, `ast.rs` | o front end do MP-COMP-1, portado para Rust (mesma gramática, mesma tabela de precedência) |
| `rust/src/compiler.rs` | árvore para bytecode: resolução de posições, saltos e backpatching, closures |
| `rust/src/chunk.rs` | o conjunto de instruções, o chunk compilado e o disassembler |
| `rust/src/vm.rs` | a máquina de pilha: laço de despacho, quadros de chamada, upvalues |
| `rust/src/value.rs` | valores de execução, funções compiladas, closures |
| `rust/tests/snapshots/` | programas e a listagem de bytecode que cada um deve gerar |
| `examples/` | os programas de exemplo e as saídas esperadas do MP-COMP-2 |
| `bench/` | os dois programas de benchmark, executados pelas duas implementações |
| `baseline-ts/` | o interpretador de árvore do MP-COMP-2, usado apenas como base de comparação do benchmark |
| `results/` | resultados de benchmark versionados |

Rust na imagem fixada `rust:1.99.0-slim-trixie`, sem dependências.

**Uma definição de linguagem, copiada.** Um mini-projeto precisa ser construído sozinho, então nada é importado entre mini-projetos. `examples/` (programas e saídas esperadas) e `baseline-ts/src/` são cópias dos arquivos do `tree-walking-interpreter`. O front end em Rust é um porte do front end em TypeScript, e a suíte de exemplos é o que mantém os dois de acordo. Ele para no primeiro erro de sintaxe: reportar vários é a lição do MP-COMP-1.

## O bytecode

```sh
docker compose run --rm vm disasm ../rust/tests/snapshots/control-flow.mini
```

```text
== script ==
0000    1  CONSTANT                0  ; 0
0001    |  DEFINE_GLOBAL           0  ; i
0002    2  GET_GLOBAL              0  ; i
0003    |  CONSTANT                1  ; 3
0004    |  LESS
0005    |  JUMP_IF_FALSE          23  ; -> 0023
0006    3  GET_GLOBAL              0  ; i
0007    |  CONSTANT                2  ; 2
0008    |  MODULO
...
0022    |  JUMP                    2  ; -> 0002
0023    |  NIL
0024    |  RETURN
```

Cada linha é o índice da instrução, sua linha no código-fonte (`|` quando não muda), seu nome, seu operando, e a que o operando se refere. `i < 3` é "empilhe `i`, empilhe `3`, `LESS`": operandos primeiro, operador por último. O `while` são dois saltos.

## Testes

```sh
docker compose run --rm rust-test
```

- **Testes de snapshot** (`rust/tests/disassembler.rs`): quatro programas precisam gerar as listagens versionadas em `rust/tests/snapshots/`.
- **Suíte de exemplos** (`rust/tests/examples.rs`): todo programa do MP-COMP-2 precisa imprimir exatamente o seu arquivo `.out`.
- Closures (compartilhadas, aninhadas, uma por iteração de laço), `return` de dentro de blocos aninhados, curto-circuito, e os mesmos erros de execução do interpretador, com a mesma linha e coluna.

## Benchmark

```sh
bun run bench -- --project projects/compilers/bytecode-vm    # a partir da raiz do repositório
```

Os dois programas em `bench/` rodam nesta máquina virtual (`rust`) e no interpretador de árvore (`ts`). `loop` soma `i % 7` por `n` iterações. `recursion` chama uma função cerca de `2n` vezes. As duas implementações imprimem o mesmo checksum. Trecho medido, em milissegundos, de [`results/results.md`](results/results.md) (máquina, versões e comandos estão registrados lá):

| Programa | n | Caminhamento na árvore (TypeScript no Bun) | Bytecode (Rust) | Razão |
| --- | ---: | ---: | ---: | ---: |
| `loop` | 100.000 | 36,0 | 17,9 | 2,0× |
| `loop` | 1.000.000 | 376 | 194 | 1,9× |
| `recursion` | 100.000 | 64,5 | 19,6 | 3,3× |
| `recursion` | 1.000.000 | 672 | 136 | 4,9× |

O pico de memória foi de cerca de 2 MiB para a máquina virtual e de 58 a 98 MiB para o interpretador no Bun.

Como ler: as duas linhas diferem na técnica **e** na linguagem, e o Bun compila o próprio interpretador para código de máquina com seu JIT, o que reduz a diferença no laço simples. A diferença maior em `recursion` é onde as técnicas mais se distinguem: uma chamada no interpretador de árvore aloca um ambiente (uma tabela hash) e procura nomes em uma cadeia deles, e uma chamada na máquina virtual apenas move a base de uma janela da pilha. Os números dependem da máquina, e as execuções tiveram ruído, então compare as ordens de grandeza e não as casas decimais.
