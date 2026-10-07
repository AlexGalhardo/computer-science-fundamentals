# Order state machine

> Versão em português: [docs/pt/state-machines/order-state-machine.md](../../pt/state-machines/order-state-machine.md)

Mini-project MP-FSM-1, in [`projects/state-machines/order-state-machine`](../../../projects/state-machines/order-state-machine). It teaches how explicit states and transitions remove invalid situations. Languages: TypeScript and Elixir.

## The problem with flags

A common way to store the situation of an order is one boolean per fact: `isPaid`, `isShipped`, `isDelivered`, `isCancelled`, `isRefunded`. Five booleans can be combined in 2^5 = 32 ways, and the business knows only 6 situations. The other 26 combinations, such as "cancelled and delivered", mean nothing, yet the database stores them without complaint. Every function that reads the order must then defend itself against them.

A state machine turns this around. The order has **one** state field with a closed set of values, and the allowed changes are listed in **one** table. What is not in the table does not happen.

## The machine

States: `created`, `paid`, `shipped`, `delivered`, `cancelled`, `refunded`. Events: `pay`, `ship`, `deliver`, `cancel`, `refund`.

| state | pay | ship | deliver | cancel | refund |
| --- | --- | --- | --- | --- | --- |
| created | paid | - | - | cancelled | - |
| paid | - | shipped | - | - | refunded |
| shipped | - | - | delivered | - | - |
| delivered | - | - | - | - | refunded |
| cancelled | - | - | - | - | - |
| refunded | - | - | - | - | - |

The table is a partial function from (state, event) to the next state. There are 6 × 5 = 30 pairs: 6 are defined and 24 are rejected. `cancelled` and `refunded` have empty rows, so they are terminal states. The business decisions are visible in the table: an order can be cancelled only before payment, after payment the way back is a refund, and a parcel in transit can be neither cancelled nor refunded until it is delivered.

The table lives in [`machine.json`](../../../projects/state-machines/order-state-machine/machine.json) and both implementations read that one file.

## Rules as data, mechanism as code

The TypeScript implementation separates two things:

- **The rules** are data. `machine.json` is validated with Zod when it is loaded: only known states and events, and at most one target for each (state, event) pair. That last check is what makes the machine deterministic.
- **The mechanism** is one generic function, `transition(state, event)`, which looks the pair up. It never mentions a state by name. It returns either `{ ok: true, state }` or `{ ok: false, reason }`, so the caller cannot use the new state without checking that there is one, and a rejected event changes nothing.

Running an order through n events costs n lookups, whatever the number of states. This is the way a deterministic finite automaton runs.

States and events are also closed TypeScript types. `labels.ts` has a `switch` over the states that ends in an exhaustiveness check: adding a state to the list and forgetting it there is a compile error, not a surprise in production.

## The same table in Elixir

The lesson changes in Elixir, which is why the mini-project has a second language. The module reads `machine.json` at compile time and writes one function clause per row:

```elixir
def transition(:created, :pay), do: {:ok, :paid}
def transition(:created, :cancel), do: {:ok, :cancelled}
# ...one clause per row of the table...
def transition(state, event), do: {:error, {:invalid_transition, state, event}}
```

The lookup is done by pattern matching: clauses are tried from top to bottom, and the catch-all clause at the end turns every other pair into an explicit error. The order of the clauses matters. The text typed on the command line is matched against the known event names and is never converted into a new atom.

## Tests generated from the table

The main test is not a list of hand-written cases. It is a loop over all the (state, event) pairs:

- the 6 pairs in the table must succeed and reach the target of the table;
- the 24 others must be rejected and leave the order in the same state.

A new state or a new event adds its positive and negative cases without anyone writing them. One extra test pins the numbers 30, 6 and 24, so that an accidental change in the table shows up in review.

## The diagram cannot go stale

[`diagram.md`](../../../projects/state-machines/order-state-machine/diagram.md) holds a Mermaid state diagram and the table above. It is generated from `machine.json` by one command and committed, so it can be read on GitHub. A test compares the committed file with what the generator produces and fails when they differ.

The Elixir implementation renders the same text on its own and has the same test. If the two languages ever disagreed about the table, one of the two tests would fail, so the file also proves that both implement the same machine.

## Running it

```sh
./setup-unix-order-state-machine.sh        # Linux and macOS
./setup-windows-order-state-machine.ps1    # Windows
```

The only requirement is Docker. The script builds the images, runs the tests and runs the demo: a full order (`pay`, `ship`, `deliver`) and an order in which `deliver` arrives before `ship` and is rejected.

```sh
docker compose run --rm ts-demo bun run order pay pay       # a duplicated payment is rejected
docker compose run --rm elixir-demo mix order pay refund    # paid, then refunded (terminal)
docker compose run --rm ts-diagram                          # regenerate diagram.md
```

## What it leaves out

The machine is a pure function. A real system also has to store the state and survive concurrency and failures: two requests that read the same state need an atomic conditional update, and a transition with an external effect, such as charging a card, needs that effect to be idempotent. Guards, entry and exit actions and hierarchical states are not used either. These topics are covered by the quiz.

## Quiz

The mini-project is linked from the questions of the `state-machines` area that it demonstrates, in the topics `states-transitions-events-actions`, `deterministic-finite-automata` and `state-machines-in-software`.
