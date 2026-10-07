# Deadlock detection and a mini shell

> Versão em português: [docs/pt/operating-systems/deadlock-mini-shell.md](../../pt/operating-systems/deadlock-mini-shell.md)

Mini-project: [`projects/operating-systems/deadlock-mini-shell`](../../../projects/operating-systems/deadlock-mini-shell/). Plan item: MP-OS-4. Quiz topics: `operating-systems` / `deadlocks`, `introduction-and-system-calls` and `processes-and-threads`.

## What it teaches

Two sides of the same subject. The mini shell shows how processes are created and connected: `fork`, `exec`, `pipe`, `dup2`, `waitpid` and signals. The deadlock programs show what can go wrong when processes hold resources and wait for more: how to see a deadlock in a graph, and how the banker's algorithm refuses the requests that could lead to one.

## Part 1: deadlocks (Go)

A resource deadlock needs four conditions at the same time: mutual exclusion, hold and wait, no preemption and circular wait.

### Resource allocation graph

With one instance per resource, the state is a graph: an arc from a resource to a process means "holds", and an arc from a process to a resource means "is waiting for". There is a deadlock exactly when the graph has a cycle. The program reduces the graph to processes only (P waits for Q when P requests a resource that Q holds) and reports two sets:

- **deadlocked**: the processes on a cycle;
- **blocked behind the cycle**: processes outside the cycle that wait for a resource held inside it. They are not part of the circular wait, but they will wait forever too.

Graphs checked by the tests:

| Graph | Holds and requests | Deadlocked | Blocked behind |
| --- | --- | --- | --- |
| Textbook, 7 processes | A holds R, wants S. B wants T. C wants S. D holds U, wants S and T. E holds T, wants V. F holds W, wants S. G holds V, wants U | D, E, G | B |
| Quiz, 5 processes | A holds R, wants S. B holds S, wants T. C holds T, wants R. D holds U, wants V. E wants U | A, B, C | none |
| Chain, 3 processes | A holds R, wants S. B holds S, wants T. C holds T | none | none |

In the first graph the cycle is D → T → E → V → G → U → D. S is free, so A, C and F only wait for a free resource. B waits for T, which E holds inside the cycle.

### Detection with several instances

When a resource type has several instances, a cycle is no longer enough and matrices are used: what is available, what each process holds, and what each process is requesting now. The algorithm looks for a process whose request fits in what is available, assumes it finishes and returns what it holds, and repeats. Whoever is left is deadlocked.

Example with available = (2, 1, 0, 0):

| Process | Holds | Requests |
| --- | --- | --- |
| P0 | 0 0 1 0 | 2 0 0 1 |
| P1 | 2 0 0 1 | 1 0 1 0 |
| P2 | 0 1 2 0 | 2 1 0 0 |

P2 fits and finishes, leaving (2, 2, 2, 0). Then P1 fits, leaving (4, 2, 2, 1). Then P0. No deadlock. If P2 also asks for one unit of the last resource, (2, 1, 0, 1), nobody fits and all three are deadlocked.

### Banker's algorithm

Detection looks at the present. Avoidance looks at the worst case: each process declares its maximum need in advance, and a state is **safe** when some order lets every process finish even if each one asks for its maximum. The banker grants a request only if the resulting state is safe. Unsafe does not mean deadlocked: it means the guarantee is gone.

States checked by the tests:

**Single resource, 10 units.** A holds 3 of at most 9, B holds 2 of at most 4, C holds 2 of at most 7, and 3 are free. Safe: B needs 2 and finishes, leaving 5. C needs 5 and finishes, leaving 7. A needs 6.

- A asks for 1: 2 stay free. B finishes and leaves 4, but A and C both need 5. **Unsafe, denied.**
- B asks for 1: 2 stay free and B needs 1 more. **Safe, granted.**

**Four resource types, five processes.** Available (1, 0, 2, 0).

| Process | Holds | Maximum | Still needs |
| --- | --- | --- | --- |
| P0 | 3 0 1 1 | 4 1 1 1 | 1 1 0 0 |
| P1 | 0 1 0 0 | 0 2 1 2 | 0 1 1 2 |
| P2 | 1 1 1 0 | 4 2 1 0 | 3 1 0 0 |
| P3 | 1 1 0 1 | 1 1 1 1 | 0 0 1 0 |
| P4 | 0 0 0 0 | 2 1 1 0 | 2 1 1 0 |

