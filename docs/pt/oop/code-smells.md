# Catálogo executável de maus cheiros de código

> English version: [docs/en/oop/code-smells.md](../../en/oop/code-smells.md)

Mini-projeto MP-OOP-2, em [`projects/oop/code-smells`](../../../projects/oop/code-smells). Ele ensina a reconhecer maus cheiros comuns e a removê-los. Linguagens: TypeScript e Java.

## Um mau cheiro não é um defeito

Um mau cheiro é um sintoma em código que funciona. O programa dá as respostas certas e os testes passam, mas a estrutura torna a próxima mudança lenta ou arriscada. Por isso cada item deste catálogo tem duas versões com comportamento idêntico, `before` e `after`, e uma suíte de testes que roda nas duas.

Essa suíte compartilhada também é a definição de refatoração: mudar a estrutura sem mudar o comportamento. Se um teste precisa ser editado para a versão nova passar, a mudança não foi uma refatoração.

## Os seis itens

### Método Longo, removido com Extrair Método

`formatReceipt` valida um pedido, calcula subtotal, desconto e frete e monta o texto, tudo em uma função. Os comentários `// validate`, `// discount`, `// shipping` são o sintoma: cada um marca uma função que nunca recebeu nome. Depois da refatoração cada bloco é uma função com nome, e `formatReceipt` se lê como um resumo. O ganho aparece nos testes: a regra do frete pode ser conferida com uma chamada, sem montar um pedido e ler a resposta de dentro de uma string.

### Classe Deus, removida com Extrair Classe

`GodShop` guarda o estoque, conhece os preços, numera os pedidos, escreve e-mails e monta o relatório de vendas. Ela tem cinco motivos para mudar, e qualquer método pode mexer em qualquer campo. Depois da refatoração há quatro classes pequenas (`Inventory`, `PriceList`, `Outbox`, `SalesLedger`), cada uma com estado privado, e um coordenador que as recebe prontas. A coesão subiu: todo campo de uma classe agora é usado por todos os métodos dela. O código ficou mais longo, de 60 para 105 linhas, que é o preço honesto de dar a cada responsabilidade um nome e uma fronteira.

### Inveja de Recursos, removida com Mover Método

`InvoicePrinter.render` não tem dado nenhum. Ele lê `invoice.customer.address.zip` e formata um CEP, multiplica os campos de uma linha, soma as linhas. O comportamento está em uma classe e os dados de que ele precisa estão em outras. Depois da refatoração `Address.label()`, `InvoiceLine.totalCents()` e `Invoice.render()` moram junto dos dados que usam, os campos são privados, e uma etiqueta de envio pode ser produzida sem nenhuma fatura por perto. Isso é "tell, don't ask".

### Cirurgia com Espingarda, removida ao dar um lugar ao conhecimento

Três módulos mostram dinheiro, e cada um carrega sua cópia do formato (símbolo, vírgula decimal, ponto a cada três dígitos), cada uma escrita de um jeito. Trocar a moeda exige achar e editar as três. Depois da refatoração `money.ts` é dono do formato. Um teste lê os arquivos-fonte e conta onde o símbolo da moeda está escrito: três arquivos antes, um depois. Esse número é o tamanho da cirurgia.

### Obsessão por Primitivos, removida com tipos pequenos

Um e-mail e um telefone circulam como strings. Nada diz se uma dada string já foi conferida, então toda função confere de novo, e o compilador não distingue um e-mail de um telefone. Depois da refatoração `Email` e `Phone` são tipos cuja única entrada é uma função que valida, então um valor que existe é válido, e a regra é escrita uma vez.

A lição muda com a linguagem. Os tipos do Java são nominais: `record Email(String value)` e `record Phone(String digits)` são tipos diferentes porque têm nomes diferentes, e o build da imagem prova isso conferindo que o `javac` recusa um arquivo com os argumentos trocados. Os tipos do TypeScript são estruturais: duas classes com uma string pública cada seriam intercambiáveis. Um membro privado é o que torna cada classe compatível só consigo mesma, e uma linha `@ts-expect-error`, conferida pelo `tsc` no build da imagem, prova que a troca deixou de compilar.

### Cadeia de condicionais sobre um código de tipo, removida com polimorfismo

O custo, o prazo e o código de rastreio de uma entrega dependem do tipo dela, e cada um é calculado por sua própria cadeia de `if / else if`. Adicionar um tipo exige editar todas as cadeias. Depois da refatoração cada tipo é uma classe que implementa `DeliveryMethod`, e o checkout chama a interface.

Adicionar um quarto tipo foi medido em uma cópia de rascunho: quatro arquivos existentes editados na versão com condicionais, um arquivo novo e mais nada na refatorada. O diff está no [README](../../../projects/oop/code-smells/README.pt-BR.md#polimorfismo-no-lugar-de-uma-cadeia-de-condicionais-o-diff), e um teste mantém a afirmação verdadeira declarando um tipo novo dentro do arquivo de teste.

A troca não é de graça. Com condicionais, uma pergunta nova sobre todos os tipos é uma função nova. Com polimorfismo, é uma edição na interface e em todas as classes. Escolha pelo que muda com mais frequência.

## Menor não é o objetivo

A demo imprime o tamanho das duas versões de cada item. Só a remoção de duplicação encurtou o código. As outras refatorações mantiveram o tamanho ou cresceram. O que elas mudam é onde uma mudança cai: em um lugar com nome, em vez de vários lugares anônimos.

## Como rodar

```sh
./setup-unix-code-smells.sh        # Linux e macOS
./setup-windows-code-smells.ps1    # Windows
```

Só o Docker é necessário. Os builds das imagens rodam o verificador de tipos, a checagem de formato e o teste negativo de compilação; depois rodam os testes das duas linguagens, e a demo imprime o catálogo.

## Tópicos relacionados do quiz

`oop`: `coupling-cohesion-code-smells`, `polymorphism-dynamic-dispatch`.
