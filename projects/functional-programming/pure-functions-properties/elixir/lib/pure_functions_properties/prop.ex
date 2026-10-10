defmodule PureFunctionsProperties.Prop do
  @moduledoc """
  EN: A property-based testing library in about 150 lines: a pure random generator, a few
      value generators that also know how to shrink, and the `check/3` loop. It exists to show
      how the technique works; a real project would use a library such as StreamData.
  PT: Uma biblioteca de testes baseados em propriedades em cerca de 150 linhas: um gerador
      aleatório puro, alguns geradores de valores que também sabem reduzir, e o laço `check/3`.
      Ela existe para mostrar como a técnica funciona; um projeto real usaria uma biblioteca
      como a StreamData.
  ES: Una biblioteca de pruebas basadas en propiedades en unas 150 líneas: un generador
      aleatorio puro, algunos generadores de valores que también saben reducir, y el bucle
      `check/3`. Existe para mostrar cómo funciona la técnica; un proyecto real usaría una
      biblioteca como StreamData.
  """

  import Bitwise

  defmodule Gen do
    @moduledoc """
    EN: A generator is a pair of pure functions. `generate` turns a seed into `{value,
        next_seed}`. `shrink` lists simpler versions of a value, the simplest first; it is what
        turns a large random failure into a small one a person can read.
    PT: Um gerador é um par de funções puras. `generate` transforma uma semente em `{valor,
        próxima_semente}`. `shrink` lista versões mais simples de um valor, a mais simples
        primeiro; é ele que transforma uma falha aleatória grande em uma pequena, que uma
        pessoa consegue ler.
    ES: Un generador es un par de funciones puras. `generate` transforma una semilla en `{valor,
        siguiente_semilla}`. `shrink` lista versiones más simples de un valor, la más simple
        primero; es lo que convierte un fallo aleatorio grande en uno pequeño, que una
        persona puede leer.
    """
    @enforce_keys [:generate, :shrink]
    defstruct [:generate, :shrink]
  end

  # EN: The random generator is a pure function. Its whole state is one 32-bit number, the
  #     seed, which goes in as an argument and comes out, updated, next to the value. Nothing
  #     is hidden in a process, so the same seed always replays the same test run. The formula
  #     is the same linear congruential generator as in the TypeScript version, so both
  #     languages draw the same numbers. Only the 16 high bits are used because the low bits
  #     of this kind of generator repeat quickly.
  # PT: O gerador aleatório é uma função pura. Todo o seu estado é um número de 32 bits, a
  #     semente, que entra como argumento e sai, atualizada, ao lado do valor. Nada fica
  #     escondido em um processo, então a mesma semente sempre repete a mesma execução do
  #     teste. A fórmula é o mesmo gerador congruente linear da versão em TypeScript, então as
  #     duas linguagens sorteiam os mesmos números. Só os 16 bits altos são usados porque os
  #     bits baixos desse tipo de gerador se repetem rápido.
  # ES: El generador aleatorio es una función pura. Todo su estado es un número de 32 bits, la
  #     semilla, que entra como argumento y sale, actualizada, junto al valor. Nada queda
  #     escondido en un proceso, así que la misma semilla siempre repite la misma ejecución de la
  #     prueba. La fórmula es el mismo generador congruencial lineal de la versión en TypeScript,
  #     así que los dos lenguajes sortean los mismos números. Solo se usan los 16 bits altos
  #     porque los bits bajos de este tipo de generador se repiten rápido.
  def next_seed(seed), do: rem(seed * 1_664_525 + 1_013_904_223, 4_294_967_296)

  def random_int(seed, low, high) do
    next = next_seed(seed)
    {low + rem(next >>> 16, high - low + 1), next}
  end

  # EN: Integers shrink towards zero (or towards the bound closest to zero): first the target
  #     itself, then values that halve the distance, so the search takes few steps.
  # PT: Inteiros são reduzidos em direção a zero (ou ao limite mais próximo de zero): primeiro
  #     o próprio alvo, depois valores que cortam a distância pela metade, então a busca leva
  #     poucos passos.
  # ES: Los enteros se reducen hacia cero (o hacia el límite más cercano a cero): primero
  #     el propio objetivo, luego valores que recortan la distancia a la mitad, así la búsqueda
  #     toma pocos pasos.
  def int(low, high) do
    target = 0 |> max(low) |> min(high)

    %Gen{
      generate: &random_int(&1, low, high),
      shrink: fn value -> closer(value, value - target) end
    }
  end

  defp closer(_value, 0), do: []
  defp closer(value, distance), do: [value - distance | closer(value, div(distance, 2))]

  # EN: Picks one of a fixed list of values. An earlier position counts as simpler.
  # PT: Escolhe um valor de uma lista fixa. Uma posição anterior conta como mais simples.
  # ES: Elige un valor de una lista fija. Una posición anterior cuenta como más simple.
  def one_of(values) do
    %Gen{
      generate: fn seed ->
        {index, next} = random_int(seed, 0, length(values) - 1)
        {Enum.at(values, index), next}
      end,
      shrink: fn value -> Enum.take_while(values, &(&1 != value)) end
    }
  end

  # EN: A fixed-size tuple of independent generators. `Enum.map_reduce/3` threads the seed
  #     through them: each generator receives the seed left by the previous one. The tuple
  #     shrinks one position at a time.
  # PT: Uma tupla de tamanho fixo de geradores independentes. `Enum.map_reduce/3` conduz a
  #     semente por eles: cada gerador recebe a semente deixada pelo anterior. A tupla é
  #     reduzida uma posição por vez.
  # ES: Una tupla de tamaño fijo de generadores independientes. `Enum.map_reduce/3` conduce la
  #     semilla a través de ellos: cada generador recibe la semilla que dejó el anterior. La tupla
  #     se reduce una posición a la vez.
  def tuple(gens) do
    %Gen{
      generate: fn seed ->
        {values, next} =
          Enum.map_reduce(gens, seed, fn gen, current -> gen.generate.(current) end)

        {List.to_tuple(values), next}
      end,
      shrink: fn value ->
        gens
        |> Enum.with_index()
        |> Enum.flat_map(fn {gen, index} ->
          value |> elem(index) |> gen.shrink.() |> Enum.map(&put_elem(value, index, &1))
        end)
      end
    }
  end

  def list_of(item, max_length) do
    %Gen{
      generate: fn seed ->
        {length, after_length} = random_int(seed, 0, max_length)

        item
        |> List.duplicate(length)
        |> Enum.map_reduce(after_length, fn gen, current -> gen.generate.(current) end)
      end,
      shrink: fn items -> shrink_list(items, item.shrink) end
    }
  end

  # EN: The candidates of a list, in order: drop the first or the second half, drop one
  #     element, then make one element simpler. Shorter lists come first because a shorter
  #     counterexample is the biggest gain.
  # PT: Os candidatos de uma lista, em ordem: remover a primeira ou a segunda metade, remover
  #     um elemento, e então simplificar um elemento. Listas mais curtas vêm antes porque um
  #     contraexemplo mais curto é o maior ganho.
  # ES: Los candidatos de una lista, en orden: quitar la primera o la segunda mitad, quitar
  #     un elemento, y luego simplificar un elemento. Las listas más cortas van antes porque un
  #     contraejemplo más corto es la mayor ganancia.
  defp shrink_list(items, shrink_item) do
    half = div(length(items), 2)
    halves = if length(items) > 1, do: [Enum.drop(items, half), Enum.take(items, half)], else: []
    indexed = Enum.with_index(items)
    without_one = Enum.map(indexed, fn {_item, index} -> List.delete_at(items, index) end)

    simpler_item =
      Enum.flat_map(indexed, fn {item, index} ->
        Enum.map(shrink_item.(item), &List.replace_at(items, index, &1))
      end)

    halves ++ without_one ++ simpler_item
  end

  # EN: Builds a string out of runs of the same character, because the codec under test only
  #     misbehaves on long runs and a uniformly random string almost never has one. Choosing
  #     what the generator produces is part of writing a property. The string shrinks like a
  #     list of characters, plus one candidate that replaces every occurrence of a character
  #     by the first one of the alphabet, which keeps a run intact while making it simpler.
  # PT: Monta um texto a partir de sequências do mesmo caractere, porque o codec em teste só
  #     falha em sequências longas, e um texto uniformemente aleatório quase nunca tem uma.
  #     Escolher o que o gerador produz faz parte de escrever uma propriedade. O texto é
  #     reduzido como uma lista de caracteres, mais um candidato que troca todas as ocorrências
  #     de um caractere pelo primeiro do alfabeto, o que mantém a sequência inteira e a
  #     simplifica.
  # ES: Arma un texto a partir de secuencias del mismo carácter, porque el codec bajo prueba solo
  #     falla en secuencias largas, y un texto uniformemente aleatorio casi nunca tiene una.
  #     Elegir lo que produce el generador forma parte de escribir una propiedad. El texto se
  #     reduce como una lista de caracteres, más un candidato que cambia todas las apariciones
  #     de un carácter por el primero del alfabeto, lo que mantiene la secuencia entera y la
  #     simplifica.
  def run_string(alphabet, max_runs, max_run_length) do
    letters = String.graphemes(alphabet)
    simplest = hd(letters)
    runs = list_of(tuple([one_of(letters), int(1, max_run_length)]), max_runs)

    %Gen{
      generate: fn seed ->
        {pairs, next} = runs.generate.(seed)
        {Enum.map_join(pairs, fn {letter, length} -> String.duplicate(letter, length) end), next}
      end,
      shrink: fn value ->
        chars = String.graphemes(value)
        shorter = chars |> shrink_list(fn _char -> [] end) |> Enum.map(&Enum.join/1)

        simpler =
          chars
          |> Enum.uniq()
          |> Enum.reject(&(&1 == simplest))
          |> Enum.map(&String.replace(value, &1, simplest))

        shorter ++ simpler
      end
    }
  end

  @doc """
  EN: Generates `runs` values, one after the other from the same seed chain, and stops at the
      first one that makes the property false. Returns `{:ok, runs}` or `{:error, failure}`,
      plain data, so a test can assert on the counterexample itself.
  PT: Gera `runs` valores, um depois do outro a partir da mesma cadeia de sementes, e para no
      primeiro que torna a propriedade falsa. Devolve `{:ok, runs}` ou `{:error, falha}`, dados
      comuns, então um teste pode fazer asserções sobre o próprio contraexemplo.
  ES: Genera `runs` valores, uno tras otro a partir de la misma cadena de semillas, y se detiene
      en el primero que vuelve falsa la propiedad. Devuelve `{:ok, runs}` o `{:error, fallo}`,
      datos comunes, así que una prueba puede hacer aserciones sobre el propio contraejemplo.
  """
  def check(gen, property, opts \\ []) do
    seed = Keyword.get(opts, :seed, 42)
    run(gen, property, seed, seed, 1, Keyword.get(opts, :runs, 200))
  end

  # EN: The loop is a tail-recursive function: the "mutable" seed and run counter are just
  #     the arguments of the next call.
  # PT: O laço é uma função recursiva de cauda: a semente e o contador "mutáveis" são apenas
  #     os argumentos da próxima chamada.
  # ES: El bucle es una función recursiva de cola: la semilla y el contador "mutables" son solo
  #     los argumentos de la siguiente llamada.
  defp run(_gen, _property, _first_seed, _seed, run, runs) when run > runs, do: {:ok, runs}

  defp run(gen, property, first_seed, seed, run, runs) do
    {value, next} = gen.generate.(seed)

    if property.(value) do
      run(gen, property, first_seed, next, run + 1, runs)
    else
      {shrunk, steps} = shrink_failure(gen, property, value, 0)

      {:error,
       %{run: run, seed: first_seed, original: value, shrunk: shrunk, shrink_steps: steps}}
    end
  end

  # EN: Shrinking is a greedy search: take the first simpler candidate that still breaks the
  #     property and start again from it, until no candidate fails. It only works because the
  #     property is pure: running it again on a candidate cannot be affected by earlier runs.
  # PT: Reduzir é uma busca gulosa: pegue o primeiro candidato mais simples que ainda quebra a
  #     propriedade e recomece a partir dele, até nenhum candidato falhar. Só funciona porque a
  #     propriedade é pura: executá-la de novo em um candidato não pode ser afetado pelas
  #     execuções anteriores.
  # ES: Reducir es una búsqueda voraz: toma el primer candidato más simple que todavía rompe la
  #     propiedad y vuelve a empezar desde él, hasta que ningún candidato falle. Solo funciona
  #     porque la propiedad es pura: ejecutarla de nuevo con un candidato no puede verse afectado
  #     por las ejecuciones anteriores.
  defp shrink_failure(gen, property, value, steps) do
    case Enum.drop_while(gen.shrink.(value), property) do
      [] -> {value, steps}
      [smaller | _rest] -> shrink_failure(gen, property, smaller, steps + 1)
    end
  end
end
