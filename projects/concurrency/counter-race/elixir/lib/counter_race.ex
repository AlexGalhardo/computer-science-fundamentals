defmodule CounterRace do
  @moduledoc """
  EN: The actor fix of the counter-race mini-project. One process owns the number and keeps it
  in the argument of its own loop. No other process can read or write that memory: the only
  way to reach the number is to send the owner a message. The owner takes one message at a
  time from its mailbox, so two increments can never overlap.

  PT: A correção por ator do mini-projeto counter-race. Um processo é dono do número e o guarda
  no argumento do próprio laço. Nenhum outro processo consegue ler ou escrever essa memória: o
  único jeito de chegar ao número é mandar uma mensagem ao dono. O dono pega uma mensagem por
  vez da caixa de entrada, então dois incrementos nunca se sobrepõem.

  ES: La corrección por actor del mini-proyecto counter-race. Un proceso es dueño del número y lo
  guarda en el argumento de su propio bucle. Ningún otro proceso puede leer ni escribir esa
  memoria: la única forma de llegar al número es enviarle un mensaje al dueño. El dueño toma un
  mensaje a la vez de su buzón, así que dos incrementos nunca se superponen.
  """

  @doc "Starts the process that owns the counter and returns its pid."
  @spec start() :: pid()
  def start, do: spawn(fn -> loop(0) end)

  # EN: The state lives in the argument `n`. "Changing" it means calling the loop again with a
  #     new value. There is no variable that two processes could write at the same time.
  # PT: O estado vive no argumento `n`. "Alterá-lo" é chamar o laço de novo com um valor novo.
  #     Não existe variável que dois processos possam escrever ao mesmo tempo.
  # ES: El estado vive en el argumento `n`. "Cambiarlo" es llamar al bucle de nuevo con un valor
  #     nuevo. No existe una variable que dos procesos puedan escribir al mismo tiempo.
  defp loop(n) do
    receive do
      :inc ->
        loop(n + 1)

      {:set, value} ->
        loop(value)

      {:get, caller, ref} ->
        send(caller, {ref, n})
        loop(n)

      :stop ->
        :ok
    end
  end

  @doc "Asks the owner to add one. Asynchronous: it does not wait for an answer."
  @spec inc(pid()) :: :inc
  def inc(counter), do: send(counter, :inc)

  @doc "Asks the owner for the current value and waits for the answer."
  @spec value(pid()) :: non_neg_integer()
  def value(counter) do
    ref = make_ref()
    send(counter, {:get, self(), ref})

    receive do
      {^ref, n} -> n
    end
  end

  @doc "Stops the owner process."
  @spec stop(pid()) :: :stop
  def stop(counter), do: send(counter, :stop)

  @doc """
  DELIBERATELY WRONG: reads the value in one message and writes it back in another.

  EN: Actors remove data races, not every race condition. Each message is handled alone, but
  another process can get its own message in between this `get` and this `set`. Both read 41
  and both set 42: the same lost update, now one level up. The fix is to make the whole
  operation ONE message (`inc/1`).

  PT: Atores eliminam corridas de dados, não toda condição de corrida. Cada mensagem é tratada
  sozinha, mas outro processo pode encaixar a própria mensagem entre este `get` e este `set`.
  Os dois leem 41 e os dois gravam 42: a mesma atualização perdida, agora um nível acima.
  A correção é fazer da operação inteira UMA mensagem (`inc/1`).

  ES: Los actores eliminan las carreras de datos, no toda condición de carrera. Cada mensaje se
  atiende por separado, pero otro proceso puede meter su propio mensaje entre este `get` y este
  `set`. Los dos leen 41 y los dos escriben 42: la misma actualización perdida, ahora un nivel
  más arriba. La corrección es hacer de la operación completa UN solo mensaje (`inc/1`).
  """
  @spec get_then_set(pid()) :: {:set, non_neg_integer()}
  def get_then_set(counter), do: send(counter, {:set, value(counter) + 1})

  @doc """
  Increments `per_worker` times from each of `workers` processes and returns the final value.
  `variant` is `:actor` (correct) or `:get_then_set` (deliberately wrong).
  """
  @spec run(:actor | :get_then_set, pos_integer(), non_neg_integer()) :: non_neg_integer()
  def run(variant, workers, per_worker) do
    counter = start()
    parent = self()
    step = if variant == :actor, do: &inc/1, else: &get_then_set/1

    pids =
      for _ <- 1..workers do
        spawn_link(fn ->
          # EN: Starting gate: every worker waits for `:go`, so all of them run at the same time.
          # PT: Portão de largada: todo worker espera o `:go`, então todos rodam ao mesmo tempo.
          # ES: Puerta de salida: todo worker espera el `:go`, así todos corren al mismo tiempo.
          receive do
            :go -> :ok
          end

          for _ <- 1..per_worker//1, do: step.(counter)

          # EN: The BEAM only guarantees message order between one sender and one receiver.
          #     This synchronous call comes after all the increments of this worker, so its
          #     answer proves that the owner already handled every one of them.
          # PT: A BEAM só garante a ordem das mensagens entre um remetente e um destinatário.
          #     Esta chamada síncrona vem depois de todos os incrementos deste worker, então a
          #     resposta prova que o dono já tratou cada um deles.
          # ES: La BEAM solo garantiza el orden de los mensajes entre un remitente y un destinatario.
          #     Esta llamada síncrona viene después de todos los incrementos de este worker, así que
          #     la respuesta prueba que el dueño ya atendió cada uno de ellos.
          value(counter)
          send(parent, {:done, self()})
        end)
      end

    Enum.each(pids, &send(&1, :go))

    for pid <- pids do
      receive do
        {:done, ^pid} -> :ok
      end
    end

    final = value(counter)
    stop(counter)
    final
  end
end
