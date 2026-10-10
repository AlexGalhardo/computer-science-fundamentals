# Seguridad

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

La seguridad de aplicaciones consiste en entender cómo falla el software cuando alguien intenta usarlo de forma indebida, para construirlo de modo que no falle. Esta área es defensiva: cada falla (inyección, cross-site scripting, control de acceso roto, almacenamiento débil de contraseñas) se estudia para explicar por qué ocurre y cómo prevenirla, siguiendo las orientaciones de OWASP. Los laboratorios se ejecutan solo de forma local, en Docker, y siempre incluyen la corrección junto con la falla.

## Miniproyectos

| Miniproyecto | Qué enseña | Estado |
| --- | --- | --- |
| [Laboratorio de inyección SQL](sql-injection-lab/) | Por qué concatenar cadenas en las consultas es explotable y cómo lo evitan las consultas parametrizadas | disponible |
| [Laboratorio de XSS y CSP](xss-csp-lab/) | Cómo funciona la inyección de scripts y cómo el escape y una política de contenido la detienen | disponible |
| [Laboratorio de CSRF](csrf-lab/) | Por qué el navegador envía cookies en solicitudes falsificadas y cómo rechazarlas | disponible |
| [Laboratorio de control de acceso roto](access-control-lab/) | Por qué el servidor debe verificar la propiedad del recurso en cada solicitud | disponible |
| [Laboratorio de SSRF](ssrf-lab/) | Cómo se puede engañar a un servidor para que llame a servicios internos | disponible |
| [Laboratorio de contraseñas y sesiones](passwords-sessions-lab/) | Cómo deben almacenarse las contraseñas y protegerse los inicios de sesión | disponible |
| [Laboratorio de errores con JWT](jwt-lab/) | Las formas comunes en que la validación de tokens sale mal | disponible |
| [Laboratorio de carga de archivos y path traversal](upload-path-traversal-lab/) | Por qué los nombres y tipos de archivo que vienen del cliente no son confiables | disponible |

## Quiz y documentación

- Preguntas del quiz: [quiz/content/security/](../../quiz/content/security/)
- Documentación: [docs/es/security/](../../docs/es/security/)
- Referencias de todas las áreas: [REFERENCES.es.md](../../REFERENCES.es.md)

## Referencias

Fuentes seleccionadas, no una lista exhaustiva. Todos los enlaces se verificaron cuando se escribió la lista.

### Empieza aquí

