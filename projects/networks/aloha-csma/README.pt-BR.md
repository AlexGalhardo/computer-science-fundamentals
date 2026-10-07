# aloha-csma

> English version: [README.md](README.md)

Como estações compartilham um canal sem um coordenador. Três simuladores em Python, só com a biblioteca padrão: ALOHA puro, slotted ALOHA e CSMA/CD com recuo binário exponencial. O mini-projeto reproduz os dois picos famosos (18,4% e 36,8%) e mostra por que escutar o canal e abortar colisões muda tudo.

![Vazão por carga oferecida](results/throughput.svg)

Explicação completa: [docs/pt/networks/aloha-csma.md](../../../docs/pt/networks/aloha-csma.md).

## Tópicos do quiz que ele demonstra

- `networks` / `medium-access-control`: ALOHA puro, slotted ALOHA e o período vulnerável, vazão sob sobrecarga, CSMA/CD, recuo binário exponencial

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-aloha-csma.sh        # Linux e macOS
./setup-windows-aloha-csma.ps1    # Windows
```

O script constrói a imagem e roda o linter, a verificação de formatação e os testes.

## Demonstração

```sh
docker compose run --rm python-demo     # simula e escreve results/results.json e results/results.md
docker compose run --rm python-chart    # desenha results/throughput.svg a partir de results/results.json
```

A simulação leva alguns segundos e usa semente fixa e tempo simulado, então reescreve exatamente a tabela versionada. O gráfico é gerado apenas a partir do arquivo JSON: ele pode ser redesenhado sem simular de novo. Opções da simulação: `--seed`, `--frames`, `--stations`, `--frame-slots`, por exemplo `docker compose run --rm python-demo python run.py --out /results --stations 10`.

Resultados versionados: [results/results.md](results/results.md), [results/results.json](results/results.json), [results/throughput.svg](results/throughput.svg).

## Estrutura

| Arquivo | O que é |
| --- | --- |
| `python/aloha.py` | fórmulas e simuladores do ALOHA puro e do slotted ALOHA |
| `python/csma_cd.py` | CSMA/CD, 1-persistente, com recuo binário exponencial |
| `python/run.py` | varredura da carga oferecida, escreve os resultados |
| `python/chart.py` | gráfico SVG a partir do arquivo de resultados |
| `python/test_aloha_csma.py` | testes |

## Testes

```sh
docker compose run --rm python-test
```

Roda `ruff check`, `ruff format --check` e `pytest`. Os testes verificam que os picos simulados ficam a menos de 5% de 1/(2e) e 1/e, que as simulações seguem as fórmulas em várias cargas, o intervalo do recuo, o comportamento do CSMA/CD com carga baixa e sob sobrecarga, a reprodutibilidade com semente, e que o gráfico é um SVG válido com as três curvas.

## O que os números mostram

| protocolo | pico simulado | na carga G | teoria |
| --- | --- | --- | --- |
| ALOHA puro | 0,1833 | 0,5 | 0,1839 |
| slotted ALOHA | 0,3684 | 1,0 | 0,3679 |
| CSMA/CD (50 estações, quadro = 32 slots) | 0,9358 | 3,0 | sem fórmula fechada aqui |

As duas curvas do ALOHA sobem, atingem o pico e desabam: depois do pico, mais tentativas só produzem mais colisões. O CSMA/CD transporta o que é oferecido até cerca de 0,8 e depois fica perto de 0,94, porque uma colisão custa um slot curto em vez de um quadro inteiro.
