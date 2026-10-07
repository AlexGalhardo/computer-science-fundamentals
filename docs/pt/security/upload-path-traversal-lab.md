# Laboratório de upload e path traversal: nomes e tipos de arquivo vindos do cliente (MP-SEC-8)

> English version: [docs/en/security/upload-path-traversal-lab.md](../../en/security/upload-path-traversal-lab.md)

Mini-projeto: [`projects/security/upload-path-traversal-lab`](../../../projects/security/upload-path-traversal-lab/README.pt-BR.md). Tópicos do quiz: `ssrf-path-traversal-upload`, `csp-security-headers`.

Este é um laboratório defensivo. Ele roda só em Docker, em uma rede interna, com dados falsos, e o único arquivo lido "de fora" é um segredo falso que o laboratório cria em uma pasta temporária. O código vulnerável existe apenas para tornar as falhas observáveis.

## O conceito

Um upload de arquivo carrega os bytes do arquivo e três descrições dele. As descrições são texto escrito pelo cliente:

| O que o cliente envia | O que isso realmente é | Quem precisa decidir no lugar |
| --- | --- | --- |
| O nome do arquivo | Um rótulo, que pode conter `/`, `\` e `..` | O servidor gera o nome no disco |
| `Content-Type` | Uma alegação sobre o conteúdo | O servidor lê os primeiros bytes |
| `Content-Length` | Uma alegação sobre o tamanho | O servidor conta os bytes conforme chegam |

**Path traversal** é o que acontece quando um nome vindo da requisição vira parte de um caminho. Para o sistema operacional, `..` significa "a pasta acima", então um nome pode sair da pasta que a aplicação tinha em mente. O **caminho canônico** é a forma final única de um caminho depois de aplicar todo `.` e `..` e de seguir todo link simbólico. Dois textos diferentes podem nomear o mesmo arquivo, então uma decisão sobre um caminho só é confiável quando tomada sobre a forma canônica.

## A falha

```
disco do laboratório                    bob-fake -> servidor vulnerável
<tmp>/uploads/            raiz          GET /download?file=../private/FAKE-SECRET.txt
<tmp>/private/                            join(uploads, "../private/FAKE-SECRET.txt")
    FAKE-SECRET.txt       fora          = <tmp>/private/FAKE-SECRET.txt -> 200, o segredo
