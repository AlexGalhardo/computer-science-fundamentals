# flame-graph

> English version: [README.md](README.md) · Versión en español: [README.es.md](README.es.md)

Um serviço está lento e o código parece certo. Para onde vai o tempo? Este mini-projeto tem dois serviços HTTP pequenos, um em Go e um em TypeScript (Bun), cada um com um **caminho quente escondido**: uma linha que parece uma consulta barata e que, na verdade, é a maior parte do trabalho. Um **perfil de CPU** tirado sob carga, desenhado como um **flame graph**, aponta para a função. Depois a correção é aplicada e um **benchmark de antes e depois** mede quanto ela valeu.

Código: MP-OBS-4. Explicação completa: [docs/pt/observability/flame-graph.md](../../../docs/pt/observability/flame-graph.md).

```text
gerador de carga --> go-server  GET /before/report   (compila uma expressão regular para cada linha de log)
                                GET /after/report    (compilada uma vez)
                                GET /debug/pprof/profile?seconds=5      -> perfil de CPU (pprof)
                 --> ts-server  GET /before/quote    (reconstrói um índice de preços para cada linha do pedido)
                                GET /after/quote     (construído uma vez)
                                GET /debug/cpuprofile?seconds=5         -> perfil de CPU (.cpuprofile)

perfil de CPU --> pilhas dobradas (uma linha por pilha de chamadas, com a contagem de amostras) --> flame graph em SVG
```

## O que os flame graphs mostram

As quatro figuras são geradas por `docker compose run --rm flame` e estão versionadas em [results/](results/), junto com as pilhas dobradas a partir das quais foram desenhadas.

Go, antes da correção. A caixa roxa é `compileRegex`: 90,5% das amostras tiradas dentro do handler.

![Go, antes da correção](results/flame-go-before.svg)

Go, depois da correção. `compileRegex` sumiu e o handler virou uma torre fina: a maior parte do que sobrou é casar as linhas com o padrão e escrever a resposta.

![Go, depois da correção](results/flame-go-after.svg)

TypeScript, antes da correção. `buildPriceIndex` ocupa 99,4% do handler.

![TypeScript, antes da correção](results/flame-ts-before.svg)

TypeScript, depois da correção.

![TypeScript, depois da correção](results/flame-ts-after.svg)

| Serviço | Variante | Amostras | Dentro do handler | Dentro da função quente | Fatia do handler |
| --- | --- | --- | --- | --- | --- |
| Go | antes | 414 | 296 | 268 | 90,5% |
| Go | depois | 297 | 225 | 0 | 0,0% |
| TypeScript (Bun) | antes | 2708 | 2689 | 2673 | 99,4% |
| TypeScript (Bun) | depois | 238 | 148 | 0 | 0,0% |

Fonte: [results/profile.md](results/profile.md). Função quente: `flame-graph/report.compileRegex` em Go, `buildPriceIndex` em TypeScript.

### Como ler um flame graph

- Cada caixa é uma função. A caixa **acima** dela é uma função que ela chamou, então uma coluna é uma pilha de chamadas, com a raiz embaixo.
- A **largura** de uma caixa é a sua fatia das amostras: a própria função mais tudo o que ela chamou.
- O **eixo x não é tempo**. Caixas irmãs são ordenadas por nome. Esquerda e direita não significam nada, e uma caixa não "acontece antes" da que está à sua direita.
- Uma caixa larga sem nada em cima (um **platô**) é onde a CPU realmente estava: aquela largura é o tempo próprio da função (self time, ou `flat` no pprof). Uma caixa larga coberta pelos filhos apenas repassou o tempo (`cum` no pprof).
- As cores não significam nada; só diferenciam vizinhos. Aqui uma função está pintada de roxo, como um resultado de busca.
- Procure a caixa mais larga que é sua e que você não esperava que fosse larga. Na figura do Go os platôs estão dentro de `regexp/syntax`, a biblioteca padrão, que você não tem como corrigir. Descendo a torre, a primeira caixa da aplicação é `compileRegex`: essa é a chamada a remover.

