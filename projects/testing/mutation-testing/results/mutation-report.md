# mutation-testing: mutation report

Written by `docker compose run --rm mutation`. Module under test: `ts/src/shipping.ts`.

| Suite | Line coverage | Mutants | Killed | Survived | Mutation score |
| --- | --- | --- | --- | --- | --- |
| weak (`tests/weak`) | 100% | 19 | 4 | 15 | 21.1% |
| strong (`tests/strong`) | 100% | 19 | 18 | 1 | 94.7% |

## Every mutant

| # | Line | Kind | Original | Mutant | Weak suite | Strong suite |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 19 | constant | `500` | `501` | survived | killed |
| 2 | 20 | constant | `2` | `3` | survived | killed |
| 3 | 21 | constant | `150` | `151` | survived | killed |
| 4 | 22 | constant | `100` | `101` | survived | killed |
| 5 | 23 | constant | `300` | `301` | survived | killed |
| 6 | 24 | constant | `2` | `3` | survived | killed |
| 7 | 25 | constant | `30` | `31` | survived | killed |
| 8 | 28 | operator | `>` | `>=` | killed | killed |
| 9 | 28 | constant | `0` | `1` | killed | killed |
| 10 | 28 | operator | `&&` | `\|\|` | killed | killed |
| 11 | 28 | operator | `<=` | `<` | survived | killed |
| 12 | 32 | operator | `!` | (removed) | killed | killed |
| 13 | 45 | operator | `>` | `>=` | survived | survived |
| 14 | 46 | operator | `+` | `-` | survived | killed |
| 15 | 46 | operator | `-` | `+` | survived | killed |
| 16 | 46 | operator | `*` | `/` | survived | killed |
| 17 | 48 | operator | `>=` | `>` | survived | killed |
| 18 | 49 | operator | `+` | `-` | survived | killed |
| 19 | 52 | operator | `*` | `/` | survived | killed |
