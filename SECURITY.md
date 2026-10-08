# Security Policy · Política de Segurança

> [English](#english) · [Português](#português)

## English

### This repository contains intentionally vulnerable code

The security area holds **labs** that reproduce well-known web vulnerabilities (OWASP Top 10, XSS, SQL injection, weak CSP and others) for **defensive and educational** purposes, in the same spirit as OWASP Juice Shop and DVWA.

**Never deploy a lab to a public or shared network.**

### Scope rules for every lab

1. Runs **only locally**, inside Docker, on a network with **no external access** (`internal: true` in `docker-compose`).
2. Every vulnerable example ships with its **fixed version**.
3. An **automated test** proves that the exploit works against the vulnerable version and fails against the fixed one.
4. Documentation focuses on **why** the flaw happens and **how to prevent** it.
5. No payloads aimed at real systems, no evasion techniques, and no attack tooling that is reusable outside the lab.

### Load and performance tests

k6 scripts and similar tools target **only local services** (`localhost` or `docker-compose`) created in this repository. Third-party URLs are never used.

### Reporting a vulnerability

Flaws inside the labs are intentional and documented. If you find an **unintended** problem (for example, a lab that can reach the external network, a leaked secret, or a vulnerable dependency in non-lab code), please report it privately through [GitHub Security Advisories](https://github.com/AlexGalhardo/computer-science-fundamentals/security/advisories/new) instead of opening a public issue.

---

## Português

### Este repositório contém código intencionalmente vulnerável

A área de segurança reúne **labs** que reproduzem vulnerabilidades web conhecidas (OWASP Top 10, XSS, SQL injection, CSP fraca e outras) com objetivo **defensivo e educacional**, no mesmo espírito do OWASP Juice Shop e do DVWA.

**Nunca faça deploy de um lab em rede pública ou compartilhada.**

### Regras de escopo para todo lab

1. Roda **apenas localmente**, em Docker, em uma rede **sem acesso externo** (`internal: true` no `docker-compose`).
2. Todo exemplo vulnerável vem com a **versão corrigida**.
3. Um **teste automatizado** prova que o exploit funciona contra a versão vulnerável e falha contra a corrigida.
4. A documentação foca em **por que** a falha acontece e **como prevenir**.
5. Nada de payloads voltados a sistemas reais, técnicas de evasão ou ferramentas de ataque reutilizáveis fora do lab.

### Testes de carga e performance

Scripts de k6 e ferramentas similares têm como alvo **somente serviços locais** (`localhost` ou `docker-compose`) criados neste repositório. URLs de terceiros nunca são usadas.

### Como reportar uma vulnerabilidade

Falhas dentro dos labs são intencionais e documentadas. Se você encontrar um problema **não intencional** (por exemplo, um lab que consegue acessar a rede externa, um segredo vazado ou uma dependência vulnerável em código fora dos labs), reporte de forma privada pelo [GitHub Security Advisories](https://github.com/AlexGalhardo/computer-science-fundamentals/security/advisories/new) em vez de abrir uma issue pública.
