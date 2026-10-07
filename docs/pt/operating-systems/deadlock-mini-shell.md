# Detecção de impasses e um mini shell

> English version: [docs/en/operating-systems/deadlock-mini-shell.md](../../en/operating-systems/deadlock-mini-shell.md)

Mini-projeto: [`projects/operating-systems/deadlock-mini-shell`](../../../projects/operating-systems/deadlock-mini-shell/). Item do plano: MP-OS-4. Tópicos do quiz: `operating-systems` / `deadlocks`, `introduction-and-system-calls` e `processes-and-threads`.

## O que ele ensina

Dois lados do mesmo assunto. O mini shell mostra como os processos são criados e conectados: `fork`, `exec`, `pipe`, `dup2`, `waitpid` e sinais. Os programas de impasse (deadlock) mostram o que pode dar errado quando processos seguram recursos e esperam por mais: como enxergar um impasse em um grafo, e como o algoritmo do banqueiro recusa os pedidos que poderiam levar a um.

## Parte 1: impasses (Go)

Um impasse de recursos exige quatro condições ao mesmo tempo: exclusão mútua, posse e espera, não preempção e espera circular.

### Grafo de alocação de recursos

Com uma instância por recurso, o estado é um grafo: um arco de um recurso para um processo significa "segura", e um arco de um processo para um recurso significa "está esperando por". Existe impasse exatamente quando o grafo tem um ciclo. O programa reduz o grafo a processos apenas (P espera por Q quando P pede um recurso que Q segura) e informa dois conjuntos:

- **em impasse**: os processos que estão em um ciclo;
- **bloqueados atrás do ciclo**: processos fora do ciclo que esperam por um recurso preso dentro dele. Eles não fazem parte da espera circular, mas também vão esperar para sempre.

Grafos conferidos pelos testes:

| Grafo | Posses e pedidos | Em impasse | Bloqueados atrás |
| --- | --- | --- | --- |
| De livro, 7 processos | A segura R, quer S. B quer T. C quer S. D segura U, quer S e T. E segura T, quer V. F segura W, quer S. G segura V, quer U | D, E, G | B |
| Do quiz, 5 processos | A segura R, quer S. B segura S, quer T. C segura T, quer R. D segura U, quer V. E quer U | A, B, C | nenhum |
| Cadeia, 3 processos | A segura R, quer S. B segura S, quer T. C segura T | nenhum | nenhum |

No primeiro grafo, o ciclo é D → T → E → V → G → U → D. S está livre, então A, C e F só esperam por um recurso livre. B espera por T, que E segura dentro do ciclo.

### Detecção com várias instâncias

Quando um tipo de recurso tem várias instâncias, um ciclo já não basta, e usam-se matrizes: o que está disponível, o que cada processo segura e o que cada processo está pedindo agora. O algoritmo procura um processo cujo pedido caiba no que está disponível, supõe que ele termina e devolve o que segura, e repete. Quem sobrar está em impasse.

Exemplo com disponível = (2, 1, 0, 0):

| Processo | Segura | Pede |
| --- | --- | --- |
| P0 | 0 0 1 0 | 2 0 0 1 |
| P1 | 2 0 0 1 | 1 0 1 0 |
| P2 | 0 1 2 0 | 2 1 0 0 |

P2 cabe e termina, deixando (2, 2, 2, 0). Depois P1 cabe, deixando (4, 2, 2, 1). Depois P0. Não há impasse. Se P2 pedir também uma unidade do último recurso, (2, 1, 0, 1), ninguém cabe, e os três ficam em impasse.

### Algoritmo do banqueiro

A detecção olha para o presente. A estratégia de evitar olha para o pior caso: cada processo declara de antemão a sua necessidade máxima, e um estado é **seguro** quando alguma ordem permite que todos os processos terminem mesmo que cada um peça o seu máximo. O banqueiro só atende a um pedido se o estado resultante for seguro. Inseguro não significa em impasse: significa que a garantia acabou.

Estados conferidos pelos testes:

**Um recurso, 10 unidades.** A segura 3 de no máximo 9, B segura 2 de no máximo 4, C segura 2 de no máximo 7, e 3 estão livres. Seguro: B precisa de 2 e termina, deixando 5. C precisa de 5 e termina, deixando 7. A precisa de 6.

- A pede 1: sobram 2 livres. B termina e deixa 4, mas A e C precisam de 5 cada. **Inseguro, negado.**
- B pede 1: sobram 2 livres, e B precisa de mais 1. **Seguro, atendido.**

**Quatro tipos de recurso, cinco processos.** Disponível (1, 0, 2, 0).

| Processo | Segura | Máximo | Ainda precisa |
| --- | --- | --- | --- |
| P0 | 3 0 1 1 | 4 1 1 1 | 1 1 0 0 |
| P1 | 0 1 0 0 | 0 2 1 2 | 0 1 1 2 |
| P2 | 1 1 1 0 | 4 2 1 0 | 3 1 0 0 |
| P3 | 1 1 0 1 | 1 1 1 1 | 0 0 1 0 |
| P4 | 0 0 0 0 | 2 1 1 0 | 2 1 1 0 |

