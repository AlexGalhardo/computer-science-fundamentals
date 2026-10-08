# Segurança

> English version: [README.md](README.md)

Segurança de aplicações é entender como o software falha quando alguém tenta usá-lo de forma indevida, para construí-lo de modo que não falhe. Esta área é defensiva: cada falha (injeção, cross-site scripting, controle de acesso quebrado, armazenamento fraco de senhas) é estudada para explicar por que acontece e como preveni-la, seguindo as orientações da OWASP. Os laboratórios rodam apenas localmente, em Docker, e sempre trazem a correção junto com a falha.

## Miniprojetos

| Miniprojeto | O que ensina | Situação |
| --- | --- | --- |
| [Laboratório de injeção de SQL](sql-injection-lab/) | Por que concatenar strings em consultas é explorável e como consultas parametrizadas evitam isso | disponível |
| [Laboratório de XSS e CSP](xss-csp-lab/) | Como funciona a injeção de scripts e como o escape e uma política de conteúdo a impedem | disponível |
| [Laboratório de CSRF](csrf-lab/) | Por que o navegador envia cookies em requisições forjadas e como recusá-las | disponível |
| [Laboratório de controle de acesso quebrado](access-control-lab/) | Por que o servidor precisa verificar a posse do recurso em toda requisição | disponível |
| [Laboratório de SSRF](ssrf-lab/) | Como um servidor pode ser enganado para chamar serviços internos | disponível |
| [Laboratório de senhas e sessões](passwords-sessions-lab/) | Como senhas devem ser armazenadas e logins protegidos | disponível |
| [Laboratório de erros com JWT](jwt-lab/) | As formas comuns de a validação de tokens dar errado | disponível |
| [Laboratório de upload e path traversal](upload-path-traversal-lab/) | Por que nomes e tipos de arquivo vindos do cliente não são confiáveis | disponível |

## Quiz e documentação

- Perguntas do quiz: [quiz/content/security/](../../quiz/content/security/)
- Documentação: [docs/pt/security/](../../docs/pt/security/)
- Referências de todas as áreas: [REFERENCES.pt-BR.md](../../REFERENCES.pt-BR.md)

## Referências

Fontes selecionadas, não uma lista exaustiva. Todos os links foram verificados quando a lista foi escrita.

### Comece por aqui

