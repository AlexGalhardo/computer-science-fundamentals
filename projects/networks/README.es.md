# Redes

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Las redes de computadoras son las capas de protocolos que mueven bytes entre máquinas: desde las señales en un cable, pasando por tramas, paquetes y rutas, hasta las conexiones confiables y las aplicaciones construidas sobre ellas. Casi todo programa hoy habla con otro, así que saber qué garantizan realmente TCP, IP, DNS y Ethernet es lo que separa adivinar de diagnosticar.

## Mini-proyectos

| Mini-proyecto | Qué enseña | Estado |
| --- | --- | --- |
| [Ventana deslizante y un mini TCP](sliding-window-mini-tcp/) | Cómo se construye la confiabilidad sobre un canal no confiable | disponible |
| [Simulador de ALOHA y CSMA/CD](aloha-csma/) | Cómo se disputa un medio compartido | disponible |
| [Resolvedor DNS y calculadora de subredes](dns-subnet/) | Cómo se resuelven los nombres y cómo se dividen las direcciones | disponible |

## Quiz y documentación

- Preguntas del quiz: [quiz/content/networks/](../../quiz/content/networks/)
- Documentación: [docs/es/networks/](../../docs/es/networks/)
- Referencias de todas las áreas: [REFERENCES.es.md](../../REFERENCES.es.md)

## Referencias

Fuentes seleccionadas, no una lista exhaustiva. Todos los enlaces se verificaron cuando se escribió la lista.

### Empieza por aquí

- [Computer Networks: A Systems Approach](https://book.systemsapproach.org/), Larry Peterson and Bruce Davie. Gratis. Libro de texto completo y abierto que explica cada capa a través de los problemas de diseño que resuelve.
- [Beej's Guide to Network Programming](https://beej.us/guide/bgnet/), Brian "Beej" Hall. Gratis. La introducción práctica clásica a los sockets en C: direcciones, TCP, UDP y select.
- [How DNS works](https://howdns.works/), DNSimple. Gratis. Una historieta corta que sigue una resolución de nombre desde el navegador hasta los servidores raíz.
- [Curso de Redes](https://www.cursoemvideo.com/curso/redes-de-computadores/), Gustavo Guanabara, Curso em Vídeo. En portugués. Gratis. Un curso en video para principiantes, en portugués, sobre cómo funcionan las redes e internet.

### Libros

- [Computer Networking: A Top-Down Approach, 9th edition](https://gaia.cs.umass.edu/kurose_ross/index.php), Jim Kurose and Keith Ross. Gratis en línea, de pago impreso. El libro de texto más usado; el sitio de los autores ofrece gratis videoclases, diapositivas y laboratorios de Wireshark.
- [Computer Networks, 6th edition](https://www.pearson.com/en-us/subject-catalog/p/computer-networks/P200000003188), Tanenbaum, Feamster and Wetherall. De pago. El libro de texto de abajo hacia arriba que sigue el quiz (en su 5.ª edición), sólido en las capas de enlace de datos y de acceso al medio.
- [High Performance Browser Networking](https://hpbn.co/), Ilya Grigorik. Gratis en línea, de pago impreso. Explica latencia, TCP, TLS, HTTP/2 y redes inalámbricas desde el punto de vista de una aplicación web.

### Cursos y clases

- [CS 144 Introduction to Computer Networking](https://cs144.github.io/), Stanford University. Gratis. Apuntes de clase y laboratorios en los que construyes paso a paso una implementación funcional de TCP.
- [MIT 6.829 Computer Networks](https://ocw.mit.edu/courses/6-829-computer-networks-fall-2002/), MIT OpenCourseWare, Hari Balakrishnan. Gratis. Un curso de posgrado organizado en torno a los artículos clásicos sobre enrutamiento, control de congestión y redes inalámbricas.

### Artículos y especificaciones

- [RFC 9293: Transmission Control Protocol (TCP)](https://www.rfc-editor.org/rfc/rfc9293), IETF. Gratis. La especificación vigente de TCP: encabezado, máquina de estados, números de secuencia y retransmisión.
- [RFC 1034: Domain Names, Concepts and Facilities](https://www.rfc-editor.org/rfc/rfc1034), Paul Mockapetris, IETF. Gratis. El diseño de DNS: el espacio de nombres, las zonas, los resolvedores y las consultas iterativas y recursivas.
- [RFC 791: Internet Protocol](https://www.rfc-editor.org/rfc/rfc791), Jon Postel, IETF. Gratis. La especificación original de IPv4, lo bastante corta para leerla entera: direccionamiento, fragmentación y encabezado.
- [End-to-End Arguments in System Design](https://web.mit.edu/Saltzer/www/publications/endtoend/endtoend.pdf), Saltzer, Reed and Clark (1984). Gratis. El artículo detrás de la división en capas de internet: qué garantías corresponden a la red y cuáles a los extremos.
- [Congestion Avoidance and Control](https://ee.lbl.gov/papers/congavoid.pdf), Van Jacobson and Michael Karels (1988). Gratis. El origen del slow start y de la evitación de congestión en TCP, con el razonamiento detrás de cada regla.

### Documentación oficial

- [Wireshark User's Guide](https://www.wireshark.org/docs/wsug_html_chunked/), Wireshark Foundation. Gratis. Guía oficial para capturar y leer paquetes, la mejor forma de ver los protocolos de verdad.

### Videos

- [Networking tutorial](https://www.youtube.com/playlist?list=PLowKtXNTBypH19whXTVoG3oKSuOcw_XeW), Ben Eater. Gratis. Trece videos cortos que van de los bits en un cable a Ethernet, IP, enrutamiento y TCP.
- [Hussein Nasser](https://www.youtube.com/@hnasr), Hussein Nasser. Gratis. Videos largos sobre TCP, TLS, DNS, proxies y cómo los back ends usan la red.

### Práctica y herramientas

- [Julia Evans: networking posts](https://jvns.ca/categories/networking/), Julia Evans. Gratis. Entradas de blog cortas y curiosas, con experimentos sobre DNS, TCP y herramientas de depuración.

### Comunidades

- [Network Engineering Stack Exchange](https://networkengineering.stackexchange.com/), Stack Exchange. Gratis. Preguntas y respuestas sobre protocolos, subredes, conmutación y enrutamiento.
- [r/networking](https://www.reddit.com/r/networking/), Reddit. Gratis. Una comunidad de ingenieros de redes, útil para ver cómo se usa la teoría en la operación.