Um perfil não é um trace. Um trace segue **uma requisição** entre serviços e mostra para onde foi o tempo de relógio dela, incluindo as esperas. Um perfil de CPU soma **todas as requisições** de um processo e mostra quais funções estavam na CPU; o tempo esperando um banco de dados não aparece nele.

## Antes e depois

Gerado por `docker compose run --rm bench`, versionado em [results/results.md](results/results.md) e [results/results.json](results/results.json). Requisições por segundo: mediana de 5 execuções de 5 s, com a execução mais lenta e a mais rápida.

| Serviço | Runtime | Antes | Depois | Fator |
| --- | --- | --- | --- | --- |
| Go | go1.27.1 | 222 (191 a 246) | 3133 (2666 a 3994) | **14,1x** |
| TypeScript (Bun) | bun 1.4.2 | 405 (398 a 430) | 22894 (20947 a 24549) | **56,5x** |

A correção deixa o serviço Go **14,1 vezes** e o serviço TypeScript **56,5 vezes** mais rápido nesta carga.

Como foi medido: AMD Ryzen 7 5700X3D (16 CPUs lógicas, 15,6 GiB), Docker no WSL2, cada servidor limitado a 1 CPU e 256 MB, um gerador de carga de laço fechado com 16 conexões na rede interna do docker-compose, 2 s de aquecimento descartados. A máquina estava compartilhada com outras cargas durante a medição, e por isso a dispersão entre as execuções é grande (até 42% da mediana no Go). Duas outras execuções completas na mesma máquina deram 14,7x e 24,3x para o Go e 57,7x e 44,0x para o TypeScript: leia o fator como "mais de dez vezes", não como uma constante. Ele pertence a esta carga (300 linhas de log, um pedido de 200 linhas sobre 400 produtos) e a esta máquina.

## Tópicos do quiz que ele demonstra

- `observability` / `profiling`: o que um profiler de CPU por amostragem mede, como ler um flame graph (largura, o eixo x, platôs), tempo flat contra cumulativo, `net/http/pprof`
- `observability` / `three-signals`: um perfil contra um trace, e o que cada um consegue e não consegue responder

## Rodar

O único requisito é o Docker.

```sh
./setup-unix-flame-graph.sh        # Linux e macOS
./setup-windows-flame-graph.ps1    # Windows
```

O script constrói as duas imagens, roda os testes unitários das duas linguagens, e depois carrega e perfila os dois serviços e confere que os flame graphs novos apontam para a função quente. Essa execução ao vivo grava em `out/`, que o git ignora. Tudo é removido no fim.

## Demo

```sh
docker compose run --rm flame     # carga + perfis de CPU + pilhas dobradas + os quatro flame graphs em SVG
docker compose run --rm bench     # vazão antes e depois
docker compose down -v
```

O `flame` roda três etapas em ordem (`capture`, `go-fold`, `flame`) e reescreve `results/*.folded`, `results/flame-*.svg` e `results/profile.md`. Ele termina com erro quando um perfil "before" não coloca mais de 50% das amostras do handler na função quente, ou quando um perfil "after" ainda tem 5% ou mais. O `bench` reescreve `results/results.md` e `results/results.json`. Abra os arquivos SVG em um navegador e passe o mouse sobre uma caixa para ver o nome, as amostras e a fatia.

Os perfis brutos ficam em `profiles/` (ignorada pelo git). Os do Go abrem na ferramenta padrão, por exemplo `go tool pprof -top profiles/go-before.pb.gz`, e os do TypeScript (`.cpuprofile`) abrem no painel Performance do Chrome DevTools.

## Testes

```sh
docker compose run --rm go-test
docker compose run --rm ts-test
```

Os dois rodam sem rede.

