# Dez mil conexões

> English version: [docs/en/concurrency/ten-thousand-connections.md](../../en/concurrency/ten-thousand-connections.md) · Versión en español: [docs/es/concurrency/ten-thousand-connections.md](../../es/concurrency/ten-thousand-connections.md)

Mini-projeto: [projects/concurrency/ten-thousand-connections](../../../projects/concurrency/ten-thousand-connections/README.pt-BR.md) (MP-CONC-3). Linguagens: TypeScript, Go, Elixir.

## O problema

Um servidor passa a maior parte da vida esperando: a próxima requisição de um cliente, um banco de dados, outro serviço. O desenho mais simples dá a cada conexão uma thread do sistema operacional, e essa thread fica bloqueada enquanto espera. Funciona para centenas de conexões e desmorona com dezenas de milhares:

- cada thread reserva uma pilha (normalmente 8 MiB de espaço de endereçamento no Linux), use ou não;
- o kernel precisa escalonar todas as threads, e trocar de uma para outra custa tempo;
- nada disso compra alguma coisa, porque uma conexão esperando não faz trabalho nenhum.

Então a pergunta é: qual é a coisa mais barata que consegue representar "uma conexão que está esperando"? Os três servidores deste mini-projeto dão três respostas.

## Três respostas

| | TypeScript no Bun | Go | Elixir na BEAM |
| --- | --- | --- | --- |
| Modelo | Event loop | Goroutine por conexão | Processo por conexão |
| Quem espera | Ninguém. Um timer e uma promise ficam guardados, e a única thread volta para o loop | A goroutine. O runtime a estaciona e reaproveita a thread | O processo. O escalonador o pula até chegar uma mensagem ou um tempo limite |
| Uma conexão esperando é | Um socket e alguns objetos pequenos | A pilha de uma goroutine mais os buffers do `net/http` | Um processo com heap e pilha próprios e pequenos |
| O código parece | Assíncrono: `await` marca cada ponto em que ele pode pausar | Bloqueante: uma função comum que dorme | Bloqueante: uma função comum que dorme |
| Núcleos de processador usados | Um para o JavaScript | Todos | Todos |
| Cálculo demorado em um handler | Bloqueia todas as outras conexões | Interrompido pelo runtime | Interrompido pelo escalonador |
| Uma falha em uma conexão | Uma exceção a capturar, em estado compartilhado | Um panic, recuperado por requisição pelo `net/http` | Mata só aquele processo. Nada é compartilhado |

**Event loop.** Uma thread pergunta ao sistema operacional quais sockets estão prontos, roda o pequeno trecho de código de cada um e pergunta de novo. `await Bun.sleep(ms)` não para a thread: registra um timer e retorna. Isso é concorrência sem paralelismo. O ponto fraco é que um callback lento atrasa todo mundo.

**Goroutines.** O Go mantém o estilo "uma thread bloqueante por conexão" e torna a thread barata. Uma goroutine é escalonada pelo runtime do Go, não pelo kernel, começa com uma pilha de poucos kibibytes que cresce sob demanda, e quando bloqueia na rede o runtime a estaciona e roda outra na mesma thread. Por baixo também existe um event loop (o network poller), escondido do programador.

**Processos da BEAM.** A máquina virtual do Erlang vai um passo além: processos não compartilham memória e só conversam por mensagens. Cada um tem seu próprio heap e sua própria coleta de lixo, e o escalonador interrompe um processo depois de uma quantidade fixa de trabalho. Uma conexão é um processo, e a falha dele não consegue corromper outro.

## A medição

O cenário do k6 abre 10.000 conexões, cada uma um `GET /delay?ms=30000` que fica aberto e ocioso por 30 segundos. Enquanto elas são mantidas, ele mede:

- **memória por conexão**: o crescimento da memória residente do servidor, lida de `/proc/self/status`, dividido pelo número de requisições em andamento que o servidor informa;
- **latência de requisições novas**: 50 `POST /echo` por segundo, com p50, p95 e p99.

Os resultados da execução versionada estão em [results.md](../../../projects/concurrency/ten-thousand-connections/results/results.md): cerca de 4 KiB por conexão no Bun, 16 KiB em Go e 10 KiB em Elixir, com latência mediana abaixo de um milissegundo nos três. Os três modelos passam no teste com folga, e esse é o ponto: nenhum deles gasta uma thread com uma conexão que está esperando.

A comparação é justa porque uma única suíte de testes de protocolo passa contra os três servidores, então o cliente não consegue distingui-los.

### O que os números não dizem

- A carga só espera. Ela não diz nada sobre handlers pesados de processador, em que a única thread do event loop é o limite.
- A memória por conexão depende do que o handler mantém vivo. Um handler real guarda requisições interpretadas, sessões e buffers.
- O gerador de carga e os servidores dividem uma máquina, então a latência inclui o ruído do próprio k6 e de qualquer outra coisa rodando. Uma de duas execuções mostrou p99 de 361 ms para o Go, e a outra 10,57 ms.

## Somente alvos locais

Um teste de carga manda tráfego de verdade. Apontado para um host que não é seu, ele é um ataque, e basta um erro de digitação em uma variável de ambiente para isso acontecer por acidente. Este mini-projeto tem três barreiras:

1. `load/target.js` aceita apenas `localhost`, `127.0.0.1`, `[::1]` e os três nomes de serviço do docker-compose. A verificação roda antes de o k6 abrir qualquer conexão, e parecidos como `http://localhost@example.com` são recusados.
2. Um teste (`k6-refusal-test`) roda o k6 com `https://example.com` e só passa se o k6 terminar com a recusa.
3. A rede docker é `internal`: contêineres nela não têm rota para a internet.

## Quiz

Tópicos da área `concurrency` que este mini-projeto demonstra: `async-and-event-loop`, `actor-model-and-beam` e `concurrency-vs-parallelism`.