```

A API vulnerável faz `join(uploadRoot, name)` e usa o resultado, para ler e para escrever:

- **Leitura fora da pasta.** O download devolve o segredo falso. A forma em percent-encoding do mesmo nome também funciona, porque a URL é decodificada antes de o handler rodar.
- **Escrita fora da pasta.** O upload guarda o arquivo onde o nome apontar.
- **Sobrescrita.** Os nomes são compartilhados, então um segundo `report.txt` substitui o primeiro, seja de quem for.
- **Tipo escolhido pelo cliente.** O `Content-Type` declarado é guardado e devolvido sem `nosniff` e sem `Content-Disposition`. Uma página HTML enviada como `text/html` é servida como página da aplicação.
- **Sem limite de tamanho.** O corpo inteiro é lido para a memória antes de qualquer verificação.
- **Links simbólicos são seguidos.** Um link dentro da pasta que aponta para fora é lido como qualquer arquivo.

## A correção

| Camada | O que a API corrigida faz |
| --- | --- |
| Nome no disco | `randomUUID()` gerado pelo servidor. Gravado com a flag `wx`, que nunca substitui um arquivo |
| Nome original | Só metadado: validado com Zod, reduzido ao último segmento, devolvido em um `Content-Disposition: attachment` codificado |
| Busca | Download por id: o id é validado como UUID com Zod e procurado em um índice. Ids desconhecidos e arquivos de outros usuários respondem `404` |
| Caminho canônico | `resolve`, exigir "raiz + separador" como prefixo, depois `realpath` (da raiz e do arquivo) e exigir de novo. O caminho conferido é o caminho lido |
| Tipo | Lista de permissão decidida pelos primeiros bytes: PNG, PDF, texto puro em UTF-8. Um tipo declarado fora da lista, bytes desconhecidos ou uma divergência respondem `415` |
| Tamanho | O corpo é lido em pedaços e cortado no primeiro byte acima do limite: `413` |
| Resposta | Tipo detectado, `X-Content-Type-Options: nosniff`, `Content-Disposition: attachment`, `Content-Security-Policy: default-src 'none'; sandbox` |
| Processo | Usuário não root `bun`, pasta de uploads fora de qualquer pasta estática |

As duas primeiras linhas eliminam o problema (o nome do cliente deixa de ser usado), e as outras são camadas que continuam valendo se uma delas falhar. O separador na comparação de prefixo importa: sem ele, `/data/uploads-old` contaria como dentro de `/data/uploads`.

Dois limites estão declarados no código. Um número mágico diz como um arquivo começa e não prova nada sobre o resto, então são os cabeçalhos da resposta que mantêm inerte um arquivo aceito. E entre o `realpath` e a leitura existe uma pequena janela (uma corrida chamada TOCTOU), fechada na prática pelo fato de que só o servidor escreve na pasta, com nomes que ele gerou.

### O que não é correção

- **Remover `../` uma vez**: uma passada pelo texto pode deixar para trás uma sequência que vira `../` depois, então o filtro e o sistema de arquivos leem strings diferentes.
- **Conferir a extensão**, **confiar no `Content-Type`** ou **confiar no `Content-Length`**: os três são escritos pelo cliente.
- **Uma lista de bloqueio de extensões**: ela precisa lembrar de todo caso perigoso, enquanto uma lista de permissão recusa o que não conhece.
- **Conferir o caminho só como texto**: um link simbólico tem um nome inocente.

## O que os testes provam

| Item | Como é verificado |
| --- | --- |
| MP-SEC-8.1 um teste lê um arquivo fora da pasta de uploads dentro do contêiner | `tests/traversal.test.ts`, "vulnerable API: the flaw is observable": o download de `../private/FAKE-SECRET.txt` responde `200` com `FAKE-SECRET-not-real`, um arquivo criado pelo laboratório em uma pasta temporária. Também a forma codificada, a escrita fora da pasta, a sobrescrita e o link simbólico seguido |
| MP-SEC-8.1 tipo confiado, sem limite de tamanho | `tests/upload.test.ts`: bytes HTML aceitos como `image/png`, servidos como `text/html` sem `nosniff`, e 1 MiB + 1 byte aceito |
| MP-SEC-8.2 o mesmo teste é bloqueado | `tests/traversal.test.ts`, "fixed API: the same attempts are blocked": as mesmas funções de cenário recebem `400`, e o segredo não está na resposta |
| MP-SEC-8.2 uploads válidos continuam funcionando | `tests/upload.test.ts`, "normal use works", nas duas versões: um texto, um PNG e um PDF sobem e voltam byte a byte |
| Escrita fora da pasta bloqueada | O upload chamado `../private/...` não deixa nada fora; um arquivo aparece na pasta, com um UUID como nome |
| Sobrescrita impossível | Dois uploads com o mesmo nome recebem ids diferentes e a primeira dona lê o próprio conteúdo |
| Bytes que não batem com o tipo declarado | HTML como `image/png`, PNG como `text/plain` e bytes desconhecidos chamados `chart.png` respondem `415` |
| Arquivo acima do limite | `413` para 1 MiB + 1 byte, nada guardado; um stream de 64 MiB é cancelado depois do limite; exatamente 1 MiB é aceito |
| Traversal codificado `%2e%2e%2f` | `400` no parâmetro de download |
| Link simbólico não seguido | Um link na pasta de uploads apontando para o segredo responde `404`; `tests/paths.test.ts` testa `realPathInsideRoot` sozinha |
| Cabeçalhos e Zod | `nosniff`, `attachment`, CSP e o nome original codificado em todo download; ids, nomes e `Content-Length` malformados respondem `400` |
| Isolamento do laboratório | `tests/network.test.ts`: uma requisição para `http://example.com` falha de dentro do contêiner, e o processo não é root |

## Como rodar

```sh
cd projects/security/upload-path-traversal-lab
./setup-unix-upload-path-traversal-lab.sh     # build, checagem de tipos e testes
docker compose run --rm demo                  # o passo a passo
docker compose down -v --remove-orphans
```