Seguro: P3, P4, P0, P1, P2. P1 pede (0, 0, 1, 0): continua seguro, **atendido**. Depois P4 pede (0, 0, 1, 0): o disponível ficaria (1, 0, 0, 0), e nenhum processo cabe, **negado por ser inseguro**.

**Três tipos de recurso, cinco processos.** Disponível (3, 3, 2), posses (0 1 0), (2 0 0), (3 0 2), (2 1 1), (0 0 2), máximos (7 5 3), (3 2 2), (9 0 2), (2 2 2), (4 3 3). Seguro: P1, P3, P4, P0, P2. P1 pede (1, 0, 2): **atendido**. Depois P4 pede (3, 3, 0): só (2, 3, 0) está livre, **precisa esperar**. Depois P0 pede (0, 2, 0): **negado por ser inseguro**.

**Estado do quiz** (questão `operating-systems-deadlocks-05`): disponível (2, 1, 2), seguro. Das cinco ordens listadas na questão, só P1, P3, P2, P0 é uma sequência segura, e um teste reexecuta as cinco.

A saída completa da demo está em [`results/results.md`](../../../projects/operating-systems/deadlock-mini-shell/results/results.md).

## Parte 2: o mini shell (C++)

O `msh` lê uma linha, transforma-a em um pipeline e o executa.

```
sort < in.txt | uniq | wc -l > out.txt

  in.txt --> [ sort ] --pipe--> [ uniq ] --pipe--> [ wc -l ] --> out.txt
              filho 1            filho 2            filho 3
                   \________________|________________/
                        o shell espera pelos três
```

| Chamada de sistema | Papel no shell |
| --- | --- |
| `fork` | cria um filho por comando, uma cópia do shell |
| `pipe` | cria o canal entre dois vizinhos do pipeline |
| `dup2` | faz o pipe, ou um arquivo, virar a entrada ou a saída padrão do filho |
| `exec` | troca a cópia do shell no filho pelo programa pedido |
| `waitpid` | o shell espera por todos os filhos, para que nenhum fique como zumbi |

Três detalhes que o código explica no ponto em que acontecem:

- **Por que `fork` e `exec` são separados.** Entre os dois, o filho ainda executa o código do shell e pode reorganizar os próprios descritores. O programa novo apenas lê o descritor 0 e escreve no descritor 1.
- **Por que o shell fecha as suas cópias das pontas do pipe.** Um leitor só recebe fim de arquivo quando todas as pontas de escrita estão fechadas. Se o shell mantivesse uma aberta, o último comando esperaria para sempre. O teste `seq 1 100000 | head -n 3 | wc -l` confere o sentido oposto: quando o `head` termina, o `seq` precisa parar.
- **Por que `cd` é um comando embutido.** O diretório de trabalho é de cada processo. Um filho que o mudasse terminaria logo em seguida, deixando o shell onde estava.

### Sinais

O Ctrl-C faz o terminal enviar SIGINT a todos os processos do grupo em primeiro plano, inclusive o shell. O shell ignora o SIGINT, e cada filho restaura a ação padrão antes do `exec`, porque um sinal ignorado continua ignorado depois do `exec`. Assim, o pipeline em execução morre, e o shell continua. O shell informa `terminated by signal 2` e define o status como 128 + 2.

### O script de teste

`cpp/test_shell.sh` executa dentro do contêiner:

| Verificação | Comandos |
| --- | --- |
| Pipeline de três comandos | `printf ... \| sort \| uniq` |
| Três comandos com `<`, `>` e `>>` | `sort < in \| uniq \| wc -l > out`, depois `echo extra >> out` |
| Um leitor que termina cedo encerra o pipeline | `seq 1 100000 \| head -n 3 \| wc -l` |
| Aspas, `cd`, status de saída, `exit`, comando inexistente (127), erro de sintaxe (2) | vários |
| Interrupção | `sleep 30 \| cat \| cat` recebe SIGINT depois de um segundo: o pipeline para na hora, o shell imprime o aviso e executa a linha seguinte |

### O que o shell não faz

Não há variáveis, curingas, `&&` nem `;`, jobs em segundo plano, nem um grupo de processos por job: ele depende de o terminal entregar o Ctrl-C a todo o grupo em primeiro plano. É uma ferramenta de ensino.

## Como rodar

```sh
cd projects/operating-systems/deadlock-mini-shell
./setup-unix-deadlock-mini-shell.sh    # ou setup-windows-deadlock-mini-shell.ps1
docker compose run --rm demo           # relatório de impasses, grava results/
docker compose run --rm shell-demo     # um script no mini shell
docker compose run --rm shell          # mini shell interativo
```

## Duas linguagens

Aqui as linguagens fazem trabalhos diferentes, em vez de o mesmo trabalho duas vezes. Go combina com os algoritmos de grafo e de matrizes: slices, maps e testes orientados por tabela. C++ combina com o shell, porque `fork`, `exec`, `pipe` e `dup2` são interfaces em C do sistema operacional e podem ser chamadas diretamente.

## Fonte

Tanenbaum, Sistemas Operacionais Modernos (4ª edição), capítulo 6 (impasses) e capítulo 1, seções 1.5 e 1.6 (o shell e as chamadas de sistema para gerenciamento de processos).
