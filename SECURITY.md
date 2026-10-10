# Security Policy · Política de Segurança · Política de seguridad

> [English](#english) · [Português](#português) · [Español](#español)

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

---

## Español

### Este repositorio contiene código intencionalmente vulnerable

El área de seguridad reúne **laboratorios** que reproducen vulnerabilidades web conocidas (OWASP Top 10, XSS, inyección SQL, CSP débil y otras) con fines **defensivos y educativos**, en el mismo espíritu que OWASP Juice Shop y DVWA.

**Nunca despliegues un laboratorio en una red pública o compartida.**

### Reglas de alcance para todo laboratorio

1. Corre **solo en local**, dentro de Docker, en una red **sin acceso externo** (`internal: true` en `docker-compose`).
2. Todo ejemplo vulnerable incluye su **versión corregida**.
3. Una **prueba automatizada** demuestra que el exploit funciona contra la versión vulnerable y falla contra la corregida.
4. La documentación se centra en **por qué** ocurre la falla y **cómo prevenirla**.
5. Nada de payloads dirigidos a sistemas reales, técnicas de evasión ni herramientas de ataque reutilizables fuera del laboratorio.

### Pruebas de carga y rendimiento

Los scripts de k6 y herramientas similares apuntan **solo a servicios locales** (`localhost` o `docker-compose`) creados en este repositorio. Nunca se usan URL de terceros.

### Cómo reportar una vulnerabilidad

Las fallas dentro de los laboratorios son intencionales y están documentadas. Si encuentras un problema **no intencional** (por ejemplo, un laboratorio que puede acceder a la red externa, un secreto filtrado o una dependencia vulnerable en código fuera de los laboratorios), repórtalo de forma privada mediante [GitHub Security Advisories](https://github.com/AlexGalhardo/computer-science-fundamentals/security/advisories/new) en lugar de abrir un issue público.
