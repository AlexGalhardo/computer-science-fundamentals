# neural-network-from-scratch

> English version: [README.md](README.md) · Versión en español: [README.es.md](README.es.md)

Ensina **o que um neurônio calcula e como a retropropagação encontra os gradientes**. Um motor de diferenciação automática escalar é escrito em Python puro, um perceptron multicamadas é construído sobre ele e treinado com descida do gradiente, e cada gradiente é conferido contra um gradiente numérico. A rede aprende o XOR e um conjunto de dados de duas classes, e a demo grava a perda por época e a fronteira de decisão.

Explicação completa: [docs/pt/artificial-intelligence/neural-network-from-scratch.md](../../../docs/pt/artificial-intelligence/neural-network-from-scratch.md).

## Tópicos do quiz que ele demonstra

- `artificial-intelligence` / `neural-networks`: o que um neurônio calcula, funções de ativação (tanh, ReLU, sigmoide), camadas, contagem de parâmetros, por que o XOR precisa de camada oculta, inicialização aleatória.
- `artificial-intelligence` / `training`: o gradiente, a atualização `w = w - lr * grad`, a retropropagação como regra da cadeia, gradientes que se acumulam, a conferência com gradiente numérico, a curva de perda.
- `artificial-intelligence` / `supervised-learning`: classificação, a perda, conjunto de treino contra conjunto de teste.

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-neural-network-from-scratch.sh        # Linux e macOS
./setup-windows-neural-network-from-scratch.ps1    # Windows
```

O script constrói a imagem, roda os testes e roda a demo.

## Estrutura

| Caminho | O que é |
| --- | --- |
| `python/engine.py` | `Value`: um número que lembra como foi calculado, e `backward()` |
| `python/nn.py` | `Neuron`, `Layer` e `MLP` construídos sobre `Value` |
| `python/data.py` | o XOR e o conjunto gerado das duas luas (treino e teste) |
| `python/train.py` | a perda, o laço de treinamento e a acurácia |
| `python/render.py` | a curva de perda e a fronteira de decisão, em SVG e em texto |
| `python/demo.py` | `python demo.py`: treina e grava `results/` |
| `python/test_network.py` | os testes |
| `results/` | resultados versionados: `results.md`, `loss-xor.csv`, `loss-moons.csv`, `loss-curve.svg`, `decision-boundary.txt`, `decision-boundary.svg` |

Só Python (`python:3.14.8-slim-trixie`), sem nenhuma dependência de execução: nem o NumPy. Cada número da rede é um objeto Python, o que é lento e é exatamente a ideia: nada fica escondido.

## Testes

```sh
docker compose run --rm python-test
```

Roda `ruff check`, `ruff format --check` e 36 testes (cerca de meio minuto, quase tudo treinamento):

- cada operação do motor, e uma rede inteira, contra o gradiente numérico `(f(x + h) - f(x - h)) / 2h`, com tolerância de 1e-6;
- o XOR aprendido exatamente, e um único neurônio falhando nele;
- pelo menos 95% de acurácia em pontos de teste que não foram usados no treino.

## Demo

```sh
docker compose run --rm python-demo
```

Imprime [`results/results.md`](results/results.md) e regrava os arquivos de `results/`.

| Problema | Rede | Parâmetros | Resultado |
| --- | --- | ---: | --- |
| XOR | 2-4-1, tanh | 17 | 4 de 4 certos, perda de 0,7863 para 0,0244 em 300 épocas |
| Duas luas | 2-8-8-1, tanh | 105 | 98,8% nos 80 pontos de treino, 99,5% nos 200 pontos de teste |

A perda por época da rede das duas luas:

![Perda por época](results/loss-curve.svg)

A fronteira de decisão, com os pontos de teste:

![Fronteira de decisão](results/decision-boundary.svg)

Não há dashboard: as figuras são arquivos SVG gravados pela demo, sem biblioteca de gráficos.

## Limites

Um objeto Python por número deixa isto milhares de vezes mais lento que uma biblioteca de verdade, que guarda camadas inteiras como arranjos e as executa em código otimizado. A rede tem cerca de cem parâmetros e o conjunto tem 80 pontos. O mini-projeto [pytorch-basics](../pytorch-basics/) refaz a mesma rede com o PyTorch e compara os dois.
