# dining-philosophers

> English version: [README.md](README.md)

Cinco filósofos sentam a uma mesa redonda com cinco garfos, um entre cada par. Para comer, um filósofo precisa dos dois garfos ao seu lado. Se os cinco pegarem o garfo da esquerda no mesmo instante, cada um espera para sempre pelo garfo da direita, que está na mão do vizinho. Isso é um deadlock. Este mini-projeto constrói a mesa que congela, em Go e em Java, mostra como ler o thread dump do programa congelado e depois a corrige de duas formas: ordenação de travas e um garçom (um semáforo).

A explicação mais longa, com as quatro condições do deadlock, está em [docs/pt/concurrency/dining-philosophers.md](../../../docs/pt/concurrency/dining-philosophers.md).

> A estratégia `naive` é **propositalmente errada** e está marcada assim no código.

## Tópicos do quiz que ele demonstra

- `concurrency` / `deadlock-livelock-starvation`: as quatro condições, espera circular, ordenação de travas, leitura de thread dump
- `concurrency` / `classic-problems`: o jantar dos filósofos e suas correções
- `concurrency` / `semaphores-and-monitors`: um semáforo contador usado como garçom

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-dining-philosophers.sh        # Linux e macOS
./setup-windows-dining-philosophers.ps1    # Windows
```

O script constrói as duas imagens e roda todos os testes. Leva cerca de três minutos, porque cada correção janta por 60 segundos.

## Estrutura

| Pasta | Garfos | Garçom |
| --- | --- | --- |
| `go/` | `sync.Mutex` | um canal com buffer de 4 posições |
| `java/` | `synchronized` em um objeto `Fork` | `java.util.concurrent.Semaphore` com 4 permissões |

As duas implementam as mesmas três estratégias:

| Estratégia | O que cada filósofo faz | Resultado |
| --- | --- | --- |
| `naive` | garfo da esquerda, depois o da direita | deadlock |
| `ordered` | primeiro o garfo de menor número | sem deadlock: o círculo de espera não consegue se fechar |
| `waiter` | pede um lugar ao garçom antes, e só 4 dos 5 podem estar sentados | sem deadlock: um círculo precisa dos cinco |

Entre o primeiro e o segundo garfo todo filósofo faz uma pausa de 1 ms. A pausa torna comum o azar no tempo, então a mesa ingênua congela em milissegundos em vez de uma vez a cada muito tempo. As correções usam a mesma pausa.

## Testes

```sh
docker compose run --rm go-test
docker compose run --rm java-test
```

| O que é testado | Como |
| --- | --- |
| A mesa ingênua entra em deadlock em pelo menos 9 de 10 execuções | um tempo limite sobre o progresso: ninguém comeu por 500 ms. Em Java, a JVM também precisa apontar as cinco threads em um ciclo de travas (`ThreadMXBean.findDeadlockedThreads`) |
| `ordered` e `waiter` rodam 60 segundos com todos os filósofos comendo | o contador de refeições de cada filósofo precisa estar acima de zero e a mesa nunca pode parar por 2 segundos |
| `ordered` realmente pega primeiro o garfo menor | teste unitário da ordem dos garfos |

`SOAK_SECONDS=5` encurta o jantar longo, por exemplo `docker compose run --rm -e SOAK_SECONDS=5 go-test`.

Formatadores e compiladores rodam nos mesmos contêineres, antes dos testes: `gofmt` e `go vet`, Spotless com google-java-format e `javac -Xlint:all -Werror`. O golangci-lint usa a configuração da raiz do repositório:

```sh
docker run --rm --network none -v "$PWD/go:/app:ro" -v "$PWD/../../..:/repo:ro" -w /app sef-go:local golangci-lint run -c /repo/.golangci.yml ./...
```

## Demo

```sh
docker compose run --rm go-demo
docker compose run --rm java-demo
```

Cada estratégia janta por 3 segundos. Saída versionada em [results/demo-go.txt](results/demo-go.txt) e [results/demo-java.txt](results/demo-java.txt):

```
strategy deadlock   meals per philosopher
naive    true       [0 0 0 0 0]
ordered  false      [189 377 754 2266 191]
waiter   false      [1468 1468 1469 1468 1470]
```

Duas coisas para notar. A mesa ingênua não serviu nada: congelou na primeira rodada. E `ordered` nunca congela, mas é injusta: o filósofo 3 comeu cerca de doze vezes mais que o filósofo 0. A ordenação de travas elimina o deadlock, não o risco de inanição. No teste de 60 segundos todo filósofo ainda comeu milhares de vezes em Go, e pelo menos cem vezes em Java.

## O thread dump do deadlock, linha por linha

```sh
docker compose run --rm java-dump    # jstack na JVM congelada
docker compose run --rm go-dump      # a pilha de cada goroutine
```

As capturas completas estão em [results/thread-dump-java.txt](results/thread-dump-java.txt) e [results/goroutine-dump-go.txt](results/goroutine-dump-go.txt).

### Java (`jstack`)

Um thread dump lista todas as threads da JVM. As que importam são os cinco filósofos. Este é o primeiro, e os outros quatro têm o mesmo formato:

| Linha do dump | O que ela diz |
| --- | --- |
| `"philosopher-0" #34 [30] daemon prio=5 os_prio=0 cpu=1.15ms elapsed=3.25s tid=0x0000798fe8174070 nid=30 waiting for monitor entry  [0x0000798f97afe000]` | O nome que demos à thread, o número dela na JVM (`#34`) e no sistema operacional (`[30]`, `nid=30`). `cpu=1.15ms` contra `elapsed=3.25s`: em mais de três segundos de vida ela usou um milissegundo de processador. Não está trabalhando, está presa. `waiting for monitor entry` quer dizer que ela está na porta de um bloco `synchronized` |
| `java.lang.Thread.State: BLOCKED (on object monitor)` | O estado da thread. `BLOCKED` é exatamente "esperando uma trava que outra thread segura". Uma thread que dorme ou espera uma notificação estaria em `TIMED_WAITING` ou `WAITING` |
| `at philosophers.Table.lambda$run$0(Table.java:122)` | Onde ela parou: dentro do laço do filósofo em `Table.run`, no `synchronized` de dentro, o do segundo garfo |
| `- waiting to lock <0x0000000716236fd0> (a philosophers.Table$Fork)` | A trava que ela quer: o objeto no endereço `...6fd0`, que é um `Fork`. É o segundo garfo dela |
| `- locked <0x0000000716236fc0> (a philosophers.Table$Fork)` | A trava que ela já segura: o `Fork` em `...6fc0`, o primeiro garfo. Segurar uma e esperar outra é a condição "posse e espera", visível em duas linhas |
| `at philosophers.Table$$Lambda/0x0000000063041410.run(Unknown Source)` | A lambda passada para `new Thread(...)`. Não tem linha de código-fonte porque a JVM gera essa classe em tempo de execução |
| `at java.lang.Thread.runWith(java.base@25.0.4.1/Thread.java:1487)` e `at java.lang.Thread.run(java.base@25.0.4.1/Thread.java:1474)` | O fundo de toda pilha de thread: o código do JDK que iniciou a thread |

