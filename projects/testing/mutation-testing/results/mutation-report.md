# mutation-testing: mutation report

Written by `docker compose run --rm mutation`. Module under test: `ts/src/shipping.ts`.

| Suite | Line coverage | Mutants | Killed | Survived | Mutation score |
| --- | --- | --- | --- | --- | --- |
| weak (`tests/weak`) | 100% | 19 | 4 | 15 | 21.1% |
| strong (`tests/strong`) | 100% | 19 | 18 | 1 | 94.7% |

## Every mutant

| # | Line | Kind | Original | Mutant | Weak suite | Strong suite |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 15 | constant | `500` | `501` | survived | killed |
| 2 | 16 | constant | `2` | `3` | survived | killed |
| 3 | 17 | constant | `150` | `151` | survived | killed |
| 4 | 18 | constant | `100` | `101` | survived | killed |
| 5 | 19 | constant | `300` | `301` | survived | killed |
| 6 | 20 | constant | `2` | `3` | survived | killed |
| 7 | 21 | constant | `30` | `31` | survived | killed |
| 8 | 24 | operator | `>` | `>=` | killed | killed |
| 9 | 24 | constant | `0` | `1` | killed | killed |
| 10 | 24 | operator | `&&` | `\|\|` | killed | killed |
| 11 | 24 | operator | `<=` | `<` | survived | killed |
| 12 | 28 | operator | `!` | (removed) | killed | killed |
| 13 | 38 | operator | `>` | `>=` | survived | survived |
| 14 | 39 | operator | `+` | `-` | survived | killed |
| 15 | 39 | operator | `-` | `+` | survived | killed |
| 16 | 39 | operator | `*` | `/` | survived | killed |
| 17 | 41 | operator | `>=` | `>` | survived | killed |
| 18 | 42 | operator | `+` | `-` | survived | killed |
| 19 | 45 | operator | `*` | `/` | survived | killed |
