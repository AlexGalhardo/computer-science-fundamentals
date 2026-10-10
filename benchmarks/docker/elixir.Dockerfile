# EN: Compiles the Elixir module to BEAM bytecode ahead of time, so a run does not pay for the
#     compiler. The BEAM JIT then turns that bytecode into machine code when the module loads.
# PT: Compila o módulo Elixir para bytecode da BEAM antes da hora, então a execução não paga
#     pelo compilador. O JIT da BEAM depois transforma esse bytecode em código de máquina quando
#     o módulo é carregado.
# ES: Compila el módulo Elixir a bytecode de la BEAM por adelantado, así la ejecución no paga por
#     el compilador. El JIT de la BEAM luego convierte ese bytecode en código de máquina cuando el
#     módulo se carga.
FROM elixir:1.20.4-otp-28-slim
WORKDIR /src
COPY elixir/ .
RUN mkdir -p /opt/bench && elixirc -o /opt/bench main.ex
