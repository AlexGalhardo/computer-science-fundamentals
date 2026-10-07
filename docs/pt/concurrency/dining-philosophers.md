# Deadlock: o jantar dos filósofos

> English version: [docs/en/concurrency/dining-philosophers.md](../../en/concurrency/dining-philosophers.md)

Mini-projeto: [projects/concurrency/dining-philosophers](../../../projects/concurrency/dining-philosophers/README.pt-BR.md) (MP-CONC-2). Linguagens: Go, Java.

## O problema

Cinco filósofos, cinco garfos, e cada filósofo precisa dos dois garfos ao seu lado para comer. Um garfo é uma trava: um dono por vez.

```
            P0
       f0        f1
    P4              P1
       f4        f2
         P3  f3  P2
```

O filósofo `i` senta entre o garfo `i` (esquerda) e o garfo `i+1` (direita). O último, P4, senta entre o garfo 4 e o garfo 0.

A regra ingênua é "pegue o garfo da esquerda, depois o da direita". Quando os cinco pegam o garfo da esquerda no mesmo instante, P0 espera o garfo 1 (que está com P1), P1 espera o garfo 2, e assim por diante até P4, que espera o garfo 0, que está com P0. Ninguém consegue continuar e ninguém vai soltar o que tem. Isso é um deadlock.

Um deadlock não gera erro. O programa está vivo, não usa processador e não faz nada. Por fora, ele é detectado com um **tempo limite sobre o progresso**, que é o que os testes fazem: ninguém comeu por 500 ms.

## As quatro condições

Um deadlock de recursos precisa de quatro condições ao mesmo tempo (condições de Coffman):

| Condição | Na mesa |
| --- | --- |
| Exclusão mútua | Um garfo tem um dono por vez |
| Posse e espera | Um filósofo segura o primeiro garfo enquanto espera o segundo |
| Não preempção | Ninguém pode tirar um garfo da mão de outro filósofo |
| Espera circular | P0 espera P1, P1 espera P2, P2 espera P3, P3 espera P4 e P4 espera P0 |

As quatro são necessárias. Tire uma, qualquer uma, e o deadlock fica impossível. As duas correções do mini-projeto atacam a última condição.

## Correção 1: ordenação de travas

Dê às travas uma ordem global e pegue sempre a menor primeiro. Os garfos são numerados de 0 a 4. Quatro filósofos não mudam: para P0 a P3 o garfo da esquerda já é o menor. Só P4 muda: agora ele pega o garfo 0 antes do garfo 4.

Um círculo de espera exigiria alguém segurando um garfo maior enquanto espera um menor, e a regra proíbe exatamente isso. É a correção mais comum em código real: "sempre trave as contas por id crescente", "sempre trave o pai antes do filho".

## Correção 2: um garçom

Um semáforo contador com 4 permissões faz o papel de garçom: um filósofo precisa de uma permissão antes de tocar em um garfo, e a devolve depois de comer. Com no máximo quatro filósofos disputando cinco garfos, pelo menos um deles sempre consegue dois. Um círculo precisa dos cinco, então ele não se forma.

O semáforo aqui não é um mutex: ele não protege uma seção crítica, ele limita quantas threads podem estar em uma região ao mesmo tempo.

## Não ter deadlock não é ser justo

Nas medições, `waiter` dá a todos os filósofos quase o mesmo número de refeições, enquanto `ordered` é bem desigual: em uma execução de 60 segundos em Go os filósofos comeram 3830, 7664, 15333, 45993 e 3830 vezes. A ordenação de travas garante que a mesa nunca congela. Ela não garante que todos comam com a mesma frequência. Um filósofo que quase nunca come está perto da **inanição** (starvation), um problema diferente do deadlock: o sistema avança, mas não para ele.

## Como ler a evidência

O README do mini-projeto anota, linha por linha, o thread dump do programa Java congelado (tirado com `jstack`) e o dump de goroutines do programa Go congelado. As duas coisas a procurar em qualquer dump são as mesmas:

- threads bloqueadas em uma trava e que não usam tempo de processador;
- para cada uma delas, a trava que ela **segura** e a trava que ela **espera**. Siga essas duas e o círculo se fecha.

A JVM faz esse caminho sozinha e imprime `Found one Java-level deadlock`. O Go só detecta o caso em que todas as goroutines estão dormindo.

## Outras saídas

Não implementadas aqui, mas vale conhecer:

- **Tentar e recuar** (ataca posse e espera): pegue o segundo garfo com um `tryLock` e, se falhar, solte o primeiro e tente de novo. Feito sem cuidado, os cinco podem tentar de novo em sincronia para sempre. Isso é um **livelock**: todos ocupados e ninguém come.
- **Detecção e recuperação**: deixe acontecer, ache o ciclo e mate um participante. Bancos de dados fazem isso com transações.

## Quiz

Tópicos da área `concurrency` que este mini-projeto demonstra: `deadlock-livelock-starvation`, `classic-problems` e `semaphores-and-monitors`.
