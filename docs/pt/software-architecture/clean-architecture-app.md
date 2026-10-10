# Aplicação em arquitetura limpa (MP-ARCH-1)

> English version: [docs/en/software-architecture/clean-architecture-app.md](../../en/software-architecture/clean-architecture-app.md) · Versión en español: [docs/es/software-architecture/clean-architecture-app.md](../../es/software-architecture/clean-architecture-app.md)

Mini-projeto: [`projects/software-architecture/clean-architecture-app`](../../../projects/software-architecture/clean-architecture-app/README.pt-BR.md). Tópicos do quiz: `clean-architecture-dependency-rule`, `entities-use-cases`, `interface-adapters`, `frameworks-drivers-composition-root`, `layered-hexagonal`, `domain-driven-design`.

## O problema

Em uma aplicação pequena típica a regra de negócio acaba dentro do handler da rota, ao lado do SQL:

```text
handler da rota:  ler o corpo JSON -> conferir o título -> SELECT ... -> INSERT ... -> montar a resposta JSON
```

Funciona, e três coisas ficam caras. Testar a regra "não há duas notas com o mesmo título" exige um servidor web e um banco rodando. Oferecer a mesma funcionalidade em um terminal significa copiar a regra. Atualizar o framework ou trocar o banco significa ler todos os handlers, porque a regra e o detalhe estão nas mesmas linhas.

## A ideia: os imports apontam para dentro

A Arquitetura Limpa, como descrita por Robert Martin e desenvolvida em TypeScript por Otávio Lemos, organiza o código em camadas concêntricas e enuncia uma regra sobre elas, a **regra de dependência**: um arquivo só pode importar da própria camada ou de uma camada mais interna.

```text
            main (raiz de composição)          conhece tudo, nada a importa
   +--------------------------------------+
   |  drivers: Elysia, pg, relógio,        |
   |  terminal                             |
   |  +--------------------------------+  |
   |  | adapters: controllers,         |  |
   |  | presenter, repositório em      |  |
   |  | memória                        |  |
   |  |  +--------------------------+  |  |
   |  |  | casos de uso + portas    |  |  |
   |  |  |   +------------------+   |  |  |
   |  |  |   |    entidades     |   |  |  |
   |  |  |   +------------------+   |  |  |
   |  |  +--------------------------+  |  |
   |  +--------------------------------+  |
   +--------------------------------------+
        toda seta de import aponta para o centro
```

| Camada | Guarda | Muda quando |
| --- | --- | --- |
| Entidades | O que vale para uma nota em qualquer aplicação: título válido, corpo limitado, datas coerentes | O próprio negócio muda |
| Casos de uso | O que esta aplicação faz com as notas, passo a passo, e as portas de que precisa | Uma funcionalidade da aplicação muda |
| Adaptadores de interface | A tradução entre o formato de fora e o formato dos casos de uso: controllers, presenters, repositórios simples | O formato de uma requisição ou de uma tela muda |
| Frameworks e drivers | O framework web, o driver do banco, o relógio, o terminal | Uma ferramenta é atualizada ou trocada |
| Main | A configuração e a raiz de composição | Outro detalhe é escolhido |

As camadas mais internas são as que menos mudam e das quais todo o resto depende. As coisas voláteis, frameworks e bancos, ficam na borda, onde nada depende delas.

## As chamadas vão e voltam, os imports não

A regra fala de código-fonte, não de tempo de execução. Quando uma nota é criada por HTTP, o controle entra e sai de novo:

```text
rota Elysia -> NoteHttpController -> CreateNote -> NoteRepository.save() -> PostgresNoteRepository -> pg
  (driver)       (adaptador)       (caso de uso)       (porta)                  (driver)
```

O caso de uso chama o banco, e mesmo assim `create-note.ts` não importa `postgres-note-repository.ts`. Ele importa `ports.ts`, uma interface declarada na sua própria camada, e `PostgresNoteRepository` implementa essa interface do lado de fora. Isto é a **inversão de dependência**: na fronteira, a seta do import corre contra a direção da chamada. A **injeção de dependência** é só o mecanismo que entrega a implementação, aqui um parâmetro do construtor. Nenhum contêiner é usado.

## Entidades e casos de uso

`Title` é um objeto de valor e `Note` é uma entidade. Os dois têm construtor privado e uma fábrica `create` que devolve um `Result`, então uma nota inválida não pode ser construída, e quem recebe uma `Note` não precisa validá-la de novo. Falhas esperadas são valores de retorno (`invalid-title`, `duplicate-title`, `note-not-found`). Exceções ficam para o que ninguém esperava.

Duas regras parecidas moram em camadas diferentes:

