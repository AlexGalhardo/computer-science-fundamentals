# Decisões do projeto

> English version: [docs/en/decisions.md](../en/decisions.md)

Decisões tomadas no brainstorming da Fase 2, em 2026-10-07. Elas são a entrada para o `PLAN.md`. A lista de miniprojetos por área está no [catálogo de miniprojetos](mini-project-catalog.md).

## Estrutura

| Tema | Decisão | Motivo |
| --- | --- | --- |
| Organização das pastas | `projects/<área>/<miniprojeto>/`, com uma subpasta por linguagem (`ts/`, `go/`, `rust/`) | O mesmo conceito fica junto e as linguagens podem ser comparadas lado a lado |
| Linguagens por miniprojeto | Uma implementação de referência em TypeScript, mais as linguagens em que a lição muda | Implementar tudo nas 7 linguagens multiplica o trabalho sem ensinar mais |
| Ambiente | Tudo roda em Docker, com imagens de versão fixa. Os scripts de setup exigem só Docker. Toolchain local é opcional | Sete linguagens na mesma máquina é de onde vem o "funciona na minha máquina" |
| README | Dois arquivos por miniprojeto: `README.md` (inglês) e `README.pt-BR.md` (português) | Cada leitor recebe um documento completo em uma língua |
| Comentários de código | Bilíngues, um bloco por conceito, não linha a linha | Didático sem dobrar o tamanho do código |
| Dashboards | Uma página estática por miniprojeto (HTML + Tailwind CSS v4 lendo o JSON de resultados). Next.js só onde o conceito precisa de servidor | Simples de abrir e de manter |

## Benchmarks

- Um contrato para toda implementação: ler a mesma entrada e imprimir JSON com pelo menos `n`, tempo decorrido e memória.
- O [hyperfine](https://github.com/sharkdp/hyperfine) mede os processos. É a única ferramenta de benchmark adicionada à stack.
- Um runner compara os arquivos JSON e escreve a tabela de resultados. Os resultados são commitados em Markdown.
- Os testes de carga continuam com k6, e somente contra serviços locais.

## Escopo por área

| Área | Decisão |
| --- | --- |
| Compiladores | Lexer, parser, AST e interpretador de árvore em TypeScript, uma VM de bytecode em Rust e um motor de regex (NFA para DFA) em Go. Sem geração de WebAssembly ou de código nativo |
| Design patterns | Uma seleção de cerca de 10 padrões que aparecem em back ends web: Strategy, Observer, Factory, Adapter, Decorator, Repository, Command, State, Builder, e Singleton com os motivos para evitá-lo |
| Segurança | Um lab isolado por falha, cada um com seu docker-compose em rede interna: versão vulnerável, versão corrigida e um teste que prova a correção |
| Observabilidade | OpenTelemetry com Prometheus, Grafana, Loki e Tempo, tudo local em docker-compose. Essas quatro ferramentas entram na stack |

## Projetos legados

`references/projects/load-stress-tests` e `references/projects/message-queues-pubsub` são **reconstruídos como miniprojetos novos**, não portados. O código antigo fica em `references/` para consulta. Nas versões reconstruídas, a API serverless roda no LocalStack e os geradores de carga viram cenários k6 locais.

## Áreas extras

Oito áreas sugeridas pelo material importado entraram no plano: cache, rate limiter, sistemas de arquivos, lógica digital, redes, sistemas operacionais, um blockchain didático e CI deste repositório com GitHub Actions.

## Imagens

As 120 imagens de `references/images/` não são rastreadas pelo git. Várias são infográficos de terceiros, que não podem ser redistribuídos sob MIT. A pasta está no `.gitignore` e fica só na máquina do autor.

## Ordem de trabalho

- **Primeira leva** (5 miniprojetos, uma worktree cada): corrida de ordenação, lab de race condition, lab de SQL injection, lexer e parser da mini linguagem, comparação de filas.
- **Depois, largura primeiro**: um miniprojeto por área até todas terem pelo menos um, e só então aprofundar.