- Go: `gofmt`, `go vet` e `go test`. As duas variantes devolvem o mesmo resumo; o parser da saída do `go tool pprof -traces` inverte as pilhas e soma as repetidas.
- TypeScript: `tsc --noEmit` e `bun test`. As duas variantes devolvem o mesmo orçamento; as pilhas dobradas são lidas e escritas de volta; a árvore de chamadas de um `.cpuprofile` vira pilhas dobradas sem perder amostra; o SVG tem uma caixa por quadro com largura proporcional às amostras, a raiz embaixo, nomes escapados e XML bem formado; o gerador de carga recusa um alvo que não é local; e, nos perfis **versionados**, a função quente ocupa mais de 50% do handler antes da correção e menos de 5% depois, e cada SVG versionado é exatamente o que o renderizador desenha a partir do seu perfil versionado.

## Estrutura

| Caminho | O que é |
| --- | --- |
| `go/report/` | O resumo de logs em duas variantes, `SummarizeBefore` (caminho quente em `compileRegex`) e `SummarizeAfter` |
| `go/cmd/server/` | Servidor HTTP com as duas rotas e o `net/http/pprof` |
| `go/fold/`, `go/cmd/fold/` | Transforma um perfil de CPU do pprof em pilhas dobradas, por meio do `go tool pprof -traces` |
| `ts/src/pricing.ts` | O orçamento do pedido em duas variantes, `quoteBefore` (caminho quente em `buildPriceIndex`) e `quoteAfter` |
| `ts/src/app.ts`, `ts/src/profiler.ts` | Servidor HTTP com as duas rotas e um endpoint de perfil de CPU feito com `node:inspector` |
| `ts/src/folded.ts` | Pilhas dobradas: leitura, escrita e a conversão a partir de `.cpuprofile` |
| `ts/src/svg.ts` | O renderizador de flame graph, usado pelas duas linguagens |
| `ts/src/load.ts`, `ts/src/target.ts` | Gerador de carga de laço fechado que recusa qualquer alvo que não seja local |
| `ts/src/capture.ts`, `ts/src/flame.ts`, `ts/src/bench.ts` | Os três comandos do laboratório |
| `results/` | Pilhas dobradas, flame graphs em SVG, tabela dos perfis e benchmark, todos versionados |

## Observações e limites

- A carga é enviada apenas para `go-server` e `ts-server`, em uma rede interna do docker-compose. Os hosts permitidos são uma lista fechada em `ts/src/target.ts`, e nenhuma porta é publicada no host.
- Os endpoints de profiling revelam detalhes internos. Eles só são alcançáveis dentro da rede interna do laboratório; em um serviço real nunca podem ser públicos.
- Na figura "before" do TypeScript, `quoteBefore` não aparece entre `handleQuoteBefore` e `quote`: a última ação dela é uma chamada em posição de cauda, e o JavaScriptCore pode reaproveitar o quadro de pilha para uma chamada assim. Um profiler mostra as pilhas que existem em tempo de execução, que nem sempre são as do código-fonte.
- As figuras do TypeScript são torres curtas porque o profiler do JavaScript reporta só funções JavaScript: o código nativo do `Map` dentro de `buildPriceIndex` é contado como tempo próprio dela. Ele também só amostra enquanto há JavaScript rodando, então o perfil "after" tem poucas amostras: o servidor fica quase sempre ocioso ou dentro de E/S nativa.
- O profiling de CPU no Bun 1.4.2 foi conferido no contêiner antes do uso: o `node:inspector` com `Profiler.start` e `Profiler.stop` funciona e devolve uma árvore de chamadas `.cpuprofile`.

## Versões e dependências

| O quê | Versão |
| --- | --- |
| Imagem Go | `golang:1.27.1-bookworm`, só a biblioteca padrão (nenhuma dependência de módulo) |
| Imagem Bun | `oven/bun:1.4.2` |
| `zod` | 4.6.5 (validação do ambiente, da query string e do perfil) |
| `typescript`, `@types/bun` | 7.0.2, 1.4.2 (só checagem de tipos) |

Nenhuma dependência fora da pilha do repositório. O renderizador de flame graph e o gerador de carga são escritos aqui, de propósito: os dois são curtos, e lê-los faz parte da lição.
