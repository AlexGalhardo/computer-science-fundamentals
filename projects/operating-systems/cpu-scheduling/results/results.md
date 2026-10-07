# cpu-scheduling: results

Command: `docker compose run --rm demo`

The simulation is deterministic: abstract time units, workloads from a linear congruential generator with seed 2026. The numbers do not depend on the machine, and the Python implementation prints the same values.

## Example schedule

Processes as id(arrival, burst, priority): A(0, 8, 3) B(1, 4, 1) C(2, 9, 4) D(3, 5, 2) E(6, 2, 5)

### FCFS

```
|           A           |     B     |            C             |      D       |  E  |
0                       8           12                         21             26    28
```

### SJF

```
|           A           |  E  |     B     |      D       |            C             |
0                       8     10          14             19                         28
```

### RR(q=4)

```
|     A     |     B     |     C     |     D     |     A     |  E  |     C     |D |C |
0           4           8           12          16          20    22          26 27 28
```

### Priority

```
|           A           |     B     |      D       |            C             |  E  |
0                       8           12             17                         26    28
```

### MLFQ(q=2,levels=3)

```
|  A  |  B  |  C  |  D  |  E  |     A     |  B  |     C     |   D    |  A  |   C    |
0     2     4     6     8     10          14    16          20       23    25       28
```

| Policy | Avg waiting | Avg turnaround | Avg response | Max waiting |
| --- | ---: | ---: | ---: | ---: |
| FCFS | 11.00 | 16.60 | 11.00 | 20 |
| SJF | 7.80 | 13.40 | 7.80 | 17 |
| RR(q=4) | 13.00 | 18.60 | 6.40 | 19 |
| Priority | 10.20 | 15.80 | 10.20 | 20 |
| MLFQ(q=2,levels=3) | 12.40 | 18.00 | 1.60 | 17 |

## Workload: interactive (200 processes)

| Policy | Avg waiting | Avg turnaround | Avg response | Max waiting |
| --- | ---: | ---: | ---: | ---: |
| FCFS | 5.00 | 9.32 | 5.00 | 29 |
| SJF | 3.56 | 7.88 | 3.56 | 45 |
| RR(q=4) | 6.01 | 10.34 | 3.69 | 31 |
| Priority | 5.08 | 9.40 | 5.08 | 75 |
| MLFQ(q=2,levels=3) | 8.57 | 12.90 | 0.77 | 79 |

## Workload: cpu-bound (200 processes)

| Policy | Avg waiting | Avg turnaround | Avg response | Max waiting |
| --- | ---: | ---: | ---: | ---: |
| FCFS | 64.40 | 105.05 | 64.40 | 218 |
| SJF | 51.44 | 92.08 | 51.44 | 1058 |
| RR(q=4) | 111.91 | 152.56 | 9.79 | 390 |
| Priority | 58.06 | 98.72 | 58.06 | 996 |
| MLFQ(q=2,levels=3) | 118.85 | 159.50 | 2.69 | 403 |

## Workload: mixed (200 processes)

| Policy | Avg waiting | Avg turnaround | Avg response | Max waiting |
| --- | ---: | ---: | ---: | ---: |
| FCFS | 120.56 | 134.04 | 120.56 | 338 |
| SJF | 40.93 | 54.41 | 40.93 | 942 |
| RR(q=4) | 67.38 | 80.86 | 15.47 | 658 |
| Priority | 102.35 | 115.83 | 102.35 | 892 |
| MLFQ(q=2,levels=3) | 56.34 | 69.81 | 2.56 | 718 |
