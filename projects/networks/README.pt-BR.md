# Redes

> English version: [README.md](README.md)

Redes de computadores são as camadas de protocolos que movem bytes entre máquinas: dos sinais em um fio, passando por quadros, pacotes e rotas, até conexões confiáveis e as aplicações construídas sobre elas. Quase todo programa hoje conversa com outro, então saber o que TCP, IP, DNS e Ethernet realmente garantem é o que separa adivinhar de diagnosticar.

## Miniprojetos

| Miniprojeto | O que ensina | Situação |
| --- | --- | --- |
| [Janela deslizante e um mini TCP](sliding-window-mini-tcp/) | Como a confiabilidade é construída sobre um canal não confiável | disponível |
| [Simulador de ALOHA e CSMA/CD](aloha-csma/) | Como se disputa um meio compartilhado | disponível |
| [Resolvedor DNS e calculadora de sub-redes](dns-subnet/) | Como nomes são resolvidos e como endereços são divididos | disponível |

## Quiz e documentação

- Perguntas do quiz: [quiz/content/networks/](../../quiz/content/networks/)
- Documentação: [docs/pt/networks/](../../docs/pt/networks/)
- Referências de todas as áreas: [REFERENCES.pt-BR.md](../../REFERENCES.pt-BR.md)

## Referências

Fontes selecionadas, não uma lista exaustiva. Todos os links foram verificados quando a lista foi escrita.

### Comece por aqui

- [Computer Networks: A Systems Approach](https://book.systemsapproach.org/), Larry Peterson and Bruce Davie. Gratuito. Livro-texto completo e aberto que explica cada camada pelos problemas de projeto que ela resolve.
- [Beej's Guide to Network Programming](https://beej.us/guide/bgnet/), Brian "Beej" Hall. Gratuito. A introdução prática clássica a sockets em C: endereços, TCP, UDP e select.
- [How DNS works](https://howdns.works/), DNSimple. Gratuito. Quadrinho curto que acompanha uma resolução de nome do navegador até os servidores raiz.
- [Curso de Redes](https://www.cursoemvideo.com/curso/redes-de-computadores/), Gustavo Guanabara, Curso em Vídeo. Em português. Gratuito. Curso em vídeo para iniciantes em português sobre como funcionam as redes e a internet.

### Livros

- [Computer Networking: A Top-Down Approach, 9th edition](https://gaia.cs.umass.edu/kurose_ross/index.php), Jim Kurose and Keith Ross. Gratuito online, pago impresso. O livro-texto mais usado; o site dos autores oferece gratuitamente videoaulas, slides e laboratórios de Wireshark.
- [Computer Networks, 6th edition](https://www.pearson.com/en-us/subject-catalog/p/computer-networks/P200000003188), Tanenbaum, Feamster and Wetherall. Pago. O livro-texto de baixo para cima que o quiz segue (na 5ª edição), forte nas camadas de enlace e de acesso ao meio.
- [High Performance Browser Networking](https://hpbn.co/), Ilya Grigorik. Gratuito online, pago impresso. Explica latência, TCP, TLS, HTTP/2 e redes sem fio do ponto de vista de uma aplicação web.

### Cursos e aulas

- [CS 144 Introduction to Computer Networking](https://cs144.github.io/), Stanford University. Gratuito. Notas de aula e laboratórios em que você constrói uma implementação funcional de TCP passo a passo.
- [MIT 6.829 Computer Networks](https://ocw.mit.edu/courses/6-829-computer-networks-fall-2002/), MIT OpenCourseWare, Hari Balakrishnan. Gratuito. Curso de pós-graduação organizado em torno dos artigos clássicos de roteamento, controle de congestionamento e redes sem fio.

### Artigos e especificações

- [RFC 9293: Transmission Control Protocol (TCP)](https://www.rfc-editor.org/rfc/rfc9293), IETF. Gratuito. A especificação atual do TCP: cabeçalho, máquina de estados, números de sequência e retransmissão.
- [RFC 1034: Domain Names, Concepts and Facilities](https://www.rfc-editor.org/rfc/rfc1034), Paul Mockapetris, IETF. Gratuito. O projeto do DNS: o espaço de nomes, zonas, resolvedores e consultas iterativas e recursivas.
- [RFC 791: Internet Protocol](https://www.rfc-editor.org/rfc/rfc791), Jon Postel, IETF. Gratuito. A especificação original do IPv4, curta o bastante para ler inteira: endereçamento, fragmentação e cabeçalho.
- [End-to-End Arguments in System Design](https://web.mit.edu/Saltzer/www/publications/endtoend/endtoend.pdf), Saltzer, Reed and Clark (1984). Gratuito. O artigo por trás da divisão em camadas da internet: que garantias cabem à rede e quais às pontas.
- [Congestion Avoidance and Control](https://ee.lbl.gov/papers/congavoid.pdf), Van Jacobson and Michael Karels (1988). Gratuito. A origem do slow start e da prevenção de congestionamento no TCP, com o raciocínio por trás de cada regra.

### Documentação oficial

- [Wireshark User's Guide](https://www.wireshark.org/docs/wsug_html_chunked/), Wireshark Foundation. Gratuito. Guia oficial para capturar e ler pacotes, a melhor forma de ver os protocolos de verdade.

### Vídeos

- [Networking tutorial](https://www.youtube.com/playlist?list=PLowKtXNTBypH19whXTVoG3oKSuOcw_XeW), Ben Eater. Gratuito. Treze vídeos curtos que vão de bits em um fio a Ethernet, IP, roteamento e TCP.
- [Hussein Nasser](https://www.youtube.com/@hnasr), Hussein Nasser. Gratuito. Vídeos longos sobre TCP, TLS, DNS, proxies e como os back-ends usam a rede.

### Prática e ferramentas

- [Julia Evans: networking posts](https://jvns.ca/categories/networking/), Julia Evans. Gratuito. Textos curtos e curiosos de blog, com experimentos sobre DNS, TCP e ferramentas de depuração.

### Comunidades

- [Network Engineering Stack Exchange](https://networkengineering.stackexchange.com/), Stack Exchange. Gratuito. Perguntas e respostas sobre protocolos, sub-redes, comutação e roteamento.
- [r/networking](https://www.reddit.com/r/networking/), Reddit. Gratuito. Comunidade de engenheiros de redes, útil para ver como a teoria é usada na operação.
