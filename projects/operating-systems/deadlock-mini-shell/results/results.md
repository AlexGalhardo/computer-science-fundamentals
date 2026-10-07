# deadlock-mini-shell: results

Command: `docker compose run --rm demo`

The classification of every documented graph and state. The program is deterministic, so the output is the same on any machine. Each case is worked out by hand in `docs/en/operating-systems/deadlock-mini-shell.md`.

```
Resource allocation graphs (one instance per resource)
textbook, 7 processes  DEADLOCK     deadlocked: D, E, G    blocked behind the cycle: B
quiz, 5 processes      DEADLOCK     deadlocked: A, B, C    blocked behind the cycle: none
chain, 3 processes     no deadlock  deadlocked: none       blocked behind the cycle: none

Deadlock detection (several instances per resource)
original requests      deadlocked: none
with an extra request  deadlocked: P0, P1, P2

Banker's algorithm
single resource        safe         one safe sequence: P1, P2, P0
  P0 asks for 1 unit                   denied: the resulting state would be unsafe
  P1 asks for 1 unit                   granted
four resources         safe         one safe sequence: P3, P4, P0, P1, P2
  P1 asks for (0,0,1,0)                granted
  then P4 asks for (0,0,1,0)           denied: the resulting state would be unsafe
three resources        safe         one safe sequence: P1, P3, P4, P0, P2
  P1 asks for (1,0,2)                  granted
  then P4 asks for (3,3,0)             denied: not enough free resources, the process must wait
  then P0 asks for (0,2,0)             denied: the resulting state would be unsafe
quiz                   safe         one safe sequence: P1, P3, P0, P2
```