Siga os endereços e o círculo aparece. `philosopher-0` espera `...6fd0`, e no bloco seguinte `philosopher-1` tem `locked <...6fd0>` e espera `...6fe0`, e assim por diante até `philosopher-4`, que espera `...6fc0`, que está com `philosopher-0`.

Ninguém precisa seguir os endereços à mão, porque a JVM faz isso e imprime o ciclo no fim do dump:

| Linha do dump | O que ela diz |
| --- | --- |
| `Found one Java-level deadlock:` | A JVM percorreu o grafo "thread espera uma trava que está com outra thread" e achou um ciclo. "Java-level" quer dizer que as travas são monitores Java, não nativos |
| `"philosopher-0":` | Primeira thread do ciclo |
| `waiting to lock monitor 0x0000798f78002430 (object 0x0000000716236fd0, a philosophers.Table$Fork),` | O que ela espera. O endereço do objeto é o mesmo `...6fd0` da pilha acima. O endereço do monitor é a estrutura interna de trava da JVM para aquele objeto |
| `which is held by "philosopher-1"` | Quem tem essa trava. É uma aresta do ciclo: 0 espera 1 |
| `"philosopher-1": ... which is held by "philosopher-2"` | As arestas seguintes, com as mesmas duas linhas cada: 1 espera 2, 2 espera 3, 3 espera 4 |
| `"philosopher-4": ... which is held by "philosopher-0"` | A aresta que fecha o círculo: 4 espera 0. É a condição "espera circular", escrita pela própria JVM |
| `Java stack information for the threads listed above:` | As pilhas das threads do ciclo são repetidas abaixo desta linha, para o relatório poder ser lido sozinho |
| `Found 1 deadlock.` | O resumo. Uma JVM saudável não imprime essa seção |

