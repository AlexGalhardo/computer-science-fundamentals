# Quiz

> English version: [README.md](README.md) · Versión en español: [README.es.md](README.es.md)

O produto principal deste repositório: um quiz que cobre todas as áreas de fundamentos de ciência da computação. Cada questão tem 5 alternativas, e depois da resposta a explicação aparece ao lado: o conceito, por que a alternativa certa está certa, por que cada uma das outras está errada, um exemplo opcional, e links para o mini-projeto que mostra o conceito funcionando e para a fonte.

Desenho: [docs/pt/quiz.md](../docs/pt/quiz.md). Como escrever questões: [docs/pt/quiz-authoring.md](../docs/pt/quiz-authoring.md).

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-quiz.sh        # Linux e macOS
./setup-windows-quiz.ps1    # Windows
```

O quiz fica em <http://localhost:3000> (defina `QUIZ_PORT` para mudar a porta). Para parar: `docker compose down`.

## Do que ele é feito

| Parte | Escolha | Motivo |
| --- | --- | --- |
| Framework | Next.js com geração estática (`output: "export"`) | toda página é pré-renderizada no build em arquivos simples em `out/` |
| Componentes | Base UI (`@base-ui/react`), sem estilos | os controles interativos (botões, alternadores, selects, o medidor de progresso e o popup de um termo) ganham uso por teclado, controle de foco e ARIA da biblioteca, em vez de código escrito à mão |
| Estilos | Tailwind CSS v4, tokens de cor por tema | o Base UI não tem estilos: o Tailwind dá a aparência, só com tokens, então os temas claro e escuro usam os mesmos componentes |
| Servidor | nenhum. Um servidor de arquivos estáticos (Caddy) serve `out/` | sem back end, sem rota de API, sem dado buscado em tempo de execução |
| Conteúdo | arquivos JSON em `content/<area>/<topico>.json`, validados com Zod | uma questão quebrada faz o build falhar |
| Armazenamento | `localStorage` para o progresso, `sessionStorage` para a rodada atual | o progresso fica no navegador, sem conta |

## Funcionalidades

- **Três idiomas.** Inglês, português e espanhol na interface e em todas as questões, em `/en/`, `/pt/` e `/es/`. A primeira visita segue o idioma do navegador e a escolha é lembrada. Trocar de idioma no meio de uma questão mantém a questão, a resposta escolhida e a explicação.
- **Tema claro e escuro.** A primeira visita segue a preferência do sistema. O tema é aplicado antes da primeira pintura, então recarregar nunca pisca o outro tema.
- **Feito para celular.** Uma coluna abaixo de 768 px, com a explicação embaixo das alternativas, e duas colunas a partir daí. Usável a partir de 320 px de largura, com alvos de toque de pelo menos 44 por 44 px.
- **Progresso** por área, com botão para zerar.
- **Revisar só as que errei.** Uma questão sai dessa lista quando é respondida corretamente.
- **Filtro de dificuldade**: básico, intermediário, avançado.
- **Embaralhamento** de questões e alternativas a cada tentativa.
- **Teclado**: as teclas 1 a 5 ou A a E escolhem uma alternativa, Enter vai para a próxima questão.

## Estrutura

```text
quiz/
  content/            questões, mapas de cobertura e os dois catálogos
  scripts/            validate, blind e compare (pipeline de conteúdo)
  src/app/            rotas: /[lang], /[lang]/[area], .../quiz, .../result
  src/components/     cabeçalho, lista e painel de áreas, tela da questão, explicação, resultado
  src/content/        schemas Zod, verificações do repositório, revisão cega
  src/i18n/           um dicionário tipado por idioma
  src/lib/            embaralhamento, rodada, progresso, destaque de código, carregador de conteúdo do build
  tests/unit/         schema, embaralhamento, rodada, pontuação, progresso, dicionários
  tests/e2e/          fluxos em Playwright contra o build estático
  tests/fixtures/     uma área pequena com três questões, usada pelos testes
```

## Testes

```sh
./setup-unix-quiz.sh test        # ou: ./setup-windows-quiz.ps1 test
```

Isso constrói o site a partir do fixture de teste e roda, dentro do Docker, os testes unitários (`bun test`) e os de ponta a ponta (`playwright test`): fluxo da questão em largura de celular e de desktop, rodada só com teclado, verificações automáticas de acessibilidade e contraste nos dois temas, troca de idioma no meio de uma questão, progresso, modo de revisão, filtro de dificuldade, e ausência de rolagem horizontal em 320, 390, 768 e 1280 px.

## Comandos de conteúdo

Rode da raiz do repositório, com o Bun instalado:

```sh
bun run quiz:validate [area] [--strict]      # schema, ids únicos, tópicos e metas
bun run quiz:blind <area>                    # exporta as questões sem o gabarito
bun run quiz:compare <area> <respostas.json> # escreve review.md com as discordâncias
```

## Desenvolvimento local

```sh
bun install
cd quiz
bun run dev          # http://localhost:3000
bun run build        # site estático em out/
bun test tests/unit
```
