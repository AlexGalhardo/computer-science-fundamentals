# dns-subnet

> English version: [README.md](README.md) · Versión en español: [README.es.md](README.es.md)

Como nomes são resolvidos e como endereços são divididos. Duas ferramentas:

1. Um **resolvedor DNS iterativo** em Go, com cache que respeita o tempo de vida, funcionando contra uma hierarquia falsa de servidores raiz, de TLD e com autoridade, que também fazem parte do projeto. Ele fala o formato real de mensagens DNS sobre UDP e imprime cada passo.
2. Uma **calculadora de sub-redes** em TypeScript: rede, broadcast, faixa de máquinas e máscara para qualquer CIDR IPv4.

Explicação completa: [docs/pt/networks/dns-subnet.md](../../../docs/pt/networks/dns-subnet.md).

## Tudo é local

O laboratório nunca fala com um servidor DNS real. Os três servidores de nomes e o resolvedor rodam em uma rede do docker-compose marcada com `internal: true`, que não tem rota para fora, e nenhuma porta é publicada. As zonas são falsas: o TLD é `test` (reservado pela RFC 2606) e os endereços das respostas vêm das faixas de documentação da RFC 5737. O único endereço que o resolvedor recebe é o do servidor raiz falso.

## Tópicos do quiz que ele demonstra

- `networks` / `application-layer`: função do DNS, tipos de registro (A, NS, CNAME), resolução iterativa, cache e tempo de vida
- `networks` / `network-layer`: sub-redes e CIDR, endereços de rede e de broadcast, número de máquinas, se dois endereços estão na mesma sub-rede

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-dns-subnet.sh        # Linux e macOS
./setup-windows-dns-subnet.ps1    # Windows
```

O script constrói as imagens e roda os testes das duas linguagens.

## Demonstração

Laboratório de DNS:

```sh
docker compose up -d root tld auth        # os três servidores de nomes falsos
docker compose run --rm -T resolver       # resolve sete nomes, imprimindo cada passo
docker compose logs root tld auth         # o que cada servidor foi perguntado
docker compose down -v                    # remove os contêineres e a rede
```

Calculadora de sub-redes:

```sh
docker compose run --rm -T ts-subnet                                        # a tabela de casos
docker compose run --rm -T ts-subnet bun run src/cli.ts 192.168.10.77/26    # qualquer CIDR
```

Saídas versionadas: [results/resolution.txt](results/resolution.txt) e [results/subnets.md](results/subnets.md).

Para resolver outros nomes das zonas falsas, passe-os ao resolvedor. `wait=5s` faz uma pausa, o que deixa registros em cache expirarem:

```sh
docker compose run --rm -T resolver resolve -roots 10.253.53.2 mail.example.test wait=5s mail.example.test
```

## Estrutura

| Caminho | O que é |
| --- | --- |
| `go/dnsmsg` | formato de mensagens DNS: cabeçalho, pergunta, registros A, NS e CNAME, compressão de nomes |
| `go/zone` | leitor de arquivo de zona e a lógica de uma resposta com autoridade ou de uma indicação |
| `go/server` | servidor de nomes UDP com uma ou mais zonas |
| `go/resolver` | resolvedor iterativo e cache com TTL |
| `go/cmd/nameserver`, `go/cmd/resolve` | os dois comandos usados pelo arquivo compose |
| `go/zones` | as zonas falsas |
| `ts/src/subnet.ts` | a calculadora de sub-redes |
| `ts/src/cases.ts` | tabela de casos CIDR calculados à mão |
| `results/` | saídas versionadas |

Go fica com a parte de DNS porque ela trata de sockets e de um protocolo binário. TypeScript fica com a calculadora de sub-redes, em que a lição é aritmética de bits e as armadilhas dos operadores de 32 bits do JavaScript.

## Testes

```sh
docker compose run --rm -T go-test
docker compose run --rm -T ts-test
```

Os testes em Go sobem os mesmos três servidores dentro do processo de teste, em endereços de loopback, então também rodam com a rede desativada. Eles cobrem o formato das mensagens (incluindo pacotes hostis), indicações com e sem glue, o caminho da raiz até o servidor com autoridade, o cache respondendo a uma segunda consulta e expirando exatamente na hora (com um relógio falso), apelidos, nomes inexistentes e a rejeição de registros sobre os quais um servidor não tem autoridade. Os testes em TypeScript comparam a calculadora com a tabela de casos.
