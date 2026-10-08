# pytorch-basics

> English version: [README.md](README.md)

Ensina **o que um framework de aprendizado profundo faz por você**, refazendo o mini-projeto [neural-network-from-scratch](../neural-network-from-scratch/) (MP-AI-2) com PyTorch. A mesma rede 2-8-8-1 é construída nos dois, e os gradientes que o PyTorch calcula são comparados com a retropropagação escrita à mão e com gradientes numéricos. Depois o laço de treinamento é escrito à mão (ida, perda, limpeza, volta, passo) no mesmo conjunto de dados, e uma tabela compara as linhas de código e o tempo de treinamento das duas versões.

Explicação completa: [docs/pt/artificial-intelligence/pytorch-basics.md](../../../docs/pt/artificial-intelligence/pytorch-basics.md).

## Tópicos do quiz que ele demonstra

- `artificial-intelligence` / `pytorch`: tensores (formato, dtype), `requires_grad`, `backward()` e `.grad`, gradientes que se acumulam e `zero_grad`, `nn.Module` e `nn.Linear`, o otimizador, os cinco passos do laço de treinamento, `torch.no_grad()` contra `model.eval()`.
- `artificial-intelligence` / `training`: a conferência com gradiente numérico, a descida do gradiente com o lote inteiro, a curva de perda, por que os pesos iniciais importam.
- `artificial-intelligence` / `linear-algebra`: uma camada linear aplicada a um lote inteiro como um único produto de matrizes, e os formatos pelo caminho: (N, 2) para (N, 8) para (N, 8) para (N, 1).

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-pytorch-basics.sh        # Linux e macOS
./setup-windows-pytorch-basics.ps1    # Windows
```

O script constrói a imagem, roda os testes e roda a demo. A primeira construção baixa o pacote do PyTorch só para CPU (algumas centenas de megabytes). Depois disso nada usa a rede: os dois serviços rodam com `network_mode: "none"`.

## Estrutura

| Caminho | O que é |
| --- | --- |
| `python/model.py` | `MoonsNet`: a rede 2-8-8-1 como um `nn.Module` |
| `python/train.py` | o laço de treinamento escrito à mão, a acurácia, `train_moons()` |
| `python/tensors.py` | exemplos pequenos: `*` contra `@`, uma camada linear à mão, `backward`, acumulação |
| `python/gradients.py` | copia os pesos da rede feita à mão para o PyTorch e calcula os gradientes de três formas |
| `python/versus.py` | conta as linhas de código, mede o tempo das duas versões, registra a máquina |
| `python/render.py` | o gráfico de perda em SVG |
| `python/demo.py` | `python demo.py`: roda tudo e grava `results/` |
| `python/test_pytorch_basics.py` | os testes |
| `python/scratch/` | uma **cópia** do MP-AI-2 (`engine.py`, `nn.py`, `data.py`, `train.py`) |
| `results/` | resultados versionados: `results.md`, `timing.md`, `loss.csv`, `loss-curve.svg` |

Um mini-projeto nunca importa outro, então os arquivos do MP-AI-2 que são necessários foram copiados para `python/scratch/`. `data.py` e `engine.py` são idênticos aos originais. Em `nn.py` e `train.py` só as linhas de importação mudaram. O conjunto de dados é, portanto, literalmente o mesmo, e um teste fixa alguns dos seus pontos.

Só Python: `python:3.14.8-slim-trixie` com `torch==2.14.1` (pacote de CPU) e `numpy==2.5.3`. O PyTorch roda na CPU com 2 threads.

## Testes

```sh
docker compose run --rm python-test
```

Roda `ruff check`, `ruff format --check` e 32 testes (cerca de 10 segundos):

- **MP-AI-6.1** tensores (formatos, `*` contra `@`, broadcasting, uma camada linear como produto de matrizes) e diferenciação automática (`requires_grad`, acumulação, `zero_grad`, `no_grad` contra `eval`). Os pesos da rede feita à mão são copiados para o PyTorch, e os 105 gradientes da perda nos 80 pontos de treino concordam com a retropropagação escrita à mão dentro de 1e-10 e com o gradiente numérico dentro de 1e-6.
- **MP-AI-6.2** o laço escrito à mão chega a pelo menos 95% nos 200 pontos de teste com uma semente fixa, a mesma semente dá o mesmo treinamento, a `BCEWithLogitsLoss` é igual à perda escrita à mão no MP-AI-2, e um passo do otimizador é `w - lr * grad`. Partindo dos pesos do MP-AI-2, o PyTorch segue a curva de perda dele dentro de 1e-9.
- **MP-AI-6.3** o contador de linhas ignora linhas vazias, comentários e docstrings, e a tabela de tempos tem as duas versões, números positivos e a máquina. Nenhum teste faz asserção sobre um tempo absoluto.

## Demo

```sh
docker compose run --rm python-demo
```

Imprime e regrava [`results/results.md`](results/results.md) e [`results/timing.md`](results/timing.md), além de `loss.csv` e `loss-curve.svg`. Leva menos de um minuto, quase todo gasto na versão feita à mão.

Os gradientes, de três formas, na mesma rede (primeiras linhas, os 105 são comparados):

| Parâmetro | Retropropagação escrita à mão | `backward()` do PyTorch | Numérico |
| --- | ---: | ---: | ---: |
| `hidden1` w[0][0] | -0.060789 | -0.060789 | -0.060789 |
| `hidden1` w[0][1] | 0.012666 | 0.012666 | 0.012666 |
| `hidden1` b[0] | -0.049645 | -0.049645 | -0.049645 |

A maior diferença entre o PyTorch e a retropropagação escrita à mão fica abaixo de 1e-12, e entre o PyTorch e o gradiente numérico abaixo de 1e-8.

Treinamento, 2-8-8-1 com tanh, SGD com taxa de aprendizado 0,5, lote inteiro:

| Pesos iniciais | Épocas | Primeira perda | Última perda | Acurácia de treino | Acurácia de teste |
| --- | ---: | ---: | ---: | ---: | ---: |
| A regra do MP-AI-2, sorteada pelo PyTorch (`torch.manual_seed(7)`) | 120 | 0.7541 | 0.1057 | 97.5% | 98.0% |
| Copiados do MP-AI-2 (a semente 7 dele), floats de 64 bits | 120 | 0.4576 | 0.0604 | 98.8% | 99.5% |
| O padrão do `nn.Linear` | 120 | 0.7011 | 0.2405 | 87.5% | 92.5% |
| O padrão do `nn.Linear` | 300 | 0.7011 | 0.0182 | 100.0% | 99.5% |

A primeira linha é a execução do critério de aceite: **98,0% nos 200 pontos de teste**. A segunda linha é exatamente o resultado do MP-AI-2, porque parte dos mesmos pesos e faz as mesmas contas.

![Perda por época](results/loss-curve.svg)

Feito à mão contra o framework ([`results/timing.md`](results/timing.md)). O trabalho é o mesmo nos dois: construir a rede e treiná-la por 20 épocas nos 80 pontos de treino, 5 execuções de cada.

| Versão | Linhas de código | Mediana de 5 execuções | Mais rápida | Mais lenta | Por época |
| --- | ---: | ---: | ---: | ---: | ---: |
| Feito à mão (MP-AI-2) | 198 | 8.121 s | 7.679 s | 8.464 s | 406.04 ms |
| PyTorch (esta versão) | 78 | 0.027 s | 0.021 s | 0.065 s | 1.37 ms |

| Parte | Feito à mão (MP-AI-2) | PyTorch |
| --- | ---: | ---: |
| Diferenciação automática | 102 (`scratch/engine.py`) | 0 (nenhuma: o framework traz) |
| Rede | 45 (`scratch/nn.py`) | 19 (`model.py`) |
| Perda, laço de treinamento e acurácia | 51 (`scratch/train.py`) | 59 (`train.py`) |
| **Total** | **198** | **78** |

Linhas de código são as linhas que contêm código: linhas vazias, linhas de comentário e docstrings não contam (`count_code_lines` em `python/versus.py`).

Máquina dessa execução: AMD Ryzen 7 5700X3D (16 núcleos lógicos vistos pelo container, PyTorch limitado a 2 threads), Linux 6.18 sob WSL2, imagem `python:3.14.8-slim-trixie`, Python 3.14.8, PyTorch 2.14.1+cpu. **Os tempos mudam de máquina para máquina e de execução para execução**: outros containers estavam rodando nesta máquina durante a medição, e outra execução nela deu 6,4 s contra 0,010 s. O resultado é a ordem de grandeza (centenas de vezes), não a razão exata. Todos os outros números em `results/` são determinísticos.

Não há dashboard: a figura é um arquivo SVG gravado pela demo, sem biblioteca de gráficos.

## Limites

- A rede tem 105 parâmetros e o conjunto de dados tem 80 pontos. Nesse tamanho o PyTorch gasta a maior parte do tempo no custo fixo de cada chamada, não em contas, então a distância para a versão feita à mão seria muito maior em um modelo de verdade. Nada aqui usa GPU.
- A contagem de linhas compara o que precisou ser escrito, não o tamanho do software: o PyTorch em si tem centenas de milhares de linhas. O `train.py` feito à mão também guarda a execução do XOR do MP-AI-2, que são algumas das suas 51 linhas.
- A execução do critério não parte dos mesmos números aleatórios do MP-AI-2, só da mesma regra (pesos uniformes em (-1, 1), vieses em zero): o PyTorch e o Python têm geradores aleatórios diferentes. A linha "Copiados do MP-AI-2" é a que parte de pesos idênticos.
- Com os pesos iniciais padrão do `nn.Linear`, 120 épocas chegam só a 92,5% nos pontos de teste. É o mesmo modelo aprendendo mais devagar, e 300 épocas chegam a 99,5%.
- O treinamento usa floats de 32 bits, o padrão do PyTorch. As perdas são arredondadas para 4 casas em `results/`, o que é estável nesta máquina. Outra CPU pode diferir no último dígito.

O mini-projeto [tensorflow-keras-basics](../tensorflow-keras-basics/) treina a mesma rede com TensorFlow e Keras e coloca os dois frameworks lado a lado.
