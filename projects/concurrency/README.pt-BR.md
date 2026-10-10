# Concorrência

> English version: [README.md](README.md) · Versión en español: [README.es.md](README.es.md)

Concorrência é a arte de estruturar um programa como várias atividades que avançam em tempos sobrepostos e compartilham estado com segurança. É onde vivem os bugs mais difíceis (condições de corrida, deadlocks, inanição), e cada linguagem responde de um jeito: travas e operações atômicas, canais, atores ou um laço de eventos. Conhecer os modelos permite escolher um deles de propósito.

## Miniprojetos

| Miniprojeto | O que ensina | Situação |
| --- | --- | --- |
| [Condição de corrida no contador](counter-race/) | Por que estado compartilhado sem sincronização perde atualizações, e quatro formas de corrigir | disponível |
| [Deadlock: jantar dos filósofos](dining-philosophers/) | As quatro condições do deadlock e como quebrar uma delas o elimina | disponível |
| [Dez mil conexões](ten-thousand-connections/) | Como laços de eventos, goroutines e processos da BEAM lidam com muitas conexões ociosas | disponível |

## Quiz e documentação

- Perguntas do quiz: [quiz/content/concurrency/](../../quiz/content/concurrency/)
- Documentação: [docs/pt/concurrency/](../../docs/pt/concurrency/)
- Referências de todas as áreas: [REFERENCES.pt-BR.md](../../REFERENCES.pt-BR.md)

## Referências

Fontes selecionadas, não uma lista exaustiva. Todos os links foram verificados quando a lista foi escrita.

### Comece por aqui

- [Concurrency is not parallelism](https://go.dev/blog/waza-talk), Rob Pike, The Go Blog. Gratuito. A palestra e os slides que separam as duas ideias: concorrência é estrutura, paralelismo é execução.
- [The Little Book of Semaphores](https://greenteapress.com/wp/semaphores/), Allen B. Downey. Gratuito. Livro gratuito de quebra-cabeças de sincronização, do mutex ao jantar dos filósofos e leitores-escritores.
- [Concorrência e Paralelismo (Parte 1)](https://akitaonrails.com/2019/03/13/akitando-43-concorrencia-e-paralelismo-parte-1-entendendo-back-end-para-iniciantes-parte-3/), Fabio Akita, Akitando. Em português. Gratuito. Vídeo com transcrição completa em português sobre processos, threads e quanto custam ao sistema operacional.
- [The Deadlock Empire](https://deadlockempire.github.io/), Petr Hudeček and Michal Pokorný. Gratuito. Jogo de navegador em que você faz o papel do escalonador e quebra programas concorrentes defeituosos.

### Livros

- [Operating Systems: Three Easy Pieces (Concurrency part)](https://pages.cs.wisc.edu/~remzi/OSTEP/), Remzi and Andrea Arpaci-Dusseau. Gratuito online, pago impresso. Capítulos gratuitos sobre threads, travas, variáveis de condição, semáforos e bugs comuns de concorrência.
- [Java Concurrency in Practice](https://jcip.net/), Brian Goetz and others. Pago. O clássico sobre segurança entre threads, visibilidade, modelo de memória e pools de threads.
- [Rust Atomics and Locks](https://mara.nl/atomics/), Mara Bos. Gratuito online, pago impresso. Leitura online gratuita: operações atômicas, ordenação de memória e como construir um mutex e um canal do zero.
- [Seven Concurrency Models in Seven Weeks](https://pragprog.com/titles/pb7con/seven-concurrency-models-in-seven-weeks/), Paul Butcher. Pago. Compara threads e travas, programação funcional, atores, CSP e paralelismo de dados em exemplos pequenos.

### Cursos e aulas

- [A Tour of Go: Concurrency](https://go.dev/tour/concurrency/1), The Go Authors. Gratuito. Exercícios interativos sobre goroutines, canais, select e mutexes.
- [CS 162 Operating Systems and Systems Programming](https://cs162.org/), UC Berkeley. Gratuito. As aulas de sincronização cobrem travas, semáforos, monitores e deadlock com rigor.

### Artigos e especificações

- [Communicating Sequential Processes](https://www.cs.cmu.edu/~crary/819-f09/Hoare78.pdf), C. A. R. Hoare (1978). Gratuito. O artigo por trás dos canais de Go e de muitas outras linguagens: processos que só se comunicam por mensagens.
- [Making reliable distributed systems in the presence of software errors](https://erlang.org/download/armstrong_thesis_2003.pdf), Joe Armstrong (2003). Gratuito. A tese que explica o projeto do Erlang e da BEAM: processos isolados, mensagens e supervisão.
- [The C10K problem](http://www.kegel.com/c10k.html), Dan Kegel. Gratuito. A página que formulou como um servidor pode atender dez mil clientes, comparando estratégias de E/S.

### Documentação oficial

- [The Go Memory Model](https://go.dev/ref/mem), The Go Authors. Gratuito. As regras oficiais de quando uma goroutine tem a garantia de ver o que outra escreveu.
- [The Rust Programming Language: Fearless Concurrency](https://doc.rust-lang.org/book/ch16-00-concurrency.html), The Rust Project. Gratuito. Como a posse e as traits Send e Sync transformam corridas de dados em erros de compilação.
- [Elixir: Processes](https://hexdocs.pm/elixir/processes.html), The Elixir Team. Gratuito. O guia oficial para criar processos, enviar mensagens e manter estado no modelo de atores.
- [The Java Tutorials: Concurrency](https://docs.oracle.com/javase/tutorial/essential/concurrency/), Oracle. Gratuito. Threads, sincronização, problemas de vivacidade e os utilitários de concorrência de alto nível do Java.
- [The Node.js Event Loop](https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick), OpenJS Foundation. Gratuito. A descrição oficial das fases do laço de eventos e de onde callbacks e promises executam.

### Vídeos

- [What the heck is the event loop anyway?](https://www.youtube.com/watch?v=8aGhZQkoFbQ), Philip Roberts, JSConf EU. Gratuito. A explicação visual mais clara da pilha de chamadas, da fila de tarefas e do laço de eventos do JavaScript.
- [In The Loop](https://www.youtube.com/watch?v=cCOL7MC4Pl0), Jake Archibald, JSConf Asia. Gratuito. Um olhar mais profundo sobre tarefas, microtarefas e renderização no laço de eventos do navegador.
- [Concorrência e Paralelismo (Parte 2)](https://www.youtube.com/watch?v=gYJSWs-gp1g), Fabio Akita, Akitando. Em português. Gratuito. A segunda parte da série em português: como as threads se coordenam e quanto custam.

### Prática e ferramentas

- [Go Data Race Detector](https://go.dev/doc/articles/race_detector), The Go Authors. Gratuito. Como encontrar corridas de dados automaticamente ao rodar os testes.

### Comunidades

- [Stack Overflow: concurrency tag](https://stackoverflow.com/questions/tagged/concurrency), Stack Overflow. Gratuito. Perguntas respondidas sobre travas, visibilidade e deadlocks em todas as linguagens.
- [Elixir Forum](https://elixirforum.com/), Elixir community. Gratuito. Fórum acolhedor para dúvidas sobre processos, OTP e a BEAM.