- [OWASP Top 10](https://top10.owasp.org/), OWASP Foundation. Gratuito. A lista de referência dos riscos mais críticos de aplicações web, com a edição atual e as anteriores, cada risco com exemplos e orientações de prevenção.
- [OWASP Top 10 (2021), tradução em português](https://top10.owasp.org/2021/pt-BR/), OWASP Foundation. Em português. Gratuito. A tradução oficial em português do Brasil da edição de 2021, a que o quiz segue.
- [MDN: Security on the web](https://developer.mozilla.org/en-US/docs/Web/Security), Mozilla. Gratuito. Porta de entrada para o modelo de segurança do navegador: política de mesma origem, HTTPS, CSP, cookies e ataques contra os quais se defender.

### Livros

- [Security Engineering, 3rd edition](https://www.cl.cam.ac.uk/archive/rja14/book.html), Ross Anderson. Gratuito online, pago impresso. Livro-texto amplo e agradável sobre como sistemas seguros são projetados e por que falham, com capítulos gratuitos online.
- [The Tangled Web](https://nostarch.com/tangledweb), Michal Zalewski. Pago. Explica em detalhe o modelo de segurança do navegador, a razão da maioria das falhas web e de suas defesas.
- [API Security in Action](https://www.manning.com/books/api-security-in-action), Neil Madden. Pago. Constrói uma API segura passo a passo: autenticação, sessões, tokens, OAuth 2.0 e controle de acesso.

### Cursos e aulas

- [CS 253 Web Security](https://web.stanford.edu/class/cs253/), Feross Aboukhadijeh, Stanford University. Gratuito. Slides e aulas gravadas sobre política de mesma origem, XSS, CSRF, sessões, injeção e HTTPS, com foco nas defesas.
- [Cryptography I](https://www.coursera.org/learn/crypto), Dan Boneh, Stanford (Coursera). Gratuito como ouvinte, certificado pago. A introdução padrão a como funcionam criptografia, hashing e autenticação e como são mal utilizados.

### Artigos e especificações

- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/), OWASP Foundation. Gratuito. Guias de prevenção concisos e práticos por tema: injeção, XSS, CSRF, sessões, armazenamento de senhas, upload de arquivos e mais.
- [OWASP Application Security Verification Standard (ASVS)](https://owasp.org/projects/asvs), OWASP Foundation. Gratuito. Lista de requisitos de segurança verificáveis, útil para transformar orientações em testes.
- [RFC 8725: JSON Web Token Best Current Practices](https://www.rfc-editor.org/rfc/rfc8725), IETF. Gratuito. A lista oficial de armadilhas do JWT e das regras que as evitam, como fixar o algoritmo.
- [RFC 6749: The OAuth 2.0 Authorization Framework](https://www.rfc-editor.org/rfc/rfc6749), IETF. Gratuito. A especificação dos papéis, concessões e tokens do OAuth 2.0.
- [Content Security Policy Level 3](https://w3c.github.io/webappsec-csp/), W3C. Gratuito. A especificação das diretivas, nonces e hashes da CSP.
- [NIST SP 800-63B: Authentication and Authenticator Management](https://pages.nist.gov/800-63-4/sp800-63b.html), NIST. Gratuito. A diretriz por trás das regras modernas de senha: comprimento em vez de complexidade, checagem de vazamentos e limitação de tentativas.
- [The Protection of Information in Computer Systems](https://web.mit.edu/Saltzer/www/publications/protection/), Jerome Saltzer and Michael Schroeder (1975). Gratuito. A origem de princípios de projeto como privilégio mínimo, padrões seguros e mediação completa.

### Documentação oficial

- [SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html), OWASP Foundation. Gratuito. Por que consultas parametrizadas são a defesa principal, com exemplos em várias linguagens.
- [Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html), OWASP Foundation. Gratuito. Quais algoritmos de hash usar (Argon2id primeiro) e com quais parâmetros.
- [MDN: Content Security Policy (CSP)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP), Mozilla. Gratuito. Guia prático para escrever uma política, com nonces, hashes e o modo somente relatório.
- [Mozilla Web Security Guidelines](https://infosec.mozilla.org/guidelines/web_security), Mozilla. Gratuito. Tabela dos cabeçalhos de segurança e das configurações de cookies que todo site deveria ter, com os motivos.

### Vídeos

- [OWASP Foundation](https://www.youtube.com/@OWASPGLOBAL), OWASP Foundation. Gratuito. Palestras gravadas de conferências sobre segurança de aplicações e sobre os projetos da OWASP.

### Prática e ferramentas

- [OWASP Juice Shop](https://owasp.org/projects/juice-shop), OWASP Foundation. Gratuito. Aplicação de treinamento deliberadamente insegura para rodar localmente, o modelo para os laboratórios desta área.
- [MDN HTTP Observatory](https://developer.mozilla.org/en-US/observatory), Mozilla. Gratuito. Verifica os cabeçalhos de segurança de um site seu e explica cada um que falta.
- [Introduction to JSON Web Tokens](https://www.jwt.io/introduction), Auth0, jwt.io. Gratuito. Explica as três partes de um token e como as assinaturas são verificadas, ao lado de uma ferramenta que decodifica tokens.

### Comunidades

- [Information Security Stack Exchange](https://security.stackexchange.com/), Stack Exchange. Gratuito. Respostas cuidadosas sobre autenticação, uso de criptografia e defesa de aplicações web.
- [OWASP Chapters](https://owasp.org/chapters/), OWASP Foundation. Gratuito. Grupos locais da OWASP, incluindo vários no Brasil, com encontros gratuitos.
