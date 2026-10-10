# upload-path-traversal-lab

> English version: [README.md](README.md) · Versión en español: [README.es.md](README.es.md)
>
> **Laboratório de segurança, vulnerável de propósito.** O código em `ts/src/vulnerable/` existe apenas para tornar falhas observáveis dentro deste laboratório. Nunca copie, importe ou publique esse código.

Uma pequena API de arquivos com duas rotas, upload e download, acredita em tudo o que o cliente diz sobre um arquivo: o nome, o tipo e o tamanho. O nome é juntado à pasta de uploads, então um nome contendo `../` lê e escreve fora dela (path traversal) e um nome repetido substitui o arquivo de outro usuário. O `Content-Type` declarado é guardado e devolvido, e nada limita o tamanho. Este laboratório reproduz essas falhas e as corrige com uma ideia: **quem decide é o servidor**. Ele gera o nome no disco, encontra arquivos por id em um índice, confere o caminho canônico, detecta o tipo pelos bytes, conta o tamanho durante a leitura e define os cabeçalhos que dizem ao navegador o que fazer com o arquivo.

Código: MP-SEC-8. Explicação completa: [docs/pt/security/upload-path-traversal-lab.md](../../../docs/pt/security/upload-path-traversal-lab.md).

## Tópicos do quiz que ele demonstra

- `security` / `ssrf-path-traversal-upload`: path traversal na leitura e na escrita, verificação de caminho canônico, links simbólicos, nomes de arquivo gerados, validação de tipo por números mágicos, limites de tamanho
- `security` / `csp-security-headers`: `X-Content-Type-Options: nosniff`, `Content-Disposition: attachment` e uma `Content-Security-Policy` restritiva em arquivos de usuários

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-upload-path-traversal-lab.sh        # Linux e macOS
./setup-windows-upload-path-traversal-lab.ps1    # Windows
```

O script constrói a imagem, roda a checagem de tipos e os testes em uma rede interna, e remove tudo no fim.

## Demo

```sh
docker compose run --rm demo
docker compose down -v --remove-orphans
```

Ela imprime os mesmos nove passos duas vezes. Na API vulnerável, `bob-fake` baixa o segredo falso que fica fora da pasta de uploads (com o nome simples e com a forma em percent-encoding), grava um arquivo fora da pasta, substitui o relatório da `alice-fake`, guarda uma página HTML como `image/png` e como `text/html`, envia mais que o limite, e lê o segredo através de um link simbólico. Na API corrigida as mesmas requisições recebem `400`, `415`, `413` e `404`, nada é gravado fora da pasta, e o uso legítimo (um texto, um PNG e um PDF subindo e voltando) continua respondendo `201` e `200`.

## Testes

```sh
docker compose run --rm ts-test
docker compose down -v --remove-orphans
```

O contêiner roda `tsc --noEmit` e depois `bun test`. Cada teste cria a própria pasta temporária (`mkdtemp`) com uma pasta `uploads/` e, ao lado dela, `private/FAKE-SECRET.txt` contendo `FAKE-SECRET-not-real`. Esse arquivo falso é a única coisa lida "de fora". Nenhum arquivo real do sistema é tocado.

| Arquivo | O que prova |
| --- | --- |
| `ts/tests/traversal.test.ts` | As mesmas funções de cenário rodam contra as duas versões. Vulnerável: um nome de download com `../` devolve o segredo falso, a forma codificada `%2e%2e%2f` também, um nome de upload com `../` grava fora da pasta, um segundo upload substitui o arquivo de outro usuário, um link simbólico é seguido. Corrigida: as duas tentativas de download recebem `400`, o upload cai dentro da pasta com um id gerado, os dois uploads recebem ids diferentes, o link não é seguido (`404`). Também: downloads vão por id através do índice |
| `ts/tests/upload.test.ts` | Vulnerável: bytes HTML são aceitos como `image/png` e servidos como `text/html` sem `nosniff`, e não há limite de tamanho. Corrigida: bytes que não batem com o tipo declarado recebem `415`, um arquivo acima do limite recebe `413` (e um corpo em stream é cortado logo depois do limite), downloads levam o tipo detectado, `nosniff`, `attachment` e uma CSP, o nome original volta codificado com segurança, o Zod recusa entrada malformada. Ambas: o uso normal funciona |
| `ts/tests/paths.test.ts` | A verificação de caminho canônico e a detecção de tipo sozinhas, sem HTTP |
| `ts/tests/network.test.ts` | O contêiner não alcança o exterior (uma requisição para `http://example.com` falha) e o processo não roda como root |

