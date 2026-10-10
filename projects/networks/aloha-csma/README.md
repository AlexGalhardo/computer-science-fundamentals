# aloha-csma

> Versão em português: [README.pt-BR.md](README.pt-BR.md) · Versión en español: [README.es.md](README.es.md)

How stations share one channel without a coordinator. Three simulators in Python, standard library only: pure ALOHA, slotted ALOHA and CSMA/CD with binary exponential backoff. The mini-project reproduces the two famous peaks (18.4% and 36.8%) and shows why listening to the channel and aborting collisions changes everything.

![Throughput against offered load](results/throughput.svg)

Full explanation: [docs/en/networks/aloha-csma.md](../../../docs/en/networks/aloha-csma.md).

## Quiz topics it demonstrates

- `networks` / `medium-access-control`: pure ALOHA, slotted ALOHA and the vulnerable period, throughput under overload, CSMA/CD, binary exponential backoff

## Run

The only requirement is Docker.

```sh
./setup-unix-aloha-csma.sh        # Linux and macOS
./setup-windows-aloha-csma.ps1    # Windows
```

The script builds the image and runs the linter, the formatter check and the tests.

## Demo

```sh
docker compose run --rm python-demo     # simulates and writes results/results.json and results/results.md
docker compose run --rm python-chart    # draws results/throughput.svg from results/results.json
```

The simulation takes a few seconds and uses a fixed seed and simulated time, so it rewrites exactly the committed table. The chart is generated only from the JSON file: it can be redrawn without simulating again. Options of the simulation: `--seed`, `--frames`, `--stations`, `--frame-slots`, for example `docker compose run --rm python-demo python run.py --out /results --stations 10`.

Committed results: [results/results.md](results/results.md), [results/results.json](results/results.json), [results/throughput.svg](results/throughput.svg).

## Structure

| File | What it is |
| --- | --- |
| `python/aloha.py` | formulas and simulators of pure and slotted ALOHA |
| `python/csma_cd.py` | CSMA/CD, 1-persistent, with binary exponential backoff |
| `python/run.py` | sweep over the offered load, writes the results |
| `python/chart.py` | SVG chart from the results file |
| `python/test_aloha_csma.py` | tests |

## Tests

```sh
docker compose run --rm python-test
```

Runs `ruff check`, `ruff format --check` and `pytest`. The tests check that the simulated peaks are within 5% of 1/(2e) and 1/e, that the simulations follow the formulas at several loads, the range of the backoff, the behaviour of CSMA/CD at low load and under overload, reproducibility with a seed, and that the chart is valid SVG with the three curves.

## What the numbers show

| protocol | simulated peak | at load G | theory |
| --- | --- | --- | --- |
| pure ALOHA | 0.1833 | 0.5 | 0.1839 |
| slotted ALOHA | 0.3684 | 1.0 | 0.3679 |
| CSMA/CD (50 stations, frame = 32 slots) | 0.9358 | 3.0 | no closed form here |

Both ALOHA curves rise, peak and collapse: past the peak, more attempts only produce more collisions. CSMA/CD carries what is offered up to about 0.8 and then stays near 0.94, because a collision costs one short slot instead of a whole frame.
