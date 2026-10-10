# Security

> Versão em português: [README.pt-BR.md](README.pt-BR.md) · Versión en español: [README.es.md](README.es.md)

Application security is about understanding how software fails when someone tries to misuse it, so that it can be built not to. This area is defensive: each flaw (injection, cross-site scripting, broken access control, weak password storage) is studied to explain why it happens and how to prevent it, following the OWASP guidance. The labs run only locally, in Docker, and always ship the fix together with the flaw.

## Mini-projects

| Mini-project | What it teaches | Status |
| --- | --- | --- |
| [SQL injection lab](sql-injection-lab/) | Why string concatenation in queries is exploitable and how parameterised queries prevent it | available |
| [XSS and CSP lab](xss-csp-lab/) | How script injection works and how escaping and a content policy stop it | available |
| [CSRF lab](csrf-lab/) | Why a browser sends cookies on forged requests and how to refuse them | available |
| [Broken access control lab](access-control-lab/) | Why the server must check ownership on every request | available |
| [SSRF lab](ssrf-lab/) | How a server can be tricked into calling internal services | available |
| [Passwords and sessions lab](passwords-sessions-lab/) | How passwords should be stored and logins protected | available |
| [JWT mistakes lab](jwt-lab/) | The common ways token validation goes wrong | available |
| [Upload and path traversal lab](upload-path-traversal-lab/) | Why file names and types from the client cannot be trusted | available |

## Quiz and documentation

- Quiz questions: [quiz/content/security/](../../quiz/content/security/)
- Documentation: [docs/en/security/](../../docs/en/security/)
- References of every area: [REFERENCES.md](../../REFERENCES.md)

## References

Selected sources, not an exhaustive list. Every link was checked when the list was written.

### Start here

- [OWASP Top 10](https://top10.owasp.org/), OWASP Foundation. Free. The reference list of the most critical web application risks, with the current edition and the earlier ones, each risk with examples and prevention advice.
- [OWASP Top 10 (2021), tradução em português](https://top10.owasp.org/2021/pt-BR/), OWASP Foundation. In Portuguese. Free. The official Brazilian Portuguese translation of the 2021 edition, the one the quiz follows.
- [MDN: Security on the web](https://developer.mozilla.org/en-US/docs/Web/Security), Mozilla. Free. An entry point to the browser security model: same-origin policy, HTTPS, CSP, cookies and attacks to defend against.

### Books

- [Security Engineering, 3rd edition](https://www.cl.cam.ac.uk/archive/rja14/book.html), Ross Anderson. Free online, paid in print. A broad, readable textbook on how secure systems are designed and why they fail, with chapters free online.
- [The Tangled Web](https://nostarch.com/tangledweb), Michal Zalewski. Paid. Explains the browser security model in detail, the reason behind most web flaws and their defences.
- [API Security in Action](https://www.manning.com/books/api-security-in-action), Neil Madden. Paid. Builds a secure API step by step: authentication, sessions, tokens, OAuth 2.0 and access control.

### Courses and lectures

- [CS 253 Web Security](https://web.stanford.edu/class/cs253/), Feross Aboukhadijeh, Stanford University. Free. Slides and recorded lectures on the same-origin policy, XSS, CSRF, sessions, injection and HTTPS, focused on defences.
- [Cryptography I](https://www.coursera.org/learn/crypto), Dan Boneh, Stanford (Coursera). Free to audit, paid certificate. The standard introduction to how encryption, hashing and authentication work and how they are misused.

### Papers and specifications

- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/), OWASP Foundation. Free. Concise, practical prevention guides by topic: injection, XSS, CSRF, sessions, password storage, file upload and more.
- [OWASP Application Security Verification Standard (ASVS)](https://owasp.org/projects/asvs), OWASP Foundation. Free. A checklist of verifiable security requirements, useful to turn advice into tests.
- [RFC 8725: JSON Web Token Best Current Practices](https://www.rfc-editor.org/rfc/rfc8725), IETF. Free. The official list of JWT pitfalls and the rules that avoid them, such as fixing the algorithm.
- [RFC 6749: The OAuth 2.0 Authorization Framework](https://www.rfc-editor.org/rfc/rfc6749), IETF. Free. The specification of the roles, grants and tokens of OAuth 2.0.
- [Content Security Policy Level 3](https://w3c.github.io/webappsec-csp/), W3C. Free. The specification of CSP directives, nonces and hashes.
- [NIST SP 800-63B: Authentication and Authenticator Management](https://pages.nist.gov/800-63-4/sp800-63b.html), NIST. Free. The guideline behind modern password rules: length over complexity, breach checks and rate limiting.
- [The Protection of Information in Computer Systems](https://web.mit.edu/Saltzer/www/publications/protection/), Jerome Saltzer and Michael Schroeder (1975). Free. The origin of design principles such as least privilege, fail-safe defaults and complete mediation.

### Official documentation

- [SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html), OWASP Foundation. Free. Why parameterised queries are the primary defence, with examples in several languages.
- [Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html), OWASP Foundation. Free. Which hashing algorithms to use (Argon2id first) and with which parameters.
- [MDN: Content Security Policy (CSP)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP), Mozilla. Free. A practical guide to writing a policy, with nonces, hashes and the report-only mode.
- [Mozilla Web Security Guidelines](https://infosec.mozilla.org/guidelines/web_security), Mozilla. Free. A table of the security headers and cookie settings every site should have, with the reasons.

### Videos

- [OWASP Foundation](https://www.youtube.com/@OWASPGLOBAL), OWASP Foundation. Free. Recorded conference talks on application security and on the OWASP projects.

### Practice and tools

- [OWASP Juice Shop](https://owasp.org/projects/juice-shop), OWASP Foundation. Free. A deliberately insecure training application to run locally, the model for the labs of this area.
- [MDN HTTP Observatory](https://developer.mozilla.org/en-US/observatory), Mozilla. Free. Checks the security headers of a site you own and explains each missing one.
- [Introduction to JSON Web Tokens](https://www.jwt.io/introduction), Auth0, jwt.io. Free. Explains the three parts of a token and how signatures are checked, next to a tool that decodes tokens.

### Communities

- [Information Security Stack Exchange](https://security.stackexchange.com/), Stack Exchange. Free. Careful answers on authentication, cryptography use and web application defence.
- [OWASP Chapters](https://owasp.org/chapters/), OWASP Foundation. Free. Local OWASP groups, including several in Brazil, with free meetings.
