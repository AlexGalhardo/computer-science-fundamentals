# code-smells

> English version: [README.md](README.md) · Versión en español: [README.es.md](README.es.md)

Um catálogo executável de maus cheiros de código. Cada item tem uma versão `before`, que funciona e cheira mal, uma versão `after`, com o mau cheiro removido, e **uma suíte de testes que roda nas duas**. Ele ensina **como reconhecer maus cheiros comuns e removê-los sem mudar o comportamento**: os testes que passam antes da refatoração são os mesmos que passam depois.

Explicação completa: [docs/pt/oop/code-smells.md](../../../docs/pt/oop/code-smells.md).

## O catálogo

| Mau cheiro | O sintoma em `before` | Refatoração em `after` | Linguagem |
| --- | --- | --- | --- |
| [Método Longo](ts/src/long-method) | uma função valida, calcula e formata, dividida por comentários | Extrair Método | TypeScript |
| [Classe Deus](ts/src/god-class) | uma classe guarda estoque, preços, numeração de pedidos, e-mails e o relatório | Extrair Classe | TypeScript |
| [Inveja de Recursos](ts/src/feature-envy) | uma impressora que só lê outros objetos, três pontos adentro | Mover Método | TypeScript |
| [Cirurgia com Espingarda](ts/src/shotgun-surgery) | o formato de dinheiro está copiado em três módulos | um módulo é dono do conhecimento | TypeScript |
| [Obsessão por Primitivos](ts/src/primitive-obsession) | e-mail e telefone são strings, conferidas de novo em cada função | tipos pequenos (objetos de valor) | TypeScript, Java |
| [Cadeia de condicionais sobre um código de tipo](ts/src/conditional-to-polymorphism) | o mesmo `if / else if` sobre o tipo de entrega em três arquivos | Substituir Condicional por Polimorfismo | TypeScript, Java |

O TypeScript é a referência e tem os seis. O Java repete os dois itens em que a linguagem muda a lição: seus tipos são nominais, então dois records que guardam uma `String` cada são tipos diferentes sem trabalho extra, e o compilador recusa argumentos trocados; e `enum` com `interface` é o par idiomático para o exemplo dos condicionais.

## Tópicos do quiz que ele demonstra

- `oop` / `coupling-cohesion-code-smells`: coesão, o que é um mau cheiro, Classe Deus, Inveja de Recursos, Cirurgia com Espingarda, Obsessão por Primitivos, Método Longo e Extrair Método.
- `oop` / `polymorphism-dynamic-dispatch`: trocar uma cadeia de condicionais por uma classe por variante, de modo que uma variante nova seja código novo, e não uma edição.

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-code-smells.sh        # Linux e macOS
./setup-windows-code-smells.ps1    # Windows
```

O script constrói as duas imagens (a checagem de tipos, a de formato e um teste negativo de compilação acontecem no build), roda os testes das duas linguagens e imprime o catálogo.

## Estrutura

| Caminho | O que é |
| --- | --- |
| `ts/src/<smell>/contract.ts` | o comportamento que as duas versões precisam ter, como um tipo |
| `ts/src/<smell>/before.ts` ou `before/` | a versão com o mau cheiro, marcada com `SMELL` em um comentário |
| `ts/src/<smell>/after.ts` ou `after/` | a versão refatorada, marcada com `REFACTORED` |
| `ts/tests/<smell>.test.ts` | a suíte compartilhada, mais o que só a versão refatorada permite |
| `ts/src/demo.ts` | imprime o catálogo com o tamanho de cada versão |
| `java/src/primitive_obsession/`, `java/src/conditional_to_polymorphism/` | os dois itens em Java, as duas versões lado a lado |
| `java/src/tests/SmellTests.java` | as mesmas verificações chamadas uma vez por versão |
| `java/negative/SwappedArguments.java` | um arquivo que não pode compilar |

Imagens: `oven/bun:1.4.2` e `gradle:9.8.0-jdk25` (Spotless 8.10.3 com google-java-format, usado só para conferir o formato). O lado TypeScript tem duas dependências de desenvolvimento, fixadas: `typescript` 7.0.2 e `@types/bun` 1.4.2, as mesmas versões da raiz do repositório. Elas existem para que a imagem possa rodar o `tsc`, que é o que prova as afirmações sobre tipos. Não há dependência de execução.

## Testes

```sh
docker compose run --rm ts-test
docker compose run --rm java-test
```

- **Os mesmos testes nas duas versões.** Toda suíte é escrita contra o contrato e roda uma vez em `before` e uma vez em `after` (`describe.each` em TypeScript, um método chamado duas vezes em Java). 57 testes em TypeScript, 30 verificações em Java.
- **O que só `after` permite.** A regra de frete testada sem um recibo, a regra de estoque testada sem preços nem e-mails, uma etiqueta de endereço sem fatura.
- **O mau cheiro, medido.** Para a Cirurgia com Espingarda um teste lê os fontes e conta os arquivos que contêm o símbolo da moeda: três antes, um depois.
- **Uma variante nova vinda de fora.** No exemplo dos condicionais um quarto tipo de entrega é escrito dentro do arquivo de teste. O checkout refatorado o atende sem edição; a versão com condicionais lança erro.
- **Testes no nível dos tipos.** Em TypeScript uma linha `@ts-expect-error` afirma que passar um `Phone` onde se espera um `Email` não pode compilar, e o build da imagem roda o `tsc`. Em Java o build roda o `javac` sobre `negative/SwappedArguments.java` e falha se o arquivo for aceito.

## Demo

```sh
docker compose run --rm ts-demo
```

```text
== god-class -> Extract Class
  before: 1 file(s), 60 lines of code
  after:  1 file(s), 105 lines of code
  output: To: ana@shop.example | Order ORD-1: 2 x PEN, total 5.00 / To: stock@shop.example | PEN is sold out
  same output in both versions: yes
