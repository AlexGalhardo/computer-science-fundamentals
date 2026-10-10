# Networks

> Versão em português: [README.pt-BR.md](README.pt-BR.md) · Versión en español: [README.es.md](README.es.md)

Computer networks are the layers of protocols that move bytes between machines: from signals on a wire, through frames, packets and routes, up to reliable connections and the applications built on them. Almost every program today talks to another one, so knowing what TCP, IP, DNS and Ethernet actually guarantee is what separates guessing from diagnosing.

## Mini-projects

| Mini-project | What it teaches | Status |
| --- | --- | --- |
| [Sliding window and a mini TCP](sliding-window-mini-tcp/) | How reliability is built on an unreliable channel | available |
| [ALOHA and CSMA/CD simulator](aloha-csma/) | How shared media are contended | available |
| [DNS resolver and subnet calculator](dns-subnet/) | How names are resolved and how addresses are divided | available |

## Quiz and documentation

- Quiz questions: [quiz/content/networks/](../../quiz/content/networks/)
- Documentation: [docs/en/networks/](../../docs/en/networks/)
- References of every area: [REFERENCES.md](../../REFERENCES.md)

## References

Selected sources, not an exhaustive list. Every link was checked when the list was written.

### Start here

- [Computer Networks: A Systems Approach](https://book.systemsapproach.org/), Larry Peterson and Bruce Davie. Free. A full, open textbook that explains each layer through the design problems it solves.
- [Beej's Guide to Network Programming](https://beej.us/guide/bgnet/), Brian "Beej" Hall. Free. The classic hands-on introduction to sockets in C: addresses, TCP, UDP and select.
- [How DNS works](https://howdns.works/), DNSimple. Free. A short comic that follows one name resolution from the browser to the root servers.
- [Curso de Redes](https://www.cursoemvideo.com/curso/redes-de-computadores/), Gustavo Guanabara, Curso em Vídeo. In Portuguese. Free. A beginner video course in Portuguese on how networks and the internet work.

### Books

- [Computer Networking: A Top-Down Approach, 9th edition](https://gaia.cs.umass.edu/kurose_ross/index.php), Jim Kurose and Keith Ross. Free online, paid in print. The most used textbook; the authors' site gives free video lectures, slides and Wireshark labs.
- [Computer Networks, 6th edition](https://www.pearson.com/en-us/subject-catalog/p/computer-networks/P200000003188), Tanenbaum, Feamster and Wetherall. Paid. The bottom-up textbook the quiz follows (in its 5th edition), strong on the data link and MAC layers.
- [High Performance Browser Networking](https://hpbn.co/), Ilya Grigorik. Free online, paid in print. Explains latency, TCP, TLS, HTTP/2 and wireless networks from the point of view of a web application.

### Courses and lectures

- [CS 144 Introduction to Computer Networking](https://cs144.github.io/), Stanford University. Free. Lecture notes and labs in which you build a working TCP implementation step by step.
- [MIT 6.829 Computer Networks](https://ocw.mit.edu/courses/6-829-computer-networks-fall-2002/), MIT OpenCourseWare, Hari Balakrishnan. Free. A graduate course organised around the classic papers on routing, congestion control and wireless.

### Papers and specifications

- [RFC 9293: Transmission Control Protocol (TCP)](https://www.rfc-editor.org/rfc/rfc9293), IETF. Free. The current TCP specification: header, state machine, sequence numbers and retransmission.
- [RFC 1034: Domain Names, Concepts and Facilities](https://www.rfc-editor.org/rfc/rfc1034), Paul Mockapetris, IETF. Free. The design of DNS: the name space, zones, resolvers and iterative and recursive queries.
- [RFC 791: Internet Protocol](https://www.rfc-editor.org/rfc/rfc791), Jon Postel, IETF. Free. The original IPv4 specification, short enough to read whole: addressing, fragmentation and the header.
- [End-to-End Arguments in System Design](https://web.mit.edu/Saltzer/www/publications/endtoend/endtoend.pdf), Saltzer, Reed and Clark (1984). Free. The paper behind the layering of the internet: which guarantees belong in the network and which at the ends.
- [Congestion Avoidance and Control](https://ee.lbl.gov/papers/congavoid.pdf), Van Jacobson and Michael Karels (1988). Free. The origin of slow start and congestion avoidance in TCP, with the reasoning behind each rule.

### Official documentation

- [Wireshark User's Guide](https://www.wireshark.org/docs/wsug_html_chunked/), Wireshark Foundation. Free. Official guide to capturing and reading packets, the best way to see the protocols for real.

### Videos

- [Networking tutorial](https://www.youtube.com/playlist?list=PLowKtXNTBypH19whXTVoG3oKSuOcw_XeW), Ben Eater. Free. Thirteen short videos building up from bits on a wire to Ethernet, IP, routing and TCP.
- [Hussein Nasser](https://www.youtube.com/@hnasr), Hussein Nasser. Free. Long-form videos on TCP, TLS, DNS, proxies and how back ends use the network.

### Practice and tools

- [Julia Evans: networking posts](https://jvns.ca/categories/networking/), Julia Evans. Free. Short, curious blog posts and experiments on DNS, TCP and debugging tools.

### Communities

- [Network Engineering Stack Exchange](https://networkengineering.stackexchange.com/), Stack Exchange. Free. Questions and answers on protocols, subnetting, switching and routing.
- [r/networking](https://www.reddit.com/r/networking/), Reddit. Free. A community of network engineers, useful to see how the theory is used in operation.