- [OWASP Top 10](https://top10.owasp.org/), OWASP Foundation. Gratuito. La lista de referencia de los riesgos más críticos de las aplicaciones web, con la edición actual y las anteriores, cada riesgo con ejemplos y consejos de prevención.
- [OWASP Top 10 (2021), tradução em português](https://top10.owasp.org/2021/pt-BR/), OWASP Foundation. En portugués. Gratuito. La traducción oficial al portugués de Brasil de la edición de 2021, la que sigue el quiz.
- [MDN: Security on the web](https://developer.mozilla.org/en-US/docs/Web/Security), Mozilla. Gratuito. Puerta de entrada al modelo de seguridad del navegador: política del mismo origen, HTTPS, CSP, cookies y ataques de los que defenderse.

### Libros

- [Security Engineering, 3rd edition](https://www.cl.cam.ac.uk/archive/rja14/book.html), Ross Anderson. Gratuito en línea, de pago en papel. Un libro de texto amplio y legible sobre cómo se diseñan los sistemas seguros y por qué fallan, con capítulos gratuitos en línea.
- [The Tangled Web](https://nostarch.com/tangledweb), Michal Zalewski. De pago. Explica en detalle el modelo de seguridad del navegador, la razón de la mayoría de las fallas web y sus defensas.
- [API Security in Action](https://www.manning.com/books/api-security-in-action), Neil Madden. De pago. Construye una API segura paso a paso: autenticación, sesiones, tokens, OAuth 2.0 y control de acceso.

### Cursos y clases

- [CS 253 Web Security](https://web.stanford.edu/class/cs253/), Feross Aboukhadijeh, Stanford University. Gratuito. Diapositivas y clases grabadas sobre la política del mismo origen, XSS, CSRF, sesiones, inyección y HTTPS, centradas en las defensas.
- [Cryptography I](https://www.coursera.org/learn/crypto), Dan Boneh, Stanford (Coursera). Gratuito para auditar, certificado de pago. La introducción estándar a cómo funcionan el cifrado, el hashing y la autenticación, y cómo se usan mal.

### Artículos y especificaciones

- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/), OWASP Foundation. Gratuito. Guías de prevención concisas y prácticas por tema: inyección, XSS, CSRF, sesiones, almacenamiento de contraseñas, carga de archivos y más.
- [OWASP Application Security Verification Standard (ASVS)](https://owasp.org/projects/asvs), OWASP Foundation. Gratuito. Una lista de verificación de requisitos de seguridad comprobables, útil para convertir los consejos en pruebas.
- [RFC 8725: JSON Web Token Best Current Practices](https://www.rfc-editor.org/rfc/rfc8725), IETF. Gratuito. La lista oficial de trampas de JWT y las reglas que las evitan, como fijar el algoritmo.
- [RFC 6749: The OAuth 2.0 Authorization Framework](https://www.rfc-editor.org/rfc/rfc6749), IETF. Gratuito. La especificación de los roles, concesiones y tokens de OAuth 2.0.
- [Content Security Policy Level 3](https://w3c.github.io/webappsec-csp/), W3C. Gratuito. La especificación de las directivas, nonces y hashes de CSP.
- [NIST SP 800-63B: Authentication and Authenticator Management](https://pages.nist.gov/800-63-4/sp800-63b.html), NIST. Gratuito. La guía detrás de las reglas modernas de contraseñas: longitud antes que complejidad, verificación de filtraciones y limitación de intentos.
- [The Protection of Information in Computer Systems](https://web.mit.edu/Saltzer/www/publications/protection/), Jerome Saltzer y Michael Schroeder (1975). Gratuito. El origen de principios de diseño como el mínimo privilegio, los valores predeterminados a prueba de fallos y la mediación completa.

### Documentación oficial

- [SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html), OWASP Foundation. Gratuito. Por qué las consultas parametrizadas son la defensa principal, con ejemplos en varios lenguajes.
- [Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html), OWASP Foundation. Gratuito. Qué algoritmos de hash usar (Argon2id primero) y con qué parámetros.
- [MDN: Content Security Policy (CSP)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP), Mozilla. Gratuito. Una guía práctica para escribir una política, con nonces, hashes y el modo de solo informe.
- [Mozilla Web Security Guidelines](https://infosec.mozilla.org/guidelines/web_security), Mozilla. Gratuito. Una tabla de las cabeceras de seguridad y los ajustes de cookies que todo sitio debería tener, con los motivos.

### Videos

- [OWASP Foundation](https://www.youtube.com/@OWASPGLOBAL), OWASP Foundation. Gratuito. Charlas de conferencias grabadas sobre seguridad de aplicaciones y sobre los proyectos de OWASP.

### Práctica y herramientas

- [OWASP Juice Shop](https://owasp.org/projects/juice-shop), OWASP Foundation. Gratuito. Una aplicación de entrenamiento deliberadamente insegura para ejecutar de forma local, el modelo de los laboratorios de esta área.
- [MDN HTTP Observatory](https://developer.mozilla.org/en-US/observatory), Mozilla. Gratuito. Revisa las cabeceras de seguridad de un sitio que te pertenece y explica cada una que falta.
- [Introduction to JSON Web Tokens](https://www.jwt.io/introduction), Auth0, jwt.io. Gratuito. Explica las tres partes de un token y cómo se verifican las firmas, junto a una herramienta que decodifica tokens.

### Comunidades

- [Information Security Stack Exchange](https://security.stackexchange.com/), Stack Exchange. Gratuito. Respuestas cuidadosas sobre autenticación, uso de criptografía y defensa de aplicaciones web.
- [OWASP Chapters](https://owasp.org/chapters/), OWASP Foundation. Gratuito. Grupos locales de OWASP, incluidos varios en Brasil, con reuniones gratuitas.
