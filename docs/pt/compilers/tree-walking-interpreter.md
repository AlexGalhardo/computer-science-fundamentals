# Interpretador de árvore

> English version: [docs/en/compilers/tree-walking-interpreter.md](../../en/compilers/tree-walking-interpreter.md) · Versión en español: [docs/es/compilers/tree-walking-interpreter.md](../../es/compilers/tree-walking-interpreter.md)

Mini-projeto MP-COMP-2, em [`projects/compilers/tree-walking-interpreter`](../../../projects/compilers/tree-walking-interpreter). Ensina como uma árvore sintática é executada: ambientes, escopos e closures. A linguagem é a definida no [MP-COMP-1](mini-language-parser.md).

## Executando uma árvore

O parser deixa uma árvore. O jeito mais simples de executá-la é percorrê-la: para executar um nó, execute os filhos necessários e combine os resultados. `1 + 2 * 3` é avaliado de baixo para cima, `2 * 3` primeiro porque está mais fundo na árvore, sem nenhuma regra de precedência restante para aplicar. O avaliador em `ts/src/interpreter.ts` é um `switch` com um caso por tipo de nó, então tem a mesma forma da gramática.

Nada é traduzido: o programa que roda é a própria árvore. Essa é a diferença para um compilador, que traduziria a árvore para outro programa (código de máquina ou bytecode) a ser executado depois.

## Ambientes

Uma variável precisa de um lugar para morar. Um **ambiente** é uma tabela de nomes para valores de um escopo, com um ponteiro para o ambiente do escopo ao redor.

```text
let x = 1;            global:   x = 1, f = <fn f>
fn f(a) {                ▲
	let y = a + x;    call f:   a = 10, y = 11
	{                    ▲
		let x = 5;    block:    x = 5
		print x + y;
	}
}
f(10);
```

- Uma busca começa no ambiente atual e caminha para fora. O primeiro nome encontrado vence, e é por isso que o `x` interno sombreia o global.
- Um bloco cria um ambiente quando começa e o descarta quando termina.
- Uma chamada cria um ambiente para os parâmetros: essa é a ativação da função, o papel que um quadro de pilha faz no código compilado.

## Escopo estático e closures

Quando `f` é chamada, o pai do seu novo ambiente é **o ambiente em que `f` foi definida**, não o ambiente de quem chamou. Isso é escopo estático (léxico): a qual variável um nome se refere pode ser lido no texto do programa. O exemplo `scopes.mini` mostra isso: `show()` imprime o `x` global mesmo quando é chamada de um bloco que tem o seu próprio `x`.

Para tornar isso possível, um valor de função é uma **closure**: o código mais o ambiente que estava ativo quando o comando `fn` foi executado.

```text
fn makeCounter() {
	let count = 0;
	fn increment() { count = count + 1; return count; }
	return increment;
}
let first = makeCounter();
```

Depois que `makeCounter` retorna, seu ambiente normalmente seria lixo. Mas `increment` ainda aponta para ele, então `count` continua vivo, e cada chamada de `makeCounter` cria um `count` separado. Esse é o motivo de os ambientes não poderem morar em uma pilha simples em uma linguagem com closures: uma ativação pode sobreviver à chamada que a criou. Aqui o coletor de lixo do hospedeiro (JavaScript) os libera quando a última closure desaparece.

## Saindo mais cedo

O `return` precisa abandonar todos os blocos e laços entre ele e a chamada. Um interpretador de árvore não tem instrução de salto, então `execute` devolve um pequeno valor de conclusão: `undefined` para "continue", ou `{ returned: value }`, que cada comando ao redor repassa para cima até a chamada recebê-lo.

## Erros de execução

O lexer e o parser rejeitam texto que não é um programa. Alguns erros só aparecem quando o programa roda: um nome que nunca foi declarado, uma chamada com o número errado de argumentos, uma divisão por zero, `1 + "a"`. Todo nó da árvore carrega a linha e a coluna do seu token, então o erro diz onde:

```text
[line 2, column 10] runtime error: expected 2 arguments but got 1
```

## Por que isso é lento

Percorrer uma árvore custa mais do que o trabalho que o programa pede. Cada visita a um nó é um despacho pelo tipo do nó, os nós ficam espalhados na memória, e cada acesso a variável procura na cadeia de ambientes pelo nome em uma tabela hash. O [MP-COMP-3](bytecode-vm.md) compila a mesma árvore para bytecode, resolve as variáveis locais para posições da pilha antes de executar, e mede a diferença.

## Como rodar

```sh
./setup-unix-tree-walking-interpreter.sh                                  # constrói e testa
docker compose run --rm ts-repl                                           # REPL que mantém o estado
docker compose run --rm ts-repl bun run mini ../examples/closures.mini    # executa um programa
```

## Critérios de aceite

| Item | Critério | Onde é verificado |
| --- | --- | --- |
| MP-COMP-2.1 | uma suíte de programas de exemplo imprime a saída esperada | `examples/*.mini` contra `examples/*.out`, em `ts/tests/interpreter.test.ts` |
| MP-COMP-2.2 | testes cobrem variável indefinida, número errado de argumentos e divisão por zero | `ts/tests/interpreter.test.ts` |
| MP-COMP-2.3 | uma sessão gravada define uma função e a chama depois | README do mini-projeto, e o teste de sessão do REPL |

## Tópicos relacionados do quiz

- `compilers` / `compiler-structure`
- `compilers` / `run-time-environments`
- `compilers` / `interpreters-vms-jit`
