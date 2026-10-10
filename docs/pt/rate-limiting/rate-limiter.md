# Algoritmos de limitação de taxa (MP-RL-1)

> English version: [docs/en/rate-limiting/rate-limiter.md](../../en/rate-limiting/rate-limiter.md) · Versión en español: [docs/es/rate-limiting/rate-limiter.md](../../es/rate-limiting/rate-limiter.md)

Mini-projeto: [`projects/rate-limiting/rate-limiter`](../../../projects/rate-limiting/rate-limiter/README.pt-BR.md). Tópicos do quiz: `fixed-window`, `sliding-window`, `token-bucket`, `leaky-bucket`, `redis-distributed`, `http-429-and-backoff`.

## A pergunta

Um limite como "10 requisições por segundo" não diz o que acontece quando 20 requisições chegam em 200 ms. Cada algoritmo responde de um jeito, e é essa resposta que você está escolhendo de verdade.

| Algoritmo | Estado por cliente | Como decide | O que faz com uma rajada |
| --- | --- | --- | --- |
| Janela fixa | Um número de janela e um contador | Admite enquanto o contador da janela alinhada atual está abaixo do limite | Deixa passar até o dobro do limite em torno de uma fronteira |
| Log deslizante | Um instante por requisição admitida | Admite enquanto menos de `limit` instantes estão em (t − W, t] | Nunca mais que o limite em qualquer intervalo de tamanho W |
| Contador deslizante | Dois contadores | Admite enquanto `anterior × (1 − decorrido / W) + atual` está abaixo do limite | Perto do limite, com um erro pequeno |
| Token bucket | Um saldo e um instante | Admite quando há uma ficha; as fichas voltam em ritmo constante, até o teto da capacidade | Deixa passar de uma vez uma rajada do tamanho da capacidade, depois a taxa de reposição |
| Leaky bucket (fila) | Um nível e um instante | Admite enquanto há espaço no balde; as admitidas saem em taxa constante | Absorve a rajada e libera um fluxo uniforme |

## O experimento de rajada

Os cinco recebem as mesmas 80 requisições em quatro fases, com a mesma configuração (limite 10, janela de 1000 ms, portanto capacidade 10 e taxa de 10 por segundo nos baldes).

![Requisições admitidas ao longo do tempo por cada algoritmo](../../../projects/rate-limiting/rate-limiter/results/burst.pt-BR.svg)

