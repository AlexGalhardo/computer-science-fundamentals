# Decisões do projeto

> English version: [docs/en/decisions.md](../en/decisions.md) · Versión en español: [docs/es/decisions.md](../es/decisions.md)
>
> Nota (2026-10-08): a pasta `references/` citada neste documento foi removida do repositório e do histórico. As referências de estudo estão em [REFERENCES.pt-BR.md](../../REFERENCES.pt-BR.md).

Decisões tomadas no brainstorming da Fase 2, em 2026-10-07. Elas são a entrada para o `PLAN.md`. A lista de miniprojetos por área está no [catálogo de miniprojetos](mini-project-catalog.md), o desenho do quiz em [quiz.md](quiz.md), e as perguntas feitas com as opções descartadas no [registro do brainstorming](brainstorming.md).

## Quiz

O produto principal do repositório é um **quiz**: um app único que cobre todas as áreas, com 5 alternativas por pergunta e a explicação do conceito exibida ao lado da pergunta depois da resposta. Os miniprojetos continuam no plano, e cada explicação aponta para o miniprojeto que demonstra o conceito. Pelo menos 100 perguntas por área, em inglês, português e espanhol. Desenho completo em [quiz.md](quiz.md).

O app do quiz precisa ter i18n (inglês, português e espanhol), alternância de tema claro e escuro e layout mobile friendly, construído com Next.js SSG e Tailwind CSS v4.

## Teoria e prática

- **Conteúdo só de teoria** ganha um quiz web bem completo, cobrindo cada aspecto do conteúdo, e nenhum miniprojeto. Vale para Eletrônica e Engenharia de software.
- **Conteúdo técnico que pode ser mostrado com CLI ou página web** ganha exemplos práticos executáveis (Docker, shell scripts) **e** o quiz. Um complementa o outro. Vale para as outras 29 áreas.

## Estrutura

| Tema | Decisão | Motivo |
| --- | --- | --- |
| Organização das pastas | `projects/<área>/<miniprojeto>/`, com uma subpasta por linguagem (`ts/`, `go/`, `rust/`) | O mesmo conceito fica junto e as linguagens podem ser comparadas lado a lado |
| Linguagens por miniprojeto | Uma implementação de referência em TypeScript, mais as linguagens em que a lição muda | Implementar tudo nas 7 linguagens multiplica o trabalho sem ensinar mais |
| Ambiente | Tudo roda em Docker, com imagens de versão fixa. Os scripts de setup exigem só Docker. Toolchain local é opcional | Sete linguagens na mesma máquina é de onde vem o "funciona na minha máquina" |
| README | Três arquivos por miniprojeto: `README.md` (inglês), `README.pt-BR.md` (português) e `README.es.md` (espanhol, adicionado em 2026-10-08) | Cada leitor recebe um documento completo em uma língua |
| Comentários de código | Trilíngues (`EN`, `PT`, `ES`), um bloco por conceito, não linha a linha | Didático sem dobrar o tamanho do código |
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

Outras quatro vieram dos livros: eletrônica, arquitetura de software, teoria de bancos de dados e engenharia de software. O plano tem 31 áreas.

## Imagens

As 120 imagens de `references/images/` não são rastreadas pelo git. Várias são infográficos de terceiros, que não podem ser redistribuídos sob MIT. A pasta está no `.gitignore` e fica só na máquina do autor.

## Ordem de trabalho

- **Quiz primeiro**: o app do quiz e 5 áreas completas (100 perguntas cada), depois as demais áreas em levas de 5.
- **Primeira leva de miniprojetos** (5 miniprojetos, uma worktree cada): corrida de ordenação, lab de race condition, lab de SQL injection, lexer e parser da mini linguagem, comparação de filas.
- **Depois, largura primeiro**: um miniprojeto por área até todas terem pelo menos um, e só então aprofundar.
