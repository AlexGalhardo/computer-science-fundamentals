defmodule SortingRace do
  @moduledoc """
  EN: The six sorting algorithms of the race, in Elixir. This is the language where the lesson
  changes the most. Data is immutable and the natural sequence is a linked list, so there is no
  "swap positions i and j" and no access by index in constant time. Each algorithm keeps its
  idea and its order of growth, but is rewritten with recursion and pattern matching, and
  heapsort trades the array heap for a tree-shaped heap.

  PT: Os seis algoritmos de ordenação da corrida, em Elixir. Esta é a linguagem em que a lição
  mais muda. Os dados são imutáveis e a sequência natural é uma lista encadeada, então não
  existe "trocar as posições i e j" nem acesso por índice em tempo constante. Cada algoritmo
  mantém sua ideia e sua ordem de crescimento, mas é reescrito com recursão e casamento de
  padrões, e o heapsort troca o heap em vetor por um heap em forma de árvore.
  """

  import Bitwise

  @type sort :: ([non_neg_integer()] -> [non_neg_integer()])

  @spec sorts() :: %{String.t() => sort()}
  def sorts do
    %{
      "bubble" => &bubble_sort/1,
      "insertion" => &insertion_sort/1,
      "merge" => &merge_sort/1,
      "quick" => &quick_sort/1,
      "heap" => &heap_sort/1,
      "radix" => &radix_sort/1
    }
  end

  # EN: Bubble sort. One pass walks the list carrying the largest value seen so far and leaves
  #     it at the end. Passes repeat until one of them changes nothing.
  # PT: Bubble sort. Uma passada percorre a lista carregando o maior valor visto até então e o
  #     deixa no fim. As passadas se repetem até que uma delas não mude nada.
  @spec bubble_sort([integer()]) :: [integer()]
  def bubble_sort(list) do
    case bubble_pass(list, [], false) do
      {passed, true} -> bubble_sort(passed)
      {passed, false} -> passed
    end
  end

  defp bubble_pass([a, b | rest], acc, _swapped) when a > b,
    do: bubble_pass([a | rest], [b | acc], true)

  defp bubble_pass([a | rest], acc, swapped), do: bubble_pass(rest, [a | acc], swapped)
  defp bubble_pass([], acc, swapped), do: {Enum.reverse(acc), swapped}

  # EN: Insertion sort. The sorted part is kept in descending order, so its head is the largest
  #     value: an input that is already ascending is inserted with one comparison per value,
  #     as in the array version. The result is reversed once at the end.
  # PT: Insertion sort. A parte ordenada fica em ordem decrescente, então a cabeça é o maior
  #     valor: uma entrada já crescente é inserida com uma comparação por valor, como na versão
  #     em vetor. O resultado é invertido uma vez no fim.
  @spec insertion_sort([integer()]) :: [integer()]
  def insertion_sort(list) do
    list |> Enum.reduce([], &insert_descending/2) |> Enum.reverse()
  end

  defp insert_descending(value, [head | tail]) when head > value,
    do: [head | insert_descending(value, tail)]

  defp insert_descending(value, sorted), do: [value | sorted]

  # EN: Merge sort. Splitting a list costs O(n) instead of O(1), which does not change the
  #     O(n log n) total because merging already costs O(n) per level.
  # PT: Merge sort. Dividir uma lista custa O(n) em vez de O(1), o que não muda o total
  #     O(n log n) porque intercalar já custa O(n) por nível.
  @spec merge_sort([integer()]) :: [integer()]
  def merge_sort(list), do: merge_sort(list, length(list))

  defp merge_sort(list, size) when size < 2, do: list

  defp merge_sort(list, size) do
    half = div(size, 2)
    {left, right} = Enum.split(list, half)
    merge(merge_sort(left, half), merge_sort(right, size - half), [])
  end

  # EN: `<=` takes the left value on a tie, which keeps the sort stable.
  # PT: `<=` pega o valor da esquerda no empate, o que mantém a ordenação estável.
  defp merge([a | left], [b | _] = right, acc) when a <= b, do: merge(left, right, [a | acc])
  defp merge(left, [b | right], acc), do: merge(left, right, [b | acc])
  defp merge(left, [], acc), do: Enum.reverse(acc, left)

  # EN: Quicksort. Without swaps, the partition builds three new lists: smaller than, equal to
  #     and larger than the pivot. The pivot is the median of the first, middle and last values.
  # PT: Quicksort. Sem trocas, a partição monta três listas novas: menores, iguais e maiores que
  #     o pivô. O pivô é a mediana entre o primeiro, o do meio e o último valor.
  @spec quick_sort([integer()]) :: [integer()]
  def quick_sort(list), do: quick_sort(list, length(list), [])

  # EN: `tail` is what comes after this range in the final answer. Passing it down avoids
  #     concatenating lists (`++`), which would copy the left side at every level.
  # PT: `tail` é o que vem depois deste trecho na resposta final. Passá-lo adiante evita
  #     concatenar listas (`++`), o que copiaria o lado esquerdo em cada nível.
  defp quick_sort([], _size, tail), do: tail
  defp quick_sort([value], _size, tail), do: [value | tail]

  defp quick_sort([first | _] = list, size, tail) do
    pivot = median_of_three(first, Enum.at(list, div(size, 2)), List.last(list))
    {less, less_size, equal, greater, greater_size} = partition(list, pivot, [], 0, [], [], 0)
    quick_sort(less, less_size, equal ++ quick_sort(greater, greater_size, tail))
  end

  defp median_of_three(x, y, z), do: max(min(x, y), min(max(x, y), z))

  defp partition([value | rest], pivot, less, ls, equal, greater, gs) do
    cond do
      value < pivot -> partition(rest, pivot, [value | less], ls + 1, equal, greater, gs)
      value > pivot -> partition(rest, pivot, less, ls, equal, [value | greater], gs + 1)
      true -> partition(rest, pivot, less, ls, [value | equal], greater, gs)
    end
  end

  defp partition([], _pivot, less, ls, equal, greater, gs), do: {less, ls, equal, greater, gs}

  # EN: Heapsort. A binary heap in an array needs to overwrite positions, which immutable data
  #     does not allow cheaply. A leftist heap is a tree with the same heap-order rule (each
  #     node <= its children) whose only operation is "merge two heaps", in O(log n). Inserting
  #     is merging with a one-node heap, removing the minimum is merging its two subtrees.
  # PT: Heapsort. Um heap binário em vetor precisa sobrescrever posições, o que dados imutáveis
  #     não permitem de forma barata. Um heap esquerdista é uma árvore com a mesma regra de
  #     ordem de heap (cada nó <= seus filhos) cuja única operação é "juntar dois heaps", em
  #     O(log n). Inserir é juntar com um heap de um nó, remover o mínimo é juntar suas duas subárvores.
  @spec heap_sort([integer()]) :: [integer()]
  def heap_sort(list) do
    list
    |> Enum.reduce(nil, fn value, heap -> heap_merge({1, value, nil, nil}, heap) end)
    |> heap_drain([])
  end

  defp heap_drain(nil, acc), do: Enum.reverse(acc)

  defp heap_drain({_, value, left, right}, acc),
    do: heap_drain(heap_merge(left, right), [value | acc])

  defp heap_merge(nil, heap), do: heap
  defp heap_merge(heap, nil), do: heap

  defp heap_merge({_, a, left, right}, {_, b, _, _} = other) when a <= b,
    do: heap_node(a, left, heap_merge(right, other))

  defp heap_merge(heap, other), do: heap_merge(other, heap)

  # EN: The "rank" is the length of the rightmost path. Keeping the shorter path on the right is
  #     what bounds a merge to O(log n) steps.
  # PT: O "rank" é o comprimento do caminho mais à direita. Manter o caminho mais curto à direita
  #     é o que limita uma junção a O(log n) passos.
  defp heap_node(value, a, b) do
    if rank(a) >= rank(b), do: {rank(b) + 1, value, a, b}, else: {rank(a) + 1, value, b, a}
  end

  defp rank(nil), do: 0
  defp rank({rank, _, _, _}), do: rank

  # EN: LSD radix sort in base 256, valid for integers from 0 to 2^31 - 1. `Enum.group_by`
  #     keeps the arrival order inside each group, so each of the four passes is stable.
  # PT: Radix sort LSD na base 256, válido para inteiros de 0 a 2^31 - 1. O `Enum.group_by`
  #     mantém a ordem de chegada dentro de cada grupo, então cada uma das quatro passadas é estável.
  @spec radix_sort([non_neg_integer()]) :: [non_neg_integer()]
  def radix_sort(list) do
    Enum.reduce([0, 8, 16, 24], list, fn shift, values ->
      groups = Enum.group_by(values, &(&1 >>> shift &&& 255))
      Enum.flat_map(0..255, &Map.get(groups, &1, []))
    end)
  end

  # EN: Same order-sensitive digest in every language: h = (h * 31 + v) mod 1,000,000,007.
  # PT: Mesmo resumo sensível à ordem em toda linguagem: h = (h * 31 + v) mod 1.000.000.007.
  @spec checksum([integer()]) :: String.t()
  def checksum(values) do
    values
    |> Enum.reduce(0, fn value, digest -> rem(digest * 31 + value, 1_000_000_007) end)
    |> Integer.to_string()
  end
end