== shotgun-surgery -> Move the knowledge to one place
  before: 4 file(s), 37 lines of code
  after:  5 file(s), 24 lines of code
  output: Total: R$ 1.234,61
  same output in both versions: yes
```

Tamanho das duas versões, tirado da demo (comentários e linhas em branco não contam):

| Mau cheiro | Antes | Depois |
| --- | --- | --- |
| long-method | 1 arquivo, 45 linhas | 1 arquivo, 46 linhas |
| god-class | 1 arquivo, 60 linhas | 1 arquivo, 105 linhas |
| feature-envy | 1 arquivo, 54 linhas | 1 arquivo, 76 linhas |
| shotgun-surgery | 4 arquivos, 37 linhas | 5 arquivos, 24 linhas |
| primitive-obsession | 1 arquivo, 42 linhas | 1 arquivo, 57 linhas |
| conditional-to-polymorphism | 5 arquivos, 44 linhas | 4 arquivos, 45 linhas |

Só uma refatoração encurtou o código, a que removeu duplicação. As outras mantiveram o tamanho ou cresceram, porque dão nome a coisas que não tinham: um método, uma classe, um tipo. O que melhora é onde uma mudança cai, e a próxima seção mede isso.

## Polimorfismo no lugar de uma cadeia de condicionais: o diff

As duas versões do exemplo de entrega foram estendidas com um quarto tipo, `drone`, em uma cópia de rascunho, e comparadas com `git diff --stat`.

**Antes**, com condicionais: 4 arquivos existentes editados.

```text
 before/cost.ts     | 2 ++
 before/eta.ts      | 2 ++
 before/kind.ts     | 2 +-
 before/tracking.ts | 2 ++
 4 files changed, 7 insertions(+), 1 deletion(-)
```

```diff
--- a/before/kind.ts
-export type Kind = "standard" | "express" | "pickup";
+export type Kind = "standard" | "express" | "pickup" | "drone";
--- a/before/cost.ts
 	} else if (kind === "pickup") {
 		return 0;
+	} else if (kind === "drone") {
+		return 4000 + 2 * grams;
 	}
--- a/before/eta.ts
 	} else if (kind === "pickup") {
 		return 0;
+	} else if (kind === "drone") {
+		return 0;
 	}
--- a/before/tracking.ts
 	} else if (kind === "pickup") {
 		return `PK-${number}`;
+	} else if (kind === "drone") {
+		return `DR-${number}`;
 	}
```

Se uma das três cadeias for esquecida o código ainda compila, e o pedido falha em tempo de execução com `unknown delivery kind: drone`.

**Depois**, com polimorfismo: 1 arquivo novo, nenhum arquivo existente tocado.

```text
 after/drone.ts | 14 ++++++++++++++
 1 file changed, 14 insertions(+)
```

```diff
--- /dev/null
+++ b/after/drone.ts
+import type { DeliveryMethod } from "./delivery-method";
+
+export class Drone implements DeliveryMethod {
+	readonly name = "drone";
+	readonly trackingPrefix = "DR";
+
+	costCents(grams: number): number {
+		return 4000 + 2 * grams;
+	}
+
+	days(): number {
+		return 0;
+	}
+}
```

Se um método for esquecido a classe não compila. O teste "adding a variant" em [`conditional-to-polymorphism.test.ts`](ts/tests/conditional-to-polymorphism.test.ts) mantém essa afirmação conferida: ele declara `Drone` dentro do arquivo de teste, e o `shippingLine` refatorado o atende.

O custo é a imagem no espelho: uma quarta pergunta feita a todo tipo (por exemplo, "tem seguro?") é uma função nova na versão com condicionais, e uma edição na interface e em todas as classes na versão refatorada. O polimorfismo compensa quando tipos são adicionados com mais frequência do que perguntas.
