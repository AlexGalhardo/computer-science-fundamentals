# EN: Compiles the Elixir module to BEAM bytecode ahead of time, so a run does not pay for the
#     compiler. The BEAM JIT then turns that bytecode into machine code when the module loads.
# PT: Compila o módulo Elixir para bytecode da BEAM antes da hora, então a execução não paga
#     pelo compilador. O JIT da BEAM depois transforma esse bytecode em código de máquina quando
#     o módulo é carregado.
FROM elixir:1.20.4-otp-28-slim
WORKDIR /src
COPY elixir/ .
RUN mkdir -p /opt/bench && elixirc -o /opt/bench main.ex
