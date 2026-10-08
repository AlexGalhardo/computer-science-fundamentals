# test-pyramid: which suite catches which seeded bug

Written by `docker compose run --rm matrix`. `FAIL` means the suite exited with an error, so it caught the bug.

| Seeded bug | unit | integration | regression | smoke | e2e |
| --- | --- | --- | --- | --- | --- |
| none | pass | pass | pass | pass | pass |
| unit | **FAIL** | pass | pass | pass | pass |
| integration | pass | **FAIL** | pass | pass | **FAIL** |
| e2e | pass | pass | pass | pass | **FAIL** |
| smoke | pass | pass | pass | **FAIL** | **FAIL** |
| regression | pass | pass | **FAIL** | pass | pass |

## Count and duration of each suite (no seeded bug)

The duration is the whole command, including the start of the test runner (and of Chromium for `e2e`).

| Suite | Tests | Duration (ms) | ms per test |
| --- | --- | --- | --- |
| unit | 10 | 36 | 3.6 |
| integration | 8 | 61 | 7.6 |
| regression | 2 | 52 | 26.0 |
| smoke | 3 | 9 | 3.0 |
| e2e | 3 | 2070 | 690.0 |
