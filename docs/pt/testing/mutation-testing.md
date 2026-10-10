# Teste de mutação (MP-TEST-3)

> English version: [docs/en/testing/mutation-testing.md](../../en/testing/mutation-testing.md) · Versión en español: [docs/es/testing/mutation-testing.md](../../es/testing/mutation-testing.md)

Mini-projeto: [`projects/testing/mutation-testing`](../../../projects/testing/mutation-testing/README.pt-BR.md). Tópico do quiz: `coverage-mutation`.

## O conceito

A **cobertura** responde "quais linhas os testes executaram?". Ela não responde "os testes perceberiam se esta linha estivesse errada?". Um teste sem nenhuma asserção executa uma linha tão bem quanto o melhor teste do mundo.

O **teste de mutação** faz a segunda pergunta diretamente:

```text
programa original ---- mutar um token ----> mutante           (a + b  vira  a - b)
                                               |
                                      rodar a suíte de testes
                                               |
                      +------------------------+------------------------+
                      |                                                 |
            um teste falha: MORTO                         todos passam: SOBREVIVENTE
          a suíte percebeu o bug                    a suíte aceita o bug como correto
```

```text
pontuação de mutação = mutantes mortos / todos os mutantes
```

Um mutante é um modelo de um deslize real: um operador errado, um limite deslocado em um, uma constante errada. Uma suíte que mata a maioria dos mutantes provavelmente perceberia a maioria dos deslizes do mesmo tipo.

## O que o mini-projeto mostra

Um módulo (`shipping.ts`, o preço de uma entrega) e duas suítes:

| | Suíte fraca | Suíte forte |
| --- | --- | --- |
| Cobertura de linhas | 100% | 100% |
| Asserção típica | `typeof cents === "number"`, `toBeGreaterThan(0)` | `toBe(1700)`, valores em cada limite |
| Mutantes mortos | 4 de 19 | 18 de 19 |
| Pontuação de mutação | 21,1% | 94,7% |

A coluna de cobertura é idêntica. A última linha não. Essa é a lição inteira: a cobertura é uma condição necessária (uma linha nunca executada certamente não é testada) e não uma condição suficiente.

## Lendo os sobreviventes

Cada mutante sobrevivente é uma pergunta que a suíte não fez. Três exemplos do relatório:

| Mutante | Por que a suíte fraca o deixa viver | O teste que o mata |
| --- | --- | --- |
| `150` para `151` (preço por kg) | o resultado continua sendo um número positivo | `expect(shippingCents(3 kg)).toBe(650)` |
| `>=` para `>` (distância de 100 km) | nenhum teste usa exatamente 100 km | um teste em 99 km e um em 100 km |
| `<=` para `<` (limite de 30 kg) | nenhum teste usa exatamente 30 kg | `isAccepted(30 kg)` é `true`, `isAccepted(30,5 kg)` é `false` |

Os mutantes de limite só morrem no valor-limite. O teste de mutação e a análise de valores-limite apontam para os mesmos testes, vindos de duas direções.

## O mutante equivalente

```ts
if (parcel.weightKg > FREE_WEIGHT_KG) {                       // mutante: >=
	cents = cents + (parcel.weightKg - FREE_WEIGHT_KG) * CENTS_PER_EXTRA_KG;
}
```

Com `>=` o desvio também é tomado em exatamente 2 kg, onde ele soma `(2 - 2) * 150 = 0`. O mutante é um texto diferente com o mesmo comportamento, então nenhum teste consegue matá-lo. Decidir se um mutante é equivalente é indecidível no caso geral, então as ferramentas informam a pontuação bruta e as pessoas revisam os sobreviventes. Uma meta de 100% nem sempre é alcançável, e persegui-la às cegas é tão errado quanto perseguir um número de cobertura.

## Como o mutador funciona

`ts/src/mutator.ts`, cerca de 100 linhas, sem dependência:

1. **Tokenizar.** Uma expressão regular divide o código em comentários, strings, identificadores, números, operadores e o resto. Os tokens mais longos vêm antes, então `>=` é um token só.
2. **Mutar.** Para cada operador ou número, produzir uma cópia do código com aquele único token trocado (`+` e `-` trocados, `<` para `<=`, `&&` e `||` trocados, `!` removido, `n` para `n + 1`).
3. **Rodar.** Para cada mutante, gravar o arquivo em uma cópia de rascunho do projeto e rodar uma suíte, com limite de tempo, porque um mutante pode criar um laço sem fim.
4. **Contar.** Código de saída 0 significa sobrevivente, qualquer outro significa morto.

Antes de qualquer mutante, cada suíte roda no código original: uma suíte que já está vermelha "mataria" tudo pelo motivo errado.

## Custo e limites

- O custo é `mutantes x tempo da suíte`. Aqui são 19 mutantes e uma suíte de milissegundos. Em um projeto real são milhares de mutantes, então as ferramentas rodam só os testes que cobrem a linha mutada, param no primeiro teste que falha e mutam só o código alterado.
- Este mutador trabalha em tokens, não na árvore sintática. Ele não distingue um genérico `<T>` de uma comparação. Tem um punhado de operadores e nenhum que remova um comando.
- Uma pontuação alta diz que as asserções são sensíveis a mudanças pequenas. Ela não diz nada sobre requisitos que faltam: código que nunca foi escrito não tem mutantes.

## Como rodar

```sh
./setup-unix-mutation-testing.sh        # Linux e macOS
./setup-windows-mutation-testing.ps1    # Windows
```