Safe: P3, P4, P0, P1, P2. P1 asks for (0, 0, 1, 0): still safe, **granted**. Then P4 asks for (0, 0, 1, 0): available would be (1, 0, 0, 0) and no process fits, **denied as unsafe**.

**Three resource types, five processes.** Available (3, 3, 2), holds (0 1 0), (2 0 0), (3 0 2), (2 1 1), (0 0 2), maxima (7 5 3), (3 2 2), (9 0 2), (2 2 2), (4 3 3). Safe: P1, P3, P4, P0, P2. P1 asks for (1, 0, 2): **granted**. Then P4 asks for (3, 3, 0): only (2, 3, 0) is free, **must wait**. Then P0 asks for (0, 2, 0): **denied as unsafe**.

**Quiz state** (question `operating-systems-deadlocks-05`): available (2, 1, 2), safe. Of the five orders listed in the question only P1, P3, P2, P0 is a safe sequence, and a test replays all five.

The full output of the demo is in [`results/results.md`](../../../projects/operating-systems/deadlock-mini-shell/results/results.md).

## Part 2: the mini shell (C++)

`msh` reads a line, parses it into a pipeline and runs it.

```
sort < in.txt | uniq | wc -l > out.txt

  in.txt --> [ sort ] --pipe--> [ uniq ] --pipe--> [ wc -l ] --> out.txt
              child 1            child 2            child 3
                   \________________|________________/
                        the shell waits for all three
```

| System call | Role in the shell |
| --- | --- |
| `fork` | creates one child per command, a copy of the shell |
| `pipe` | creates the channel between two neighbours of the pipeline |
| `dup2` | makes the pipe, or a file, become standard input or output of the child |
| `exec` | replaces the copy of the shell in the child with the program asked for |
| `waitpid` | the shell waits for every child, so that none is left as a zombie |

Three details that the code explains where they happen:

- **Why `fork` and `exec` are separate.** Between the two, the child still runs the shell's code and can rearrange its own descriptors. The new program just reads descriptor 0 and writes descriptor 1.
- **Why the shell closes its copies of the pipe ends.** A reader gets end-of-file only when every write end is closed. If the shell kept one open, the last command would wait forever. The test `seq 1 100000 | head -n 3 | wc -l` checks the opposite direction: when `head` exits, `seq` must stop.
- **Why `cd` is a builtin.** The working directory belongs to each process. A child that changed it would exit right after, leaving the shell where it was.

### Signals

Ctrl-C makes the terminal send SIGINT to every process of the foreground group, the shell included. The shell ignores SIGINT, and each child restores the default action before `exec`, because an ignored signal stays ignored across `exec`. So the running pipeline dies and the shell goes on. The shell reports `terminated by signal 2` and sets the status to 128 + 2.

### The test script

`cpp/test_shell.sh` runs inside the container:

| Check | Commands |
| --- | --- |
| Pipeline of three commands | `printf ... \| sort \| uniq` |
| Three commands with `<`, `>` and `>>` | `sort < in \| uniq \| wc -l > out`, then `echo extra >> out` |
| A reader that exits early ends the pipeline | `seq 1 100000 \| head -n 3 \| wc -l` |
| Quotes, `cd`, exit status, `exit`, unknown command (127), syntax error (2) | several |
| Interrupt | `sleep 30 \| cat \| cat` receives SIGINT after one second: the pipeline stops at once, the shell prints the report and runs the next line |

### What the shell does not do

No variables, no globbing, no `&&` or `;`, no background jobs, and no process group per job: it relies on the terminal delivering Ctrl-C to the whole foreground group. It is a teaching tool.

## Run it

```sh
cd projects/operating-systems/deadlock-mini-shell
./setup-unix-deadlock-mini-shell.sh    # or setup-windows-deadlock-mini-shell.ps1
docker compose run --rm demo           # deadlock report, writes results/
docker compose run --rm shell-demo     # a script in the mini shell
docker compose run --rm shell          # interactive mini shell
```

## Two languages

Here the languages do different jobs instead of the same one twice. Go suits the graph and matrix algorithms: slices, maps and table-driven tests. C++ suits the shell, because `fork`, `exec`, `pipe` and `dup2` are C interfaces of the operating system and can be called directly.

## Source

Tanenbaum, Modern Operating Systems (4th edition), chapter 6 (deadlocks) and chapter 1, sections 1.5 and 1.6 (the shell and system calls for process management).
