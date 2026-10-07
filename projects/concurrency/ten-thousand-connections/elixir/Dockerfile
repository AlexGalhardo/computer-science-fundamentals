# EN: One image serves two jobs: the default command runs the server, and the elixir-test
#     service of docker-compose overrides it to run the formatter check and the tests.
#     The project has no dependency, so nothing is downloaded.
# PT: Uma imagem faz dois trabalhos: o comando padrão roda o servidor, e o serviço elixir-test
#     do docker-compose o troca para rodar a verificação de formato e os testes.
#     O projeto não tem dependências, então nada é baixado.
FROM elixir:1.20.4-otp-28-slim
WORKDIR /src
COPY elixir/ .
RUN MIX_ENV=prod mix compile && MIX_ENV=test mix compile
ENV MIX_ENV=prod
EXPOSE 8080
CMD ["mix", "run", "--no-compile", "--no-halt"]
