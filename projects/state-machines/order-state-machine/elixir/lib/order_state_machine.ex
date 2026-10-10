defmodule OrderStateMachine do
  @moduledoc """
  EN: The order state machine, with one function clause per row of the transition table.
  PT: A máquina de estados do pedido, com uma cláusula de função por linha da tabela de transições.
  ES: La máquina de estados del pedido, con una cláusula de función por fila de la tabla de transiciones.
  """

  # EN: The table is read while the module is compiled, from the same `machine.json` the
  #     TypeScript implementation uses. `@external_resource` tells the compiler to rebuild this
  #     module when that file changes. Turning its strings into atoms is safe here because the
  #     file is ours and small; it would not be safe for text typed by a user.
  # PT: A tabela é lida enquanto o módulo é compilado, do mesmo `machine.json` que a
  #     implementação em TypeScript usa. `@external_resource` avisa o compilador para recompilar
  #     este módulo quando o arquivo mudar. Transformar suas strings em átomos é seguro aqui
  #     porque o arquivo é nosso e pequeno; não seria seguro para texto digitado por um usuário.
  # ES: La tabla se lee mientras se compila el módulo, del mismo `machine.json` que usa la
  #     implementación en TypeScript. `@external_resource` avisa al compilador que recompile
  #     este módulo cuando el archivo cambie. Convertir sus strings en átomos es seguro aquí
  #     porque el archivo es nuestro y pequeño; no sería seguro para texto escrito por un usuario.
  @table_path Path.expand("../../machine.json", __DIR__)
  @external_resource @table_path
  @table @table_path |> File.read!() |> JSON.decode!()

  @states Enum.map(@table["states"], &String.to_atom/1)
  @events Enum.map(@table["events"], &String.to_atom/1)
  @initial String.to_atom(@table["initial"])
  @transitions Enum.map(@table["transitions"], fn row ->
                 {String.to_atom(row["from"]), String.to_atom(row["event"]),
                  String.to_atom(row["to"])}
               end)

  @type state :: atom()
  @type event :: atom()
  @type step :: {event(), state(), state(), :accepted | :rejected}

  @spec states() :: [state()]
  def states, do: @states

  @spec events() :: [event()]
  def events, do: @events

  @spec initial() :: state()
  def initial, do: @initial

  @spec transitions() :: [{state(), event(), state()}]
  def transitions, do: @transitions

  # EN: This loop runs at compile time and writes one clause per row of the table, such as
  #     `def transition(:created, :pay), do: {:ok, :paid}`. Pattern matching then does the
  #     lookup: Elixir tries the clauses from top to bottom and runs the first that matches.
  # PT: Este laço roda em tempo de compilação e escreve uma cláusula por linha da tabela, como
  #     `def transition(:created, :pay), do: {:ok, :paid}`. O casamento de padrões faz então a
  #     consulta: o Elixir testa as cláusulas de cima para baixo e executa a primeira que casa.
  # ES: Este bucle corre en tiempo de compilación y escribe una cláusula por fila de la tabla,
  #     como `def transition(:created, :pay), do: {:ok, :paid}`. El pattern matching hace
  #     entonces la consulta: Elixir prueba las cláusulas de arriba abajo y ejecuta la primera
  #     que coincide.
  @spec transition(state(), event()) ::
          {:ok, state()} | {:error, {:invalid_transition, state(), event()}}
  for {from, event, to} <- @transitions do
    def transition(unquote(from), unquote(event)), do: {:ok, unquote(to)}
  end

  # EN: The catch-all clause comes last on purpose. Every pair that is not in the table lands
  #     here and becomes an explicit error, instead of a crash or a silent change of state.
  #     If it came first, it would match everything and no transition would ever happen.
  # PT: A cláusula genérica vem por último de propósito. Todo par que não está na tabela cai
  #     aqui e vira um erro explícito, em vez de uma falha ou de uma mudança silenciosa de
  #     estado. Se viesse primeiro, casaria com tudo e nenhuma transição aconteceria.
  # ES: La cláusula genérica va al final a propósito. Todo par que no está en la tabla cae aquí
  #     y se vuelve un error explícito, en lugar de una falla o de un cambio silencioso de
  #     estado. Si fuera primero, coincidiría con todo y ninguna transición ocurriría.
  def transition(state, event), do: {:error, {:invalid_transition, state, event}}

  # EN: A terminal state has no way out: the life cycle of the order ended there.
  # PT: Um estado terminal não tem saída: o ciclo de vida do pedido terminou ali.
  # ES: Un estado terminal no tiene salida: el ciclo de vida del pedido terminó ahí.
  @spec terminal?(state()) :: boolean()
  def terminal?(state) do
    not Enum.any?(@transitions, fn {from, _event, _to} -> from == state end)
  end

  # EN: Walks an order through a list of events. A rejected event is recorded and the order
  #     stays where it was, so the following events are still applied.
  # PT: Conduz um pedido por uma lista de eventos. Um evento rejeitado é registrado e o pedido
  #     fica onde estava, então os eventos seguintes ainda são aplicados.
  # ES: Recorre un pedido por una lista de eventos. Un evento rechazado se registra y el pedido
  #     se queda donde estaba, así que los eventos siguientes aún se aplican.
  @spec run([event()], state()) :: {[step()], state()}
  def run(events, state \\ @initial) do
    Enum.map_reduce(events, state, fn event, current ->
      case transition(current, event) do
        {:ok, next} -> {{event, current, next, :accepted}, next}
        {:error, _reason} -> {{event, current, current, :rejected}, current}
      end
    end)
  end

  # EN: Text from the command line is matched against the known event names. No atom is
  #     created from user input: atoms are never garbage collected, so that would let a caller
  #     fill the atom table.
  # PT: O texto da linha de comando é comparado com os nomes de evento conhecidos. Nenhum átomo
  #     é criado a partir de entrada do usuário: átomos nunca são coletados pelo coletor de
  #     lixo, então isso permitiria a quem chama encher a tabela de átomos.
  # ES: El texto de la línea de comandos se compara con los nombres de evento conocidos. Ningún
  #     átomo se crea a partir de la entrada del usuario: los átomos nunca los recoge el
  #     recolector de basura, así que eso permitiría a quien llama llenar la tabla de átomos.
  @spec parse_event(String.t()) :: {:ok, event()} | :error
  for event <- @events do
    def parse_event(unquote(Atom.to_string(event))), do: {:ok, unquote(event)}
  end

  def parse_event(_text), do: :error
end
