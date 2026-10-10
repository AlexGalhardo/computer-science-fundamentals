# Resolvedor DNS e calculadora de sub-redes

> English version: [docs/en/networks/dns-subnet.md](../../en/networks/dns-subnet.md) · Versión en español: [docs/es/networks/dns-subnet.md](../../es/networks/dns-subnet.md)

Mini-projeto: [`projects/networks/dns-subnet`](../../../projects/networks/dns-subnet/README.pt-BR.md). Linguagens: Go e TypeScript. Tópicos do quiz: `networks` / `application-layer` e `networks` / `network-layer`.

## Parte 1: como um nome é resolvido

### A árvore e quem sabe o quê

O DNS é uma árvore de nomes dividida em **zonas**, e cada zona é servida por servidores que conhecem apenas o seu pedaço:

| Servidor no laboratório | Zona | O que ele sabe |
| --- | --- | --- |
| raiz, 10.253.53.2 | `.` | quem serve `test.` |
| TLD, 10.253.53.3 | `test.` | quem serve `example.test.`, `elsewhere.test.` e `other.test.` |
| com autoridade, 10.253.53.4 | esses três domínios | os registros de fato |

Nenhum servidor tem a resposta inteira, e nenhum deles pergunta a outro. Um servidor que não é dono do nome devolve uma **indicação** (referral): registros NS dizendo a quem perguntar em seguida e, quando os tem, os endereços desses servidores (**glue**).

### Resolução iterativa

O resolvedor começa sabendo uma coisa só: o endereço do servidor raiz. Ele faz a mesma pergunta em cada nível e segue as indicações. Este é o traço versionado ([results/resolution.txt](../../../projects/networks/dns-subnet/results/resolution.txt)):

```text
1. www.example.test. A
  ask 10.253.53.2     (zone .)  www.example.test. A -> referral: test. is served by ns.test.
  ask 10.253.53.3     (zone test.)  www.example.test. A -> referral: example.test. is served by ns1.example.test.
  ask 10.253.53.4     (zone example.test.)  www.example.test. A -> answer: www.example.test. 3 A 192.0.2.10
  queries sent: 3
```

### O cache e o tempo de vida

Todo registro leva um TTL escolhido pelo seu dono: por quantos segundos a resposta pode ser reutilizada. O cache em `go/resolver/cache.go` guarda cada conjunto de registros até o seu menor TTL acabar e repassa os registros com o tempo que lhes resta.

```text
2. www.example.test. A
  cache                        www.example.test. A -> answer: www.example.test. 3 A 192.0.2.10
  queries sent: 0

-- waiting 4s --

3. www.example.test. A
  ask 10.253.53.4     (zone example.test.)  www.example.test. A -> answer: www.example.test. 3 A 192.0.2.10
  queries sent: 1
```

A segunda pergunta não custa nenhum pacote. Depois de 4 segundos o endereço (TTL 3) expirou, mas os registros NS (TTL 300) não, então a terceira pergunta vai direto ao servidor com autoridade: uma consulta em vez de três. O cache mantém os níveis de cima da árvore fora de quase todas as buscas.

Os testes conferem o tempo com um relógio falso em vez de esperar: em 2,999 s a entrada ainda é servida, em 3,000 s ela já não existe.

### Apelidos e indicações sem glue

- `api.example.test.` é um CNAME. O resolvedor guarda o apelido e resolve o nome canônico, que aqui vem do cache.
- `other.test.` é delegado a `ns.elsewhere.test.` e o TLD não envia endereço para ele, porque esse endereço fica em outra zona. O resolvedor precisa parar, resolver o nome do servidor de nomes (recuado no traço) e só então continuar.
- `shop.other.test.` é um apelido para dentro de outra zona. O resolvedor começa uma nova resolução para o destino.
- `missing.example.test.` recebe NXDOMAIN do servidor dono da zona: só uma autoridade pode dizer que um nome não existe.

### No que o resolvedor se recusa a acreditar

As verificações fazem parte da lição de propósito, porque um resolvedor que confia em tudo pode ter o cache envenenado:

| Verificação | Onde |
| --- | --- |
| A resposta precisa vir do endereço consultado (socket conectado), repetir um identificador aleatório de 16 bits e repetir a pergunta | `exchange` |
| Um servidor só é acreditado sobre nomes dentro da zona pela qual foi consultado como autoridade (bailiwick) | `resolve` |
| Glue só é aceito para os servidores de nomes citados na indicação | `resolve` |
| Ponteiros de compressão não podem formar laço, comprimentos não podem passar do fim do pacote | `dnsmsg.Unpack` |

Um teste roda um servidor mentiroso que responde corretamente e ainda embute um registro de um nome de outra zona; o registro nunca chega ao cache.

### Formato das mensagens

`go/dnsmsg` implementa o formato real da RFC 1035 para o que o laboratório precisa: o cabeçalho de 12 bytes, uma pergunta e registros dos tipos A, NS e CNAME nas seções answer, authority e additional. Nomes são sequências de rótulos precedidos pelo tamanho e podem terminar em um ponteiro de compressão. Como o formato é o real, os servidores falsos e o resolvedor poderiam, em princípio, conversar com ferramentas padrão, mas nada no laboratório é exposto fora da sua rede interna.

## Parte 2: como endereços são divididos

Um endereço IPv4 é um número de 32 bits. Um prefixo `/n` diz que os primeiros n bits identificam a rede. `ts/src/subnet.ts` deriva tudo a partir disso:

| Valor | Como |
| --- | --- |
| máscara | n uns seguidos de 32 - n zeros |
| rede | endereço E máscara |
| broadcast | rede OU (NÃO máscara) |
| máquinas | 2^(32 - n) - 2, pois rede e broadcast são reservados |

Exemplo resolvido, `192.168.10.77/26`:

```text
endereço   11000000.10101000.00001010.01 001101   192.168.10.77
máscara    11111111.11111111.11111111.11 000000   255.255.255.192
rede       11000000.10101000.00001010.01 000000   192.168.10.64
broadcast  11000000.10101000.00001010.01 111111   192.168.10.127
máquinas   192.168.10.65 a 192.168.10.126         62 endereços
```

Casos de borda cobertos pela tabela em [results/subnets.md](../../../projects/networks/dns-subnet/results/subnets.md): um `/31` é um enlace ponto a ponto com dois endereços utilizáveis e nada reservado (RFC 3021), um `/32` é uma máquina só, e `/0` é o espaço de endereços inteiro.

### Por que TypeScript

A linguagem de referência do repositório faz desta calculadora uma lição à parte. Os operadores de bits do JavaScript trabalham com inteiros de 32 bits **com sinal**, então `192 << 24` é negativo e uma máscara montada de forma ingênua aparece como número negativo. O número de posições de um deslocamento é tomado módulo 32, então `x << 32` não faz nada e o `/0` precisa de um caso especial. O código usa `>>> 0` para voltar a números sem sinal e um teste confere as 33 máscaras bit a bit.

`contains` responde à pergunta que uma máquina faz antes de enviar um pacote: o destino está na minha sub-rede (entrega direta) ou não (envia ao roteador)? `10.20.37.130/22` e `10.20.38.5` estão na mesma sub-rede, embora o terceiro octeto seja diferente.

## Limites

- Apenas os tipos de registro A, NS e CNAME. Sem registros IPv6 e sem SOA, então respostas negativas não entram no cache.
- Apenas UDP, mensagens de até 1500 bytes, sem tratamento de truncamento e sem EDNS.
- Sem DNSSEC: as verificações de bailiwick e de identificador reduzem o espaço para falsificação, não provam autenticidade.
- O cache serve a uma goroutine só e existe apenas enquanto o comando roda.

## Como verificar

```sh
cd projects/networks/dns-subnet
docker compose run --rm -T go-test
docker compose run --rm -T ts-test
docker compose up -d root tld auth
docker compose run --rm -T resolver
docker network inspect dns-subnet_dnslab --format '{{.Internal}}'    # imprime true
docker compose down -v
```
