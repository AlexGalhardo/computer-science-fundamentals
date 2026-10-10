# EN: The formatter check of the workflow looks for folders that hold a mix.exs file and formats
#     what is inside them, so the Elixir sample is a (tiny) Mix project.
# PT: A checagem de formatação do workflow procura pastas que tenham um mix.exs e formata o que
#     está dentro delas, então o exemplo em Elixir é um (pequeno) projeto Mix.
# ES: La comprobación de formato del workflow busca carpetas que tengan un mix.exs y formatea lo
#     que hay dentro, así que el ejemplo en Elixir es un (pequeño) proyecto Mix.
defmodule CiPipelineSample.MixProject do
  use Mix.Project

  def project do
    [app: :ci_pipeline_sample, version: "0.1.0", elixir: "~> 1.20", deps: []]
  end
end