## Estrutura

| Caminho | O que é |
| --- | --- |
| `ts/src/data.ts` | Usuários falsos, tokens falsos, o segredo falso e os arquivos de exemplo |
| `ts/src/vulnerable/vulnerable-app.ts` | A API em ElysiaJS que confia no nome, no tipo e no tamanho do cliente. Vulnerável de propósito |
| `ts/src/fixed/fixed-paths.ts` | A verificação de caminho canônico: `resolve`, depois `realpath`, depois "está dentro da raiz?" |
| `ts/src/fixed/fixed-file-type.ts` | A lista de permissão de tipos, decidida pelos primeiros bytes |
| `ts/src/fixed/fixed-app.ts` | A mesma API: ids gerados, um índice, limite de tamanho durante a leitura, cabeçalhos de resposta seguros, Zod |
| `ts/src/scenario.ts` | As tentativas, escritas uma vez e executadas contra as duas versões |
| `ts/src/demo.ts` | O passo a passo impresso pelo serviço `demo` |
| `ts/src/http.ts` | O tipo de erro que carrega o código de status |

## Por que a falha acontece

Um arquivo chega com três pedaços de texto presos a ele: um nome, um tipo e um tamanho. Os três são escritos por quem envia a requisição. A API vulnerável os usa como fatos.

```ts
// vulnerável: o cliente escolhe o caminho
await writeFile(join(uploadRoot, name), bytes);
```

- **`join` monta um caminho, não confina um caminho.** `join("/data/uploads", "../private/x")` é `/data/private/x`. O segmento `..` significa "uma pasta acima" para o sistema operacional, e o nome veio da requisição, então quem chama escolhe onde o servidor lê e onde ele escreve.
- **A decodificação acontece antes de o código ver o valor.** O framework transforma `%2e%2e%2f` em `../` ao interpretar a URL. Uma verificação no texto cru e um uso do texto decodificado estão olhando para duas strings diferentes.
- **Nomes são um espaço compartilhado.** Quando o cliente escolhe o nome no disco, duas pessoas que escolhem o mesmo nome estão escrevendo o mesmo arquivo.
- **`Content-Type` é uma alegação.** A API vulnerável o guarda e o devolve, então quem envia decide como o navegador de todos os outros visitantes trata o arquivo. Uma página HTML servida como `text/html` a partir do endereço da própria aplicação roda como página da aplicação.
- **O navegador pode adivinhar.** Sem `X-Content-Type-Options: nosniff`, alguns navegadores olham o conteúdo e escolhem um tipo diferente do declarado.
- **Ler o corpo inteiro primeiro** significa que o servidor já pagou pela memória quando descobre que o arquivo é grande demais.
- **`readFile` segue links simbólicos.** Um caminho que está dentro da pasta como texto pode terminar em outro lugar do disco.

Nada falha para um usuário honesto, e é por isso que essas falhas sobrevivem a testes de caminho feliz.

## Como prevenir

