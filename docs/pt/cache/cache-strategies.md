# Estratégias de cache e estouro da manada (MP-CACHE-1)

> English version: [docs/en/cache/cache-strategies.md](../../en/cache/cache-strategies.md)

Mini-projeto: [`projects/cache/cache-strategies`](../../../projects/cache/cache-strategies/README.pt-BR.md). Tópicos do quiz: `caching-strategies`, `consistency-trade-offs`, `stampede-penetration-avalanche`, `invalidation-ttl`.

## O problema

Um cache é uma segunda cópia de um dado cujo original mora em um lugar mais lento, aqui o Redis na frente do PostgreSQL. Ler a cópia é rápido. A parte difícil é que agora há dois lugares para mudar a cada escrita, e nenhuma transação cobre os dois: o PostgreSQL pode confirmar e o Redis falhar, ou o contrário, e duas requisições podem chegar aos dois sistemas em ordens diferentes.

Toda estratégia de cache é uma resposta a uma pergunta: **em uma escrita, quem é alterado, em que ordem, e quando o cliente ouve "pronto"?**

## O caminho de leitura comum

As três estratégias do mini-projeto leem do mesmo jeito, chamado de carga preguiçosa (lazy loading):

```
valor = GET product:7              acerto -> responde
                                   falha  -> SELECT no PostgreSQL
                                             SET product:7 valor PX <tempo de vida>
                                             responde
```

O tempo de vida não é uma otimização. É a rede de segurança: o limite de quanto tempo uma cópia errada consegue sobreviver, não importa o que deu errado.

## Três jeitos de escrever

| Estratégia | O que a escrita faz | O cliente ouve "pronto" depois de | O que garante | O que não garante |
| --- | --- | --- | --- | --- |
| Cache-aside | `UPDATE` no banco, depois `DEL` da chave | banco e remoção | A próxima leitura carrega o valor novo | Uma leitura que já estava em andamento pode recolocar o valor antigo |
| Write-through | `UPDATE` no banco, depois `SET` da chave | banco e cache | A próxima leitura é um acerto e está fresca | Dois escritores concorrentes podem deixar o cache com o valor mais antigo; não há atomicidade entre os dois |
| Write-behind | `SET` da chave e uma entrada na fila de pendentes; o banco depois, em lotes | só o cache | A escrita mais barata, e muitas escritas na mesma chave viram uma escrita no banco | Durabilidade: o que foi confirmado e ainda não descarregado se perde se o Redis perder a memória |

### Cache-aside: por que apagar, e a corrida que sobra

A escrita apaga a chave em vez de gravar o valor novo. Dois escritores que gravam podem chegar ao Redis na ordem contrária dos seus commits e deixar lá o valor mais antigo. Uma remoção não carrega valor, então não tem como estar errada: o próximo leitor busca a verdade.

Sobra uma corrida, e os testes a repetem passo a passo:

```
leitor:   GET  -> falha
leitor:   SELECT -> preço antigo
escritor: UPDATE preço novo (commit)
escritor: DEL chave            (ainda não há nada para apagar)
leitor:   SET chave = preço antigo  <- obsoleto até o tempo de vida acabar
```

Ela exige uma leitura mais lenta que uma escrita inteira, então é rara, e é o motivo de uma entrada de cache-aside sempre ter tempo de vida.

### Write-through

O banco vai primeiro. Se ele recusar a escrita, o cache nem é tocado (há um teste para isso). Se o banco confirmar e o `SET` falhar, o cache fica com o valor antigo até o tempo de vida acabar: os dois passos não são atômicos. Quem paga é o escritor, que espera duas viagens.

O write-through também guarda no cache dados que talvez nunca sejam lidos. Por isso as entradas dele também levam tempo de vida.

### Write-behind

A escrita vai para a chave do cache e para um hash de escritas pendentes no Redis, um campo por produto, e o cliente é respondido. Um temporizador (200 ms no mini-projeto) renomeia o hash de forma atômica, manda tudo para o PostgreSQL em um único `UPDATE`, e o apaga. Dez escritas no mesmo produto dentro de um intervalo são uma linha desse lote.

Duas consequências, cada uma com um teste:

- Até a descarga, o banco está **atrás** do cache. Tudo o que lê o PostgreSQL diretamente (um relatório, outro serviço) vê o valor antigo. Uma falha de cache precisa olhar a fila de pendentes antes do banco, senão guardaria o valor antigo de novo.
- Se o Redis perder a memória antes da descarga, o cliente ouviu "salvo" e a escrita sumiu. Write-behind serve para dados em que essa perda é aceitável (contadores, data do último acesso), ou então precisa de uma fila durável no lugar de um cache.

## O estouro da manada

