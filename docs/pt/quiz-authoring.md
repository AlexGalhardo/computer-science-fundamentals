# Guia de autoria do quiz

> English version: [docs/en/quiz-authoring.md](../en/quiz-authoring.md) · Versión en español: [docs/es/quiz-authoring.md](../es/quiz-authoring.md)

Como escrever uma questão do quiz, e como um lote é aceito. O desenho do quiz está em [quiz.md](quiz.md).

## Arquivos

```text
quiz/content/
  areas.json            as 31 áreas (slug, nomes, meta)
  mini-projects.json    os 78 mini-projetos (caminho, status)
  <area>/
    coverage.json       tópicos da área, fonte e meta de questões por tópico
    <topico>.json       uma lista JSON com as questões daquele tópico
    review.md           registro da revisão cega
```

O nome do arquivo é o slug do tópico, e ele precisa existir em `coverage.json`.

## Mapa de cobertura

```json
{
	"area": "big-o",
	"sources": ["USP Algorithm Analysis lectures, parts 1 and 2"],
	"topics": [
		{
			"slug": "asymptotic-notation",
			"name": { "en": "Asymptotic notation", "pt": "Notação assintótica", "es": "Notación asintótica" },
			"source": "USP Algorithm Analysis, part 1",
			"target": 15
		}
	]
}
```

Os tópicos e as metas vêm da tabela da área no `PLAN.md`. As metas somam a meta da área.

## Questão

```json
{
	"id": "big-o-asymptotic-notation-01",
	"area": "big-o",
	"topic": "asymptotic-notation",
	"difficulty": "basic",
	"answer": 1,
	"source": "USP Algorithm Analysis, part 1 (asymptotic notation)",
	"miniProject": "projects/big-o/big-o-lab",
	"pt": {
		"statement": "...",
		"alternatives": ["...", "...", "...", "...", "..."],
		"explanations": ["...", "...", "...", "...", "..."],
		"snippet": { "kind": "code", "language": "ts", "content": "..." },
		"concept": "...",
		"example": { "kind": "code", "language": "ts", "content": "..." }
	},
	"en": { "...": "mesmo formato, mesmo significado" },
	"es": { "...": "mesmo formato, mesmo significado" }
}
```

| Campo | Regra |
| --- | --- |
| `id` | `<area>-<topico>-<nn>`, único no quiz inteiro, nunca reaproveitado. O navegador guarda o progresso por id |
| `difficulty` | `basic`, `intermediate` ou `advanced`. Mire em 40%, 40% e 20% em cada área |
| `answer` | índice da alternativa correta, de 0 a 4. Distribua a posição correta: nenhum índice deve concentrar mais de cerca de 30% de uma área |
| `source` | o livro ou a aula e o capítulo que a questão cobre |
| `miniProject` | opcional. Um caminho listado em `mini-projects.json`. Obrigatório quando o conceito é demonstrado por um mini-projeto |
| `alternatives` | exatamente 5, todas diferentes, uma correta |
| `explanations` | exatamente 5, na mesma ordem: a explicação `i` diz por que a alternativa `i` está certa ou errada |
| `concept` | a ideia por trás da questão, em duas a quatro frases, legível sem as alternativas |
| `snippet` | opcional: código ou diagrama em texto que o estudante precisa ler para responder. Aparece junto do enunciado, antes da resposta, e vai para o revisor cego. Presente nos três idiomas ou em nenhum |
| `example` | opcional: código (`kind: "code"`, com `language`) ou diagrama em texto (`kind: "diagram"`). Presente nos três idiomas ou em nenhum |

## Como escrever uma boa questão

- **Uma ideia por questão.** Se o enunciado precisa de "e", provavelmente são duas questões.
- **O enunciado se sustenta sozinho.** Quem conhece o assunto deve conseguir responder antes de ler as alternativas.
- **Alternativas erradas são equívocos reais.** Cada distrator é a resposta de quem cometeu um erro de raciocínio específico: confundir pior caso com caso médio, mutex com semáforo, autenticação com autorização. A explicação dele nomeia esse erro. Alternativas de enchimento, que ninguém marcaria, não ensinam nada.
- **Exatamente uma alternativa é defensável.** Evite "todas as anteriores", "nenhuma das anteriores" e pares que estão ambos certos dependendo da leitura. Diga qual convenção vale quando a resposta depende de uma (base do logaritmo, índice começando em zero, a implementação de um nível de isolamento).
- **O enunciado nunca depende do `example`.** O exemplo pertence à explicação e só aparece depois da resposta. Tudo que é necessário para responder (um trecho de código, uma tabela, um escalonamento, um grafo) vai em `snippet`, ou no próprio enunciado. Um snippet não pode entregar a resposta.
- **Tamanho e forma parecidos.** A alternativa correta não pode ser a mais longa nem a única precisa.
- **Sem pegadinha de redação.** Evite dupla negação, e escreva "NÃO" ou "EXCETO" em maiúsculas quando a questão pede o item errado.
- **Níveis.** Básico: lembrar e reconhecer uma definição. Intermediário: aplicar o conceito a um caso, calcular, comparar duas ideias. Avançado: combinar conceitos, achar a falha, raciocinar sobre um caso de borda.
- **Números são conferidos.** Toda resposta calculada é refeita uma segunda vez, e os passos entram na explicação ou no conceito.
- **Inglês, português e espanhol dizem a mesma coisa.** Escreva os três ao mesmo tempo. Mantenha código, identificadores e termos técnicos consagrados idênticos nos três.