- "Um título não é vazio e tem no máximo 80 caracteres" vale para qualquer nota: entidade.
- "Não há duas notas com o mesmo título" é uma escolha desta aplicação e precisa olhar para as outras notas: caso de uso, por meio do repositório.

Onde uma regra fica é uma decisão de design. O teste é perguntar se a regra valeria em outra aplicação construída sobre o mesmo conceito.

Um caso de uso devolve um DTO `NoteData`, não a entidade, e não conhece código de status, código de saída nem `console`. O relógio e o gerador de ids também são portas, e é isso que permite a um teste comparar um resultado inteiro com um valor esperado exato.

## Adaptadores, drivers e a raiz de composição

`NoteHttpController` declara os seus próprios tipos `HttpRequest` e `HttpResponse`, então nunca importa o Elysia. Ele confere o formato da entrada com Zod, chama um caso de uso, e mapeia o resultado: `duplicate-title` vira 409 aqui, e código de saída 1 em `NoteCliController`. Os dois controllers são a prova de que os casos de uso independem do mecanismo de entrega: o segundo foi acrescentado sem tocar em `use-cases/`.

Em termos hexagonais, os controllers são adaptadores condutores (eles chamam a aplicação) e os repositórios são adaptadores conduzidos (a aplicação os chama por uma porta). Uma porta tem dois adaptadores, um `Map` e o PostgreSQL, e um único arquivo de teste de contrato roda contra os dois.

Seguindo Lemos, um adaptador que fala diretamente com uma biblioteca externa pertence à camada mais externa. Por isso o repositório PostgreSQL está em `drivers/`, e por isso a verificação automática só deixa `adapters/` importar o Zod.

`main/composition.ts` é o único arquivo que cita um repositório concreto. Ele monta o grafo de objetos uma vez e o entrega aos pontos de entrada. As variáveis de ambiente são lidas e validadas em `main/config.ts` e viajam para dentro como valores simples.

## Três afirmações, três verificações

| Afirmação | Como é conferida |
| --- | --- |
| Nenhuma camada interna importa uma externa | `bun run check:layers`, parte do comando padrão do contêiner de teste. `tests/unit/dependency-rule.test.ts` acrescenta um `import type` proibido a uma cópia do código e espera código de saída 1 |
| Os casos de uso são testados sem banco e sem servidor HTTP | O contêiner `ts-test` tem `network_mode: "none"` e roda todos os testes dos casos de uso |
| Trocar o repositório muda apenas a raiz de composição | O diff no README toca só em `src/main/`. `tests/unit/swap.test.ts` falha se outro arquivo citar um repositório concreto |

A verificação de imports conta `import type` também. Um import só de tipo some em tempo de execução, mas o arquivo interno já não pode ser compilado nem entendido sem o externo, e é essa a dependência que a regra proíbe.

## O que custa, e quando não usar

- Mais arquivos e mais indireção. Uma funcionalidade toca em uma entidade, um caso de uso, um controller e talvez um repositório. Para um programa de poucas centenas de linhas isso é custo sem retorno.
- Interfaces compensam nas fronteiras entre camadas. Uma interface para cada classe dentro de uma camada é excesso de engenharia.
- A porta esconde a tecnologia de armazenamento, não a sua semântica. Um `Map` e o PostgreSQL diferem em durabilidade, em transações e no que acontece quando duas requisições conferem o mesmo título ao mesmo tempo. Aqui a restrição `UNIQUE` é a última linha de defesa para essa corrida.
- Trocar de banco continua exigindo migrar os dados. A arquitetura reduz o código que muda, não o trabalho operacional.
- A verificação de dependências deste projeto é um leitor didático baseado em expressões regulares. Em código de produção use uma regra de lint ou uma ferramenta baseada no compilador.

## Experimente

1. Acrescente `import type { HttpResponse } from "../adapters/note-http-controller";` a um caso de uso e rode `docker compose run --rm ts-test`.
2. Acrescente um comando `count` só no terminal. Quais camadas você editou?
3. Escreva um terceiro repositório que guarde as notas em um arquivo JSON, faça-o passar em `describeNoteRepositoryContract`, e plugue-o. Compare o seu diff com o do README.
4. Mova a regra do título duplicado para a entidade. O que a entidade passa a precisar que antes não precisava?

## Fontes

- Otávio Lemos, *Arquitetura Limpa na Prática*: capítulos 3 (as camadas e a regra de dependência), 6 (entidades), 7 (casos de uso), 8 (adaptadores de interface), 9 (frameworks e drivers) e 10 (principal e configuração). Resumo em `references/summaries/books/arquitetura-limpa-na-pratica-otavio-lemos.md`.
- Sommerville, *Engenharia de Software*, 9ª edição, capítulo 6 (projeto de arquitetura, o padrão em camadas).