Uma chave popular expira. Até alguém gravar uma cópia nova, toda requisição vê uma falha, e cada uma roda a mesma consulta cara. No experimento a consulta leva 100 ms e 300 usuários leem a chave, então os 300 chegam dentro do intervalo. O pool tem 20 conexões, as consultas fazem fila por elas, e o leitor mais lento espera mais de um segundo por um valor que uma única consulta teria produzido.

Duas correções estão implementadas.

**Trava (single flight entre instâncias).** Na falha, a requisição tenta `SET lock token NX PX 10000`. Só um chamador recebe `OK`: ele consulta o banco, grava o valor e solta a trava. Os outros esperam alguns milissegundos e leem o cache de novo. Três detalhes importam:

- A trava tem validade (`PX`), então um dono que cai não bloqueia todo mundo para sempre.
- Soltar é "apague só se o token ainda for meu", feito em um script Lua para que a comparação e a remoção sejam um passo atômico. Um `DEL` simples poderia remover uma trava que expirou e agora pertence a outro.
- Depois de ganhar a trava, o cache é conferido de novo. Uma requisição lenta pode ganhar a trava logo depois de o vencedor anterior gravar o valor.

**Renovação antecipada.** O valor em cache leva um instante de "renovar depois de" que vem antes da expiração real. A primeira requisição que lê o valor depois desse instante pega a trava e o recarrega em segundo plano, e todas as requisições, inclusive ela, continuam recebendo a cópia ainda válida. A chave nunca chega a expirar enquanto está em uso, então ninguém espera. Um cache frio não tem o que servir, e só esse caso recai na trava.

Uma variante conhecida é a expiração antecipada probabilística: cada requisição decide ao acaso renovar antes, com uma probabilidade que cresce conforme a expiração se aproxima, o que dispensa a trava. O mini-projeto usa uma janela fixa mais a trava porque isso dá exatamente uma consulta por renovação, que é o que o experimento conta.

Um tempo de vida maior não corrige o estouro. Ele o torna mais raro e o dado mais velho, e cada expiração continua sendo paga pela manada inteira.

## Resultados

As tabelas versionadas estão no [README](../../../projects/cache/cache-strategies/README.pt-BR.md#resultados) e em `results/results.md`, com a máquina e as versões.

**Estouro da manada.** Sem proteção, a expiração mediana custou 299 consultas ao banco, cerca de uma por leitor (a menor rajada teve 260, a maior 300). Com a trava e com a renovação antecipada, cada expiração custou exatamente 1. A requisição mais lenta das execuções sem proteção levou mais de um segundo; com a renovação antecipada a latência fica plana porque ninguém espera a recarga.

Como "consultas por expiração" é contado: a API conta as consultas que carregam a chave quente. Uma consulta que começa quando nenhuma outra carga dessa chave está em andamento abre uma nova expiração, e as que começam enquanto há uma em andamento pertencem à mesma expiração. A partida a frio conta como a primeira expiração.

**Taxa de acerto e latência.** Como ler a segunda tabela sem se enganar:

- A taxa de acerto cresce com o tempo de vida em todas as estratégias, porque menos leituras encontram a chave expirada. O preço é a defasagem, que essa tabela não mostra.
- Com tempo de vida de 5 s e medição de 5 s, quase nada expira dentro da execução. Essa linha mostra o teto: o que sobra são as falhas causadas por escritas (o cache-aside apaga a chave) e por produtos lidos pela primeira vez.
- Write-through e write-behind deveriam acertar um pouco mais que o cache-aside, porque a escrita deixa o valor novo no cache em vez de removê-lo. Com 2% de escritas a diferença esperada é de cerca de dois pontos percentuais, menor que a dispersão entre as rodadas da execução versionada, então a tabela não a mostra de forma confiável.
- É na latência de escrita que as estratégias mais diferem: o write-behind responde depois de tocar só no Redis, as outras duas esperam o PostgreSQL. O write-behind também manda bem menos comandos ao banco, porque cada descarga é um comando.
- As execuções são curtas e a máquina estava compartilhada com outros trabalhos. Diferenças de latência de poucos milissegundos entre linhas são ruído.

## Limites do laboratório

- Uma única instância da API. A trava fica no Redis, então funcionaria entre instâncias, mas a contagem de consultas por expiração vive na memória do processo da API.
- A consulta cara é simulada com `pg_sleep`.
- O Redis roda sem persistência e sem limite de memória, então aqui nunca há descarte.
- Penetração e avalanche de cache são cobertas pelo quiz, não por este mini-projeto.

## Fontes

- Documentação do Redis: [`SET`](https://redis.io/docs/latest/commands/set/) (as opções `NX` e `PX` e o padrão de trava), [`EXPIRE`](https://redis.io/docs/latest/commands/expire/), [descarte de chaves](https://redis.io/docs/latest/develop/reference/eviction/), [persistência](https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/).
- RFC 9111, HTTP Caching, e RFC 5861 para o `stale-while-revalidate`, a forma HTTP de servir uma cópia enquanto ela é renovada.