### Go (dump de goroutines)

O Go não tem relatório de ciclo embutido, mas o dump traz a mesma informação. Um bloco por goroutine:

| Linha do dump | O que ela diz |
| --- | --- |
| `goroutine 19 [sync.Mutex.Lock]:` | A goroutine número 19 e, entre colchetes, por que ela não está rodando: está bloqueada dentro de `sync.Mutex.Lock`. Uma goroutine presa há mais de um minuto também mostra o tempo, por exemplo `[sync.Mutex.Lock, 2 minutes]` |
| `internal/sync.runtime_SemacquireMutex(0x0?, 0x0?, 0x0?)` e `/usr/local/go/src/runtime/sema.go:95 +0x25` | O quadro mais fundo: o runtime pôs a goroutine para dormir no semáforo interno do mutex. Todo quadro ocupa duas linhas: a função e, depois, o arquivo e a linha |
| `internal/sync.(*Mutex).lockSlow(0x1a9431996008)` | O caminho lento de `Lock`, usado quando o mutex já está ocupado. O argumento é o endereço do mutex: `...6008`. Os garfos são um slice de mutexes de 8 bytes que começa em `...6000`, então este é o garfo 1 |
| `internal/sync.(*Mutex).Lock(...)` e `sync.(*Mutex).Lock(...)` | A chamada pública de `Lock`. `(...)` quer dizer que o compilador embutiu a função (inline), então os argumentos não aparecem |
| `dining-philosophers.Run.func1()` e `/src/philosophers.go:112 +0x1fe` | O nosso código: o laço do filósofo, parado na linha 112, `table[second].Lock()`. Ele já travou o primeiro garfo duas linhas acima |
| `sync.(*WaitGroup).Go.func1()` | O invólucro que `wg.Go` põe em volta da nossa função |
| `created by sync.(*WaitGroup).Go in goroutine 1` | Quem iniciou esta goroutine: a goroutine principal |

As cinco goroutines de filósofos (19 a 23) estão todas em `[sync.Mutex.Lock]` na mesma linha 112, esperando os mutexes em `...6008`, `...6010`, `...6018`, `...6020` e `...6000`: garfos 1, 2, 3, 4 e 0. Cada uma espera o garfo que a seguinte pegou primeiro. O dump não diz quem segura um mutex, porque um mutex do Go não tem dono: o círculo é deduzido a partir do código.

A goroutine 1 está `[running]`: é a goroutine principal escrevendo o dump. Se ela também estivesse bloqueada, o runtime do Go pararia o programa sozinho com `fatal error: all goroutines are asleep - deadlock!`. Essa verificação só funciona quando todas as goroutines estão presas, o que é raro em um servidor de verdade.