- **Gere o nome no servidor.** O arquivo é guardado com um id aleatório (`randomUUID()`). O nome do cliente nunca vira parte de um caminho, então não há com o que fazer traversal e dois uploads nunca colidem. A escrita usa a flag `wx`, que falha em vez de substituir um arquivo existente.
- **Guarde o nome original só como metadado.** Ele é validado com Zod (tamanho, sem caracteres de controle), reduzido ao último segmento e devolvido em `Content-Disposition: attachment; filename="..."; filename*=UTF-8''...`, com uma alternativa ASCII e percent-encoding, então aspas ou uma quebra de linha não chegam ao cabeçalho.
- **Baixe por id, através de um índice.** A rota recebe um id, valida como UUID com Zod e o procura em um índice. Um arquivo que está no disco e não está no índice não existe para a API. O caminho é montado a partir do id que o servidor guardou.
- **Confira o caminho canônico mesmo assim.** Aplique `resolve` ao caminho final e exija que ele comece com a raiz mais um separador, depois pergunte ao `realpath` onde ele realmente termina (seguindo links simbólicos) e exija a mesma coisa de novo. Leia o caminho que a verificação devolveu.
- **Decida o tipo pelos bytes, com uma lista de permissão.** PNG e PDF são reconhecidos pelos primeiros bytes (números mágicos) e texto puro por ser UTF-8 válido sem caracteres de controle. Todo o resto é recusado com `415`, assim como um arquivo cujos bytes discordam do tipo declarado. O tipo guardado e servido é o detectado.
- **Limite o tamanho durante a leitura.** O corpo é lido em pedaços e a leitura para no primeiro byte acima do limite (`413`). O `Content-Length` é só um atalho para recusar cedo, porque quem o escreve é o cliente.
- **Sirva arquivos de usuários como dado inerte.** `X-Content-Type-Options: nosniff`, `Content-Disposition: attachment` e `Content-Security-Policy: default-src 'none'; sandbox` em todo download. Em produção, sirva também os arquivos de usuários a partir de um domínio separado, que não carrega nenhuma sessão.
- **Menor privilégio e separação.** O processo roda como o usuário não root `bun`, e a pasta de uploads não fica dentro de nenhuma pasta servida como arquivos estáticos: o único caminho até um arquivo guardado é a rota de download.

Uma assinatura diz como um arquivo começa e não prova nada sobre o resto dele. A detecção de tipo reduz o que é aceito; os cabeçalhos da resposta são o que impede um arquivo aceito de ser tratado como página.

## O que não funciona como correção

- **Remover `../` do nome uma vez.** Uma única passada pelo texto pode deixar para trás uma sequência que vira `../` depois da remoção ou depois de uma decodificação posterior, então o filtro e o sistema de arquivos acabam lendo duas strings diferentes. Compare caminhos canônicos em vez de limpar texto, ou melhor, não use o nome.
- **Conferir só a extensão.** A extensão faz parte do nome, e quem escreve o nome é o cliente. `chart.png` não diz nada sobre os bytes lá dentro, e o teste envia HTML exatamente com esse nome.
- **Confiar no `Content-Type`.** É um cabeçalho da requisição: o cliente coloca nele o que passar na verificação.
- **Uma lista de bloqueio de extensões.** Uma lista de coisas proibidas é tão boa quanto a memória de quem a escreveu: ela precisa nomear toda extensão perigosa, em toda grafia, em toda plataforma, para sempre. Uma lista de permissão nomeia as poucas coisas aceitas e recusa o resto por padrão.
- **Conferir o caminho só como texto.** Um link simbólico tem um nome perfeitamente inocente. Só o sistema operacional sabe onde ele termina, e é isso que o `realpath` pergunta.
- **Confiar no `Content-Length` para o limite de tamanho.** Mesmo motivo do `Content-Type`: conte os bytes que realmente chegam.

## Escopo de segurança do laboratório

- Tudo roda localmente em Docker, em uma rede do compose com `internal: true`. Nenhuma porta é publicada e um teste prova que o contêiner não alcança o exterior.
- As duas APIs rodam dentro do processo de teste (`app.handle`). Nenhuma requisição sai do contêiner, e nada aqui tem como alvo qualquer outro sistema.
- O único arquivo lido "de fora da pasta" é o `FAKE-SECRET.txt`, criado pelo laboratório em uma pasta temporária e removido depois. Nenhum arquivo real do sistema é lido ou escrito.
- Todos os dados são falsos: `alice-fake`, `bob-fake`, tokens como `FAKE-TOKEN-alice-not-real`, o segredo `FAKE-SECRET-not-real`. O HTML de exemplo enviado não contém script.
- As entradas de demonstração são um nome com traversal e a forma dele em percent-encoding. Não há scanner, fuzzer nem lista de payloads.

## Versões

| Componente | Versão |
| --- | --- |
| Bun | `oven/bun:1.4.2` |
| ElysiaJS | 1.4.30 |
| Zod | 4.6.5 |
| TypeScript | 7.0.2 |
| @types/bun | 1.4.2 |