A tabela com os números está no [README](../../../projects/rate-limiting/rate-limiter/README.pt-BR.md#resultados) e em `results/burst.md`. Como ler:

- **Abaixo do limite (0 a 1 s).** Cinco requisições em um segundo. Todos admitem tudo: os algoritmos só se diferenciam quando o limite é atingido.
- **Rajada na fronteira (1,9 a 2,1 s).** Dez requisições no fim da janela [1 s, 2 s) e dez no começo de [2 s, 3 s). A janela fixa enxerga duas janelas com dez requisições cada e admite as 20. O log deslizante admite 10. O contador deslizante admite 11: em t = 2,01 s a janela anterior pesa 0,99 × 10 = 9,9, que está abaixo de 10, embora o último segundo real contenha 10 requisições. Os dois baldes admitem 11: dez fichas guardadas mais a que foi ganha durante a rajada.
- **Sobrecarga contínua (3 a 5 s).** Vinte requisições por segundo. A janela fixa e o log deslizante admitem as dez primeiras de cada segundo e depois nada até o seguinte: o cliente vê meio segundo de sucesso e meio segundo de recusas. O token bucket gasta primeiro as dez fichas guardadas e depois admite uma requisição a cada 100 ms. Por isso ele soma 29 nesta fase: capacidade + taxa × tempo = 10 + 10 × 1,95 = 29,5 fichas entre a primeira requisição (3,00 s) e a última (4,95 s), logo 29 requisições inteiras.
- **Rajada instantânea após silêncio (7 s).** Quinze requisições no mesmo milissegundo. Todos os algoritmos admitem dez. Só o último painel é diferente: o leaky bucket entrega essas dez ao sistema atrás dele uma a cada 100 ms.

A coluna "pior intervalo de 1 s" desliza um intervalo de um segundo sobre as requisições admitidas e guarda a maior contagem. Janela fixa: 20. Log deslizante: 10. Contador deslizante: 11. Token bucket: 19. Saída do leaky bucket: 10.

### Como escolher

- A janela fixa basta quando o limite é uma proteção aproximada e uma rajada dupla não faz mal. Também é a mais barata no Redis: um `INCR`.
- O log deslizante serve para limites que precisam valer exatamente e são pequenos (tentativas de login, redefinição de senha), porque guarda cada requisição admitida.
- O contador deslizante é o meio-termo usual para limites grandes.
- O token bucket combina com APIs: clientes são irregulares por natureza, e a capacidade declara quanta rajada é tolerada.
- O leaky bucket como fila combina com um sistema atrás dele que tem capacidade constante e rígida. Ele troca rejeições por atraso.

O token bucket e o leaky bucket do mesmo tamanho admitem exatamente as mesmas requisições: um token bucket cheio e um leaky bucket vazio são imagens espelhadas. A diferença é o que acontece depois da admissão.

## Testes determinísticos

Todo limitador recebe o relógio como argumento: `allow(nowMs)`. Um teste diz "uma requisição chega em t = 999 ms" e obtém a mesma resposta em toda execução, sem esperar. A tabela em `cases/cases.json` tem três linhas do tempo por algoritmo, cada uma escolhida para fixar uma borda: a fronteira de uma janela fixa, uma entrada do log que expira exatamente uma janela depois, o peso da janela anterior no contador, o teto do token bucket, os instantes de saída do leaky bucket.

Os tempos são milissegundos inteiros e os baldes usam "créditos" inteiros (uma ficha vale `windowMs` créditos, cada milissegundo rende `limit` créditos), então não há arredondamento de ponto flutuante e as versões em TypeScript e em Go concordam exatamente. Os testes em Go leem a mesma tabela, e também comparam o experimento em Go com os números gravados pelo TypeScript.

## O que muda em Go

O JavaScript executa um callback por vez, então `count += 1` não pode ser interrompido. Em Go, muitas goroutines chamam `Allow` ao mesmo tempo, e "ler o contador, comparar, gravar" vira uma corrida. Cada limitador em Go segura um `sync.Mutex`, e um teste dispara 64 goroutines contra um limitador sob `go test -race`: exatamente o limite é admitido.

É o mesmo bug da próxima seção, em escala menor: duas threads de um processo em vez de duas máquinas.

## A versão distribuída

Atrás de um balanceador de carga, um limitador guardado na memória de cada instância deixa N instâncias admitirem N vezes o limite. O estado vai para o Redis, compartilhado por todas as instâncias.

O código óbvio está errado:

```text
instância A: GET rate:alice   -> 49
instância B: GET rate:alice   -> 49      (A ainda não escreveu)
instância A: 49 < 50, INCR    -> 50
instância B: 49 < 50, INCR    -> 51      <- uma a mais que o limite
```

Cada comando do Redis é atômico, mas a sequência não é. A correção é rodar a decisão inteira dentro do Redis como um único script Lua (`lua/fixed-window.lua`): o Redis executa um script do início ao fim sem deixar nenhum outro comando entrar no meio. O script também define a expiração no mesmo passo do primeiro incremento, então um cliente que falha não deixa um contador que nunca expira.

Detalhes que o código mostra:

- **Scripts curtos.** Enquanto um script roda, todos os outros clientes esperam. Os scripts aqui são um punhado de comandos O(1).
- **`EVALSHA` e `NOSCRIPT`.** O script é carregado uma vez e chamado pelo seu SHA1. O cache de scripts é volátil: depois de um reinício o Redis responde `NOSCRIPT`, e o cliente carrega o script de novo e repete a chamada.
- **`KEYS` e `ARGV`.** A chave vem em `KEYS[1]` e os números em `ARGV`, para que o Redis Cluster possa rotear o script pela chave.
- **O relógio do Redis.** O script do token bucket lê `TIME` no servidor. Duas instâncias com relógios um pouco diferentes discordariam sobre quantas fichas foram ganhas.
- **`429` e `Retry-After`.** Uma requisição recusada recebe `429 Too Many Requests` com `Retry-After` em segundos inteiros, arredondado para cima, e `Cache-Control: no-store`.

O teste sobe duas instâncias e envia 400 requisições concorrentes, alternando entre elas, para um limite de 50 por minuto. Com o script, exatamente 50 são admitidas em cada uma de cinco rodadas. Com a versão ingênua, até 192 foram admitidas nas rodadas medidas, e exatamente 50 em algumas delas: uma corrida depende de tempo, e é isso que a torna difícil de pegar. O teste repete a rodada ingênua até uma ultrapassar o limite.

O que o laboratório não cobre: a replicação do Redis é assíncrona, então depois de um failover alguns incrementos podem se perder e o limite ser ultrapassado por pouco tempo; e a aplicação precisa decidir o que fazer quando o Redis está inacessível (admitir tudo ou recusar tudo). Os dois assuntos são tratados no tópico `redis-distributed` do quiz.

## Regras do laboratório

O Redis (`redis:8.10.2-alpine`) e as duas instâncias conversam em uma rede interna do docker-compose. Nenhuma porta é publicada e nenhum contêiner alcança a internet. O teste concorrente tira seus alvos de `TARGETS`, cujo padrão são os dois serviços do compose, e lança um erro antes de enviar qualquer coisa quando um host não é `localhost`, `127.0.0.1`, `limiter-a` ou `limiter-b`.

## Critérios de aceite

| Item | Como é verificado |
| --- | --- |
| MP-RL-1.1 janela fixa, janela deslizante, token bucket e leaky bucket em memória, cada um passando em um teste orientado por tabela de requisições admitidas e rejeitadas ao longo do tempo | `docker compose run --rm ts-test` e `docker compose run --rm go-test`: os dois leem `cases/cases.json` (15 linhas do tempo, 3 por algoritmo; a janela deslizante tem duas variantes, log e contador) |
| MP-RL-1.2 duas instâncias juntas nunca admitem mais que o limite sob carga concorrente | `docker compose run --rm distributed-test`: exatamente 50 de 400 requisições concorrentes admitidas, em cinco rodadas, e a versão ingênua ultrapassa o limite |
| MP-RL-1.3 gráfico de requisições aceitas ao longo do tempo para os algoritmos com o mesmo tráfego | `./experiment-unix.sh` (ou `.ps1`) grava `results/burst.svg`, `results/burst.pt-BR.svg` e `results/burst.es.svg` a partir de `results/burst.json`; um teste falha quando os resultados versionados estão desatualizados |

## Como rodar

```sh
cd projects/rate-limiting/rate-limiter
./setup-unix-rate-limiter.sh        # ou .\setup-windows-rate-limiter.ps1
./experiment-unix.sh                # ou .\experiment-windows.ps1
```

## Fontes

- Tanenbaum e Wetherall, Redes de Computadores, 5ª edição, capítulo 5: modelagem de tráfego, leaky bucket e token bucket.
- Documentação do Redis: o comando `INCR` (padrão de limitador de taxa), scripts em Lua (`EVAL`, `EVALSHA`, cache de scripts).
- RFC 6585, seção 4 (429 Too Many Requests) e RFC 9110, seção 10.2.3 (`Retry-After`).
