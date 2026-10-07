# Quiz

> English version: [docs/en/quiz.md](../en/quiz.md)

O quiz é a porta de entrada do repositório: um app único que cobre todas as áreas. Os miniprojetos continuam no plano, e a explicação de cada pergunta aponta para o miniprojeto que demonstra o conceito. Decisões tomadas em 2026-10-07.

## Formato da pergunta

- Múltipla escolha com **5 alternativas** e uma única correta.
- Depois da resposta, a explicação do conceito aparece ao lado.
- Cada pergunta tem um nível: básica, intermediária ou avançada.
- Toda pergunta existe em português e em inglês desde o início.

## Tela

Uma pergunta por tela, em um grid de duas colunas. No celular as colunas empilham.

```
+---------------------------+---------------------------+
| Big O  ·  pergunta 3/20   |  EXPLICAÇÃO               |
|                           |                           |
| Qual a complexidade da    |  (vazio até responder)    |
| busca binária?            |                           |
|                           |  Correta: B, O(log n)     |
| ( ) A  O(1)               |  A cada passo o intervalo |
| (x) B  O(log n)   certo   |  cai pela metade...       |
| ( ) C  O(n)               |                           |
| ( ) D  O(n log n)         |  Por que não C: ...       |
| ( ) E  O(n^2)             |  Ver: projects/big-o-lab  |
|                           |                           |
|              [ Próxima > ]|                           |
+---------------------------+---------------------------+
```

## O que a explicação contém

1. O conceito e por que a alternativa correta é a correta.
2. Uma linha para cada alternativa errada, apontando o erro de raciocínio.
3. Um exemplo de código ou diagrama, quando ajudar a fixar.
4. Link para o miniprojeto que demonstra o conceito e para a fonte (resumo ou capítulo do livro).

## Recursos obrigatórios

- **i18n**: o app inteiro, interface e perguntas, em português e inglês, com seletor de língua.
- **Tema claro e escuro**, com um botão de alternância. A primeira visita segue a preferência do sistema.
- **Mobile friendly**: utilizável a partir de 320 px de largura, com controles no tamanho de toque.

## Outros recursos da primeira versão

- Progresso salvo no navegador, com acertos e erros por área.
- Modo "revisar só as que errei".
- Filtro por nível de dificuldade.
- Perguntas e alternativas embaralhadas a cada tentativa.

## Tecnologia

- Next.js com geração estática (SSG, toda página pré-renderizada no build) e Tailwind CSS v4, sem backend.
- O app fica em `quiz/`, na raiz do repositório.
- As perguntas ficam em arquivos JSON, em `quiz/content/<área>/<tópico>.json`, validados por um schema.

Campos de cada pergunta:

| Campo | Conteúdo |
| --- | --- |
| `id` | identificador estável, por exemplo `big-o-binary-search-01` |
| `area`, `topic` | área e tópico |
| `difficulty` | `basic`, `intermediate` ou `advanced` |
| `answer` | índice da alternativa correta (0 a 4) |
| `source` | livro ou aula e capítulo que a pergunta cobre |
| `miniProject` | caminho do miniprojeto relacionado, quando existir |
| `pt`, `en` | para cada língua: enunciado, 5 alternativas, 5 explicações (uma por alternativa), conceito e exemplo opcional |

## Volume e cobertura

- **Pelo menos 100 perguntas por área**, com o objetivo de cobrir todo o conteúdo dos livros e das aulas. São 31 áreas e 3.220 perguntas planejadas.
- **Áreas só de teoria** (Eletrônica com 170 perguntas, Engenharia de software com 150) não têm miniprojeto, então o quiz delas é maior e segue o livro de origem capítulo a capítulo.
- **Áreas de teoria e prática** (as outras 29) têm também miniprojetos executáveis. Quiz e miniprojeto se complementam: a explicação aponta para o miniprojeto, e o README do miniprojeto lista os tópicos do quiz que ele demonstra.
- Para cada área existe um **mapa de cobertura**: a lista de capítulos e tópicos dos livros e aulas daquela área, com a quantidade de perguntas que cobre cada um.
- As perguntas são escritas a partir do mapa de capítulos e do conhecimento do assunto, não de uma leitura página a página: os PDFs não ficam no repositório e os resumos dos livros longos foram feitos por amostragem. Cada pergunta cita o capítulo que cobre.

## Produção

1. Primeiro o app do quiz e 5 áreas completas, com 100 perguntas cada, para validar formato e qualidade.
2. Depois, as demais áreas em levas de 5.

## Garantia de qualidade

- **Validação automática**: um script checa que cada pergunta tem 5 alternativas, exatamente uma correta, explicação para cada alternativa, e os textos em PT e EN.
- **Revisor independente**: um segundo agente responde cada lote sem ver o gabarito. Toda divergência é revista antes de a pergunta entrar.
- **Revisão do autor** por amostragem.