## Resumo teórico

Cada página de área mostra, abaixo do formulário que começa o quiz, um resumo teórico que o estudante lê antes de responder (pedido do dono, 2026-10-10). Ele fica em `quiz/content/<area>/theory/en.json`, `pt.json` e `es.json`.

```json
{
	"area": "big-o",
	"intro": ["Primeiro parágrafo.", "Segundo parágrafo."],
	"sections": [
		{
			"id": "binary-search",
			"title": "Busca binária",
			"blocks": [
				{ "type": "paragraph", "text": "Numa lista ordenada, abra no **meio**." },
				{ "type": "callout", "tone": "analogy", "text": "Como abrir um dicionário no meio." }
			]
		}
	]
}
```

- Começa com uma introdução (`intro`). O app monta o sumário a partir das seções, e cada entrada aponta para `#<id>`.
- É completo e escrito para um iniciante, como se o leitor tivesse 10 anos: analogias do dia a dia, frases curtas, toda palavra técnica explicada na primeira vez em que aparece. Todo tópico do `coverage.json` é ensinado por uma seção, e o resumo ensina todas as ideias cobradas nas questões, sem citar as questões.
- Pelo menos 3 seções. O `id` é um slug em inglês, em kebab-case, único no arquivo.
- Os três idiomas têm o mesmo esqueleto: os mesmos ids de seção na mesma ordem e, em cada seção, os mesmos tipos de bloco na mesma ordem. Só as palavras mudam.

| Bloco | Campos | Uso |
| --- | --- | --- |
| `paragraph` | `text` | texto normal |
| `heading` | `text` | subtítulo dentro de uma seção |
| `list` | `items`, `ordered` opcional | passos, propriedades |
| `table` | `headers`, `rows`, `caption` opcional | comparação lado a lado. Toda linha tem uma célula por cabeçalho |
| `code` | `language`, `content`, `caption` opcional | um exemplo curto |
| `diagram` | `content`, `caption` opcional | uma figura desenhada com texto |
| `callout` | `tone` (`analogy`, `tip`, `warning`, `remember`), `text` | a comparação do dia a dia, um erro comum, a frase para guardar |
| `chart` | `title`, `unit` opcional, `bars` (`label`, `value`) | um gráfico de barras. Só números exatos ou deriváveis, ou resultados medidos neste repositório |
| `video` | `title`, `url` (https) | um link para um vídeo, vindo do `REFERENCES.md` ou aberto e confirmado pelo autor. É um link, não um player embutido |

Dentro de qualquer texto quatro marcas são lidas, e nada mais (HTML continua como texto simples): `**negrito**`, `` `código` ``, `[texto](https://...)` e `[[termo|significado]]`, um tooltip que mostra o significado de um termo.

O `bun run quiz:validate <area>` confere o formato e o esqueleto. Resumo ausente é aviso, e erro com `--strict`. A regra contra cópia vale aqui também.

## Sem cópia

As questões são escritas a partir do mapa de capítulos e do conhecimento do assunto. Nunca copie uma frase, um exercício ou uma figura de um livro ou de uma aula. Citar o capítulo em `source` é a forma de a questão apontar para o material.

## Aceitação de um lote

1. `bun run quiz:validate <area> --strict` passa: schema, ids únicos, tópicos conhecidos, metas atingidas.
2. `bun run quiz:blind <area>` exporta `quiz/.review/<area>.blind.json`, sem gabarito e sem explicações.
3. Um revisor que não escreveu as questões responde o arquivo e salva `{ "<id>": <índice> }`, ou `{ "<id>": { "answer": <índice>, "note": "..." } }` para sinalizar uma questão ambígua.
4. `bun run quiz:compare <area> <respostas.json>` escreve `quiz/content/<area>/review.md` com toda discordância.
5. Cada discordância é resolvida em `review.md` como `key kept`, `key fixed` ou `question rewritten`, com o motivo. Uma discordância nunca é descartada sem motivo por escrito.
