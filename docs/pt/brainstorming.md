# Registro do brainstorming

> English version: [docs/en/brainstorming.md](../en/brainstorming.md)

> Nota (2026-10-08): a pasta `references/` citada neste documento foi removida da árvore e continua no histórico do git (`git show eef7847:references/<caminho>`). As referências de estudo estão em [REFERENCES.pt-BR.md](../../REFERENCES.pt-BR.md).

Registro das perguntas feitas no brainstorming da Fase 2, em 2026-10-07, com a opção escolhida e as descartadas. As decisões consolidadas estão em [decisions.md](decisions.md), o desenho do quiz em [quiz.md](quiz.md) e o backlog em [mini-project-catalog.md](mini-project-catalog.md).

## Contexto usado

- Código, notas e dois projetos legados importados para `references/`.
- Resumos de 254 PDFs (livros, artigos e aulas) em `references/summaries/`. Os livros longos foram resumidos por amostragem do texto.
- Um PDF escaneado (Sistemas Operacionais Modernos, 3ª edição) não pôde ser lido e foi apagado; a 4ª edição do mesmo livro está resumida.

## Rodada 1: estrutura do repositório

| Pergunta | Escolha | Opções descartadas |
| --- | --- | --- |
| Organização das pastas | Por área: `projects/<área>/<miniprojeto>/` | Por linguagem; lista plana |
| Linguagens por miniprojeto | Referência em TypeScript mais as que mudam a lição | Sempre as 7; uma por miniprojeto |
| Ambiente | Tudo em Docker | Toolchain local; os dois caminhos |
| Benchmarks | Contrato JSON + hyperfine | Runner próprio; ferramenta nativa de cada linguagem |
| Dashboards | Página estática por miniprojeto | Um site Next.js único; só CLI |
| Projetos legados | Reconstruir como miniprojetos novos | Portar e adaptar; só referência |
| README e comentários | Dois arquivos + comentário por bloco de conceito | Um arquivo; comentário linha a linha |
| Imagens de `references/images/` | Tirar do git | Manter; manter só as de autoria própria |
| Compiladores | Interpretador + VM de bytecode | Até WebAssembly; até código nativo; só front-end |
| Design patterns | Seleção de cerca de 10 de backend web | Catálogo GoF completo; só dentro de outros miniprojetos |
| Labs de segurança | Um lab isolado por falha | App único com todas as falhas; os dois |
| Observabilidade | OpenTelemetry + Prometheus, Grafana, Loki, Tempo | OpenTelemetry + Jaeger + Prometheus; só saída em console |
| Áreas extras | Todas as oito: cache, rate limiter, sistemas de arquivos, lógica digital, redes, sistemas operacionais, blockchain, CI | nenhuma descartada |
| Primeira leva de miniprojetos | Mistura de áreas: ordenação, race condition, SQL injection, lexer + parser, filas | Foco em backend web; foco em computação clássica |
| Ordem depois da primeira leva | Largura primeiro | Profundidade primeiro; escolher a cada leva |

## Rodada 2: quiz

Depois da leitura dos PDFs, a ideia principal passou a ser um quiz: perguntas com 5 alternativas e, após a resposta, a explicação do conceito, em um grid de duas colunas (pergunta à esquerda, explicação à direita).

| Pergunta | Escolha | Opções descartadas |
| --- | --- | --- |
| Papel do quiz | Quiz central + miniprojetos | Quiz primeiro e miniprojetos depois; só o quiz; um quiz por miniprojeto |
| Tela | Uma pergunta por tela | Lista rolável com painel fixo; pergunta por tela com mapa lateral |
| Tecnologia | Next.js com export estático | HTML puro; Next.js + API + banco |
| Conteúdo da explicação | Os quatro itens: conceito, por que cada errada é errada, exemplo de código ou diagrama, link para miniprojeto e fonte | nenhum descartado |
| Volume | Pelo menos 100 perguntas por área, buscando cobrir todo o conteúdo dos livros (resposta do autor) | 10, 20 ou 30 por área; variável |
| Língua | PT e EN desde o início | PT primeiro; só PT |
| Áreas novas | As quatro: eletrônica, arquitetura de software, bancos de dados (teoria), engenharia de software | nenhuma descartada |
| Recursos | Os quatro: progresso salvo, revisar as erradas, nível de dificuldade, embaralhamento | nenhum descartado |
| Fonte das perguntas | Mapa de capítulos + conhecimento próprio | Recolocar o PDF na hora de cada área; misto |
| Produção | App + 5 áreas completas, depois levas de 5 | Todas com 20 e depois completar; tudo de uma vez |
| Revisão | Revisor independente + validação automática | Só validação de formato; o autor revisa tudo |

## Rodada 3: instruções para o plano final

Dadas pelo autor ao pedir o `PLAN.md` final.

| Tema | Instrução |
| --- | --- |
| Conteúdo só de teoria | Um quiz web bem completo, cobrindo cada aspecto do conteúdo, sem miniprojeto. Aplicado a Eletrônica e Engenharia de software |
| Conteúdo técnico | Exemplos práticos executáveis (Docker, shell scripts, CLI ou web) mais o quiz, um complementando o outro. Aplicado às outras 29 áreas |
| Recursos do quiz | i18n em português e inglês, alternância de tema claro e escuro, mobile friendly, construído com Next.js SSG e Tailwind CSS v4 |
| 5 primeiras áreas do quiz | Big O e análise de algoritmos, estruturas de dados, sistemas operacionais, redes, bancos de dados (teoria) |

## Ideias que os resumos acrescentaram

Entraram no catálogo de miniprojetos, na seção "Ideias vindas dos livros e das aulas".

- **Sistemas operacionais:** simulador de escalonamento de CPU, paginação e TLB, alocador de memória, detector de deadlock com algoritmo do banqueiro, mini shell.
- **Redes:** janela deslizante sobre canal com perda, mini TCP sobre UDP, ALOHA e CSMA/CD, resolvedor DNS, calculadora de sub-redes.
- **Bancos de dados:** mini SGBD com junções, ferramenta de normalização, ordenação externa, índices em disco.
- **Compiladores:** coletor de lixo, otimizações sobre código de três endereços, multiplicação de matrizes em blocos.
- **Análise de algoritmos:** teorema mestre interativo, cota Ω(n lg n), quicksort híbrido.
- **Lógica digital e eletrônica:** Karnaugh, ALU só com NAND, mini CPU de 4 bits, calculadoras de circuitos.
- **Testes e design:** kata do dinheiro, mini xUnit, catálogo de code smells, aplicação em arquitetura limpa.

## Pontos em aberto

Nenhum. As 5 primeiras áreas do quiz e o mapa de cobertura de cada área estão no `PLAN.md`.
