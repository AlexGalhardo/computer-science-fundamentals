# Deadlock: dining philosophers

> Versão em português: [docs/pt/concurrency/dining-philosophers.md](../../pt/concurrency/dining-philosophers.md) · Versión en español: [docs/es/concurrency/dining-philosophers.md](../../es/concurrency/dining-philosophers.md)

Mini-project: [projects/concurrency/dining-philosophers](../../../projects/concurrency/dining-philosophers/README.md) (MP-CONC-2). Languages: Go, Java.

## The problem

Five philosophers, five forks, and each philosopher needs the two forks next to him to eat. A fork is a lock: one holder at a time.

```text
            P0
       f0        f1
    P4              P1
       f4        f2
         P3  f3  P2
```

Philosopher `i` sits between fork `i` (left) and fork `i+1` (right). The last one, P4, sits between fork 4 and fork 0.

The naive rule is "take the left fork, then the right fork". When all five take the left fork at the same moment, P0 waits for fork 1 (held by P1), P1 for fork 2, and so on until P4, which waits for fork 0, held by P0. Nobody can go on and nobody will ever let go. That is a deadlock.

A deadlock raises no error. The program is alive, uses no processor and does nothing. From the outside it is detected by a **timeout on progress**, which is what the tests do: nobody ate for 500 ms.

## The four conditions

A deadlock on resources needs four conditions at the same time (Coffman conditions):

| Condition | At the table |
| --- | --- |
| Mutual exclusion | A fork has one holder at a time |
| Hold and wait | A philosopher keeps the first fork while waiting for the second |
| No preemption | Nobody can take a fork out of another philosopher's hand |
| Circular wait | P0 waits for P1, P1 for P2, P2 for P3, P3 for P4 and P4 for P0 |

All four are necessary. Remove one, any one, and the deadlock is impossible. Both fixes of the mini-project attack the last condition.

## Fix 1: lock ordering

Give the locks a global order and always take the lower one first. Forks are numbered 0 to 4. Four philosophers do not change: for P0 to P3 the left fork is already the lower one. Only P4 changes: he now takes fork 0 before fork 4.

A circle of waiting would need somebody holding a higher fork while waiting for a lower one, and the rule forbids exactly that. This is the most common fix in real code: "always lock accounts by ascending id", "always lock the parent before the child".

## Fix 2: a waiter

A counting semaphore with 4 permits plays the waiter: a philosopher needs a permit before touching a fork, and gives it back after eating. With at most four philosophers competing for five forks, at least one of them always gets two. A circle needs all five, so it cannot form.

The semaphore here is not a mutex: it does not protect a critical section, it limits how many threads may be in a region at once.

## No deadlock is not fairness

In the measurements, `waiter` gives every philosopher almost the same number of meals, while `ordered` is very uneven: in one 60-second run in Go the philosophers ate 3830, 7664, 15333, 45993 and 3830 times. Lock ordering guarantees that the table never freezes. It does not guarantee that everybody eats equally often. A philosopher who rarely eats is close to **starvation**, a different problem from deadlock: the system makes progress, but not for him.

## Reading the evidence

The README of the mini-project annotates, line by line, the thread dump of the frozen Java program (taken with `jstack`) and the goroutine dump of the frozen Go program. The two things to look for in any dump are the same:

- threads that are blocked on a lock and use no processor time;
- for each of them, the lock it **holds** and the lock it **waits for**. Follow those and the circle closes.

The JVM does that walk by itself and prints `Found one Java-level deadlock`. Go only detects the case where every goroutine is asleep.

## Other ways out

Not implemented here, and worth knowing:

- **Try and back off** (attacks hold and wait): take the second fork with a `tryLock`, and when it fails, put the first one down and retry. Done carelessly, all five can retry in step forever. That is a **livelock**: everybody is busy and nobody eats.
- **Detection and recovery**: let it happen, find the cycle and kill one participant. Databases do this with transactions.

## Quiz

Topics of the `concurrency` area that this mini-project demonstrates: `deadlock-livelock-starvation`, `classic-problems` and `semaphores-and-monitors`.
