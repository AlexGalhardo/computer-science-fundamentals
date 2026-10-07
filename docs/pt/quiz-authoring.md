# Guia de autoria do quiz

> English version: [docs/en/quiz-authoring.md](../en/quiz-authoring.md)

Como escrever uma questão do quiz, e como um lote é aceito. O desenho do quiz está em [quiz.md](quiz.md).

## Arquivos

```
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
			"name": { "en": "Asymptotic notation", "pt": "Notação assintótica" },
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
	"en": { "...": "mesmo formato, mesmo significado" }
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
| `snippet` | opcional: código ou diagrama em texto que o estudante precisa ler para responder. Aparece junto do enunciado, antes da resposta, e vai para o revisor cego. Presente nos dois idiomas ou em nenhum |
| `example` | opcional: código (`kind: "code"`, com `language`) ou diagrama em texto (`kind: "diagram"`). Presente nos dois idiomas ou em nenhum |

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
- **Português e inglês dizem a mesma coisa.** Escreva os dois ao mesmo tempo. Mantenha código, identificadores e termos técnicos consagrados idênticos nos dois.

## Sem cópia

As questões são escritas a partir do mapa de capítulos e do conhecimento do assunto. Nunca copie uma frase, um exercício ou uma figura de um livro ou de uma aula. Citar o capítulo em `source` é a forma de a questão apontar para o material.

## Aceitação de um lote

1. `bun run quiz:validate <area> --strict` passa: schema, ids únicos, tópicos conhecidos, metas atingidas.
2. `bun run quiz:blind <area>` exporta `quiz/.review/<area>.blind.json`, sem gabarito e sem explicações.
3. Um revisor que não escreveu as questões responde o arquivo e salva `{ "<id>": <índice> }`, ou `{ "<id>": { "answer": <índice>, "note": "..." } }` para sinalizar uma questão ambígua.
4. `bun run quiz:compare <area> <respostas.json>` escreve `quiz/content/<area>/review.md` com toda discordância.
5. Cada discordância é resolvida em `review.md` como `key kept`, `key fixed` ou `question rewritten`, com o motivo. Uma discordância nunca é descartada sem motivo por escrito.
