// Package httpraw is a small HTTP/1.1 server written directly on TCP sockets, without net/http.
// It exists to show what is inside a request and a response: lines of text ended by CRLF, an
// empty line, and a body whose length the headers announce.
package httpraw

import (
	"bufio"
	"errors"
	"fmt"
	"io"
	"strconv"
	"strings"
)

// Limits bounds what the parser accepts. A server that reads "until the client stops sending"
// can be made to hold memory forever, so every part of a request has a maximum size.
type Limits struct {
	MaxRequestLine int   // bytes of the first line, without the line ending
	MaxHeaderBytes int   // bytes of all the header lines together
	MaxHeaderCount int   // number of header lines
	MaxBodyBytes   int64 // bytes of the body announced by Content-Length
}

// DefaultLimits are small on purpose: the tests reach them with short inputs.
var DefaultLimits = Limits{
	MaxRequestLine: 4096,
	MaxHeaderBytes: 8192,
	MaxHeaderCount: 100,
	MaxBodyBytes:   1 << 20,
}

// ParseError is a request the server refuses. Status is the HTTP status code that describes
// the refusal to the client.
type ParseError struct {
	Status int
	Reason string
}

func (e *ParseError) Error() string {
	return fmt.Sprintf("%d %s: %s", e.Status, StatusText(e.Status), e.Reason)
}

func refuse(status int, format string, args ...any) *ParseError {
	return &ParseError{Status: status, Reason: fmt.Sprintf(format, args...)}
}

// Request is one parsed HTTP request.
type Request struct {
	Method string
	Target string // the request target exactly as sent, for example "/hello/ana?x=1"
	Path   string // the target without the query string
	Query  string // the text after "?", not decoded
	Proto  string // "HTTP/1.1" or "HTTP/1.0"
	Header Header
	Body   []byte
	Params map[string]string // values of the ":name" segments of the matched route
}

// Header holds the header fields. Names are case-insensitive in HTTP, so they are stored in
// lower case. A name that appears twice keeps both values, in order.
type Header map[string][]string

// Get returns the first value of a header field, or "" when it is absent.
func (h Header) Get(name string) string {
	values := h[strings.ToLower(name)]
	if len(values) == 0 {
		return ""
	}
	return values[0]
}

// Add appends a value to a header field.
func (h Header) Add(name, value string) {
	key := strings.ToLower(name)
	h[key] = append(h[key], value)
}

// HasToken reports whether a comma-separated header field contains the token, ignoring case.
// It is how "Connection: keep-alive, Upgrade" is searched for "keep-alive".
func (h Header) HasToken(name, token string) bool {
	for _, value := range h[strings.ToLower(name)] {
		for part := range strings.SplitSeq(value, ",") {
			if strings.EqualFold(strings.TrimSpace(part), token) {
				return true
			}
		}
	}
	return false
}

// errLineTooLong is returned by readLine when a line does not fit in the limit.
var errLineTooLong = errors.New("line too long")

// readLine reads one line and removes its ending. At most limit bytes of content are accepted.
func readLine(r *bufio.Reader, limit int) (string, error) {
	// EN: HTTP/1.1 ends every line with CRLF ("\r\n"). The standard allows a server to also
	//     accept a bare LF, and this one does. What it must NOT accept is a bare CR in the
	//     middle of a line: two programs that disagree about where a line ends can be tricked
	//     into seeing different requests in the same bytes (request smuggling).
	// PT: O HTTP/1.1 termina toda linha com CRLF ("\r\n"). O padrão permite que um servidor
	//     aceite também um LF sozinho, e este aceita. O que ele NÃO pode aceitar é um CR solto
	//     no meio da linha: dois programas que discordam sobre onde uma linha termina podem ser
	//     levados a enxergar requisições diferentes nos mesmos bytes (request smuggling).
	// ES: HTTP/1.1 termina toda línea con CRLF ("\r\n"). El estándar permite que un servidor
	//     acepte también un LF solo, y este lo acepta. Lo que NO puede aceptar es un CR suelto
	//     en medio de la línea: dos programas que discrepan sobre dónde termina una línea
	//     pueden terminar viendo peticiones distintas en los mismos bytes (request smuggling).
	var line []byte
	for {
		b, err := r.ReadByte()
		if err != nil {
			return "", err
		}
		if b == '\n' {
			break
		}
		if len(line) >= limit+1 {
			return "", errLineTooLong
		}
		line = append(line, b)
	}
	if n := len(line); n > 0 && line[n-1] == '\r' {
		line = line[:n-1]
	}
	if len(line) > limit {
		return "", errLineTooLong
	}
	if strings.ContainsRune(string(line), '\r') {
		return "", refuse(400, "bare CR inside a line")
	}
	return string(line), nil
}

// isToken reports whether s is a valid HTTP token: the characters allowed in a method name and
// in a header field name.
func isToken(s string) bool {
	if s == "" {
		return false
	}
	for _, c := range []byte(s) {
		switch {
		case c >= 'a' && c <= 'z', c >= 'A' && c <= 'Z', c >= '0' && c <= '9':
		case strings.IndexByte("!#$%&'*+-.^_`|~", c) >= 0:
		default:
			return false
		}
	}
	return true
}

// ReadRequest reads and parses exactly one request from r.
//
// It returns io.EOF when the connection was closed before the first byte of a request, which
// is the normal end of a keep-alive connection. Every other failure caused by the client is a
// *ParseError carrying the status code to answer with.
func ReadRequest(r *bufio.Reader, limits Limits) (*Request, error) {
	// EN: Part 1, the request line: METHOD SP TARGET SP VERSION, for example
	//     "GET /hello/ana HTTP/1.1". Exactly two spaces, so exactly three parts.
	// PT: Parte 1, a linha de requisição: MÉTODO SP ALVO SP VERSÃO, por exemplo
	//     "GET /hello/ana HTTP/1.1". Exatamente dois espaços, então exatamente três partes.
	// ES: Parte 1, la línea de petición: MÉTODO SP DESTINO SP VERSIÓN, por ejemplo
	//     "GET /hello/ana HTTP/1.1". Exactamente dos espacios, así que exactamente tres partes.
	line, err := readLine(r, limits.MaxRequestLine)
	if err != nil {
		switch {
		case errors.Is(err, errLineTooLong):
			return nil, refuse(414, "request line longer than %d bytes", limits.MaxRequestLine)
		case errors.Is(err, io.EOF):
			return nil, io.EOF
		}
		return nil, err
	}
	parts := strings.Split(line, " ")
	if len(parts) != 3 {
		return nil, refuse(400, "request line must be METHOD SP TARGET SP VERSION")
	}
	req := &Request{Method: parts[0], Target: parts[1], Proto: parts[2], Header: Header{}}
	if !isToken(req.Method) {
		return nil, refuse(400, "invalid method")
	}
	if !strings.HasPrefix(req.Target, "/") {
		return nil, refuse(400, "the request target must start with /")
	}
	switch {
	case req.Proto == "HTTP/1.1" || req.Proto == "HTTP/1.0":
	case strings.HasPrefix(req.Proto, "HTTP/"):
		return nil, refuse(505, "only HTTP/1.0 and HTTP/1.1 are supported")
	default:
		return nil, refuse(400, "invalid protocol version")
	}
	req.Path, req.Query, _ = strings.Cut(req.Target, "?")

	// EN: Part 2, the header fields: one "Name: value" per line, until an EMPTY line. That
	//     empty line is the only thing that separates the headers from the body.
	// PT: Parte 2, os campos de cabeçalho: um "Nome: valor" por linha, até uma linha VAZIA.
	//     Essa linha vazia é a única coisa que separa os cabeçalhos do corpo.
	// ES: Parte 2, los campos de cabecera: un "Nombre: valor" por línea, hasta una línea VACÍA.
	//     Esa línea vacía es lo único que separa las cabeceras del cuerpo.
	headerBytes := 0
	for count := 0; ; count++ {
		// The +1 lets a line that exactly fills the remaining budget be told from one that exceeds it.
		line, err := readLine(r, limits.MaxHeaderBytes-headerBytes+1)
		if err != nil {
			if errors.Is(err, errLineTooLong) {
				return nil, refuse(431, "header section longer than %d bytes", limits.MaxHeaderBytes)
			}
			var parseErr *ParseError
			if errors.As(err, &parseErr) {
				return nil, err
			}
			return nil, refuse(400, "connection closed in the middle of the headers")
		}
		if line == "" {
			break
		}
		headerBytes += len(line)
		if headerBytes > limits.MaxHeaderBytes {
			return nil, refuse(431, "header section longer than %d bytes", limits.MaxHeaderBytes)
		}
		if count >= limits.MaxHeaderCount {
			return nil, refuse(431, "more than %d header fields", limits.MaxHeaderCount)
		}
		// EN: A line that starts with a space used to mean "continuation of the previous
		//     header". It is obsolete and refused, like a space between the name and the colon:
		//     both are read differently by different programs.
		// PT: Uma linha que começa com espaço significava "continuação do cabeçalho anterior".
		//     Isso é obsoleto e recusado, assim como um espaço entre o nome e os dois-pontos:
		//     os dois casos são lidos de formas diferentes por programas diferentes.
		// ES: Una línea que empieza con espacio significaba "continuación de la cabecera anterior".
		//     Eso es obsoleto y se rechaza, igual que un espacio entre el nombre y los dos puntos:
		//     ambos casos los leen de forma distinta programas distintos.
		if line[0] == ' ' || line[0] == '\t' {
			return nil, refuse(400, "obsolete line folding in a header")
		}
		name, value, found := strings.Cut(line, ":")
		if !found || !isToken(name) {
			return nil, refuse(400, "malformed header line")
		}
		req.Header.Add(name, strings.Trim(value, " \t"))
	}

	// EN: HTTP/1.1 requires exactly one Host header: one IP address can serve many sites, and
	//     Host is how the server knows which one the client wants.
	// PT: O HTTP/1.1 exige exatamente um cabeçalho Host: um endereço IP pode servir vários
	//     sites, e é pelo Host que o servidor sabe qual deles o cliente quer.
	// ES: HTTP/1.1 exige exactamente una cabecera Host: una dirección IP puede servir varios
	//     sitios, y es por el Host que el servidor sabe cuál de ellos quiere el cliente.
	if req.Proto == "HTTP/1.1" && len(req.Header["host"]) != 1 {
		return nil, refuse(400, "HTTP/1.1 requires exactly one Host header")
	}

	// EN: Part 3, the body. Nothing in the byte stream marks its end, so the headers must say
	//     how long it is. This server reads bodies delimited by Content-Length only. A request
	//     with Transfer-Encoding is refused with 501 instead of being guessed at: a server that
	//     ignored the header would read the body wrongly and treat its bytes as a new request.
	// PT: Parte 3, o corpo. Nada no fluxo de bytes marca o fim dele, então os cabeçalhos
	//     precisam dizer o tamanho. Este servidor lê apenas corpos delimitados por
	//     Content-Length. Uma requisição com Transfer-Encoding é recusada com 501 em vez de
	//     ser adivinhada: um servidor que ignorasse o cabeçalho leria o corpo errado e trataria
	//     os bytes dele como uma nova requisição.
	// ES: Parte 3, el cuerpo. Nada en el flujo de bytes marca su final, así que las cabeceras
	//     deben decir el tamaño. Este servidor lee solo cuerpos delimitados por Content-Length.
	//     Una petición con Transfer-Encoding se rechaza con 501 en lugar de adivinarse: un
	//     servidor que ignorara la cabecera leería mal el cuerpo y trataría sus bytes como una
	//     petición nueva.
	if len(req.Header["transfer-encoding"]) > 0 {
		return nil, refuse(501, "request bodies with Transfer-Encoding are not supported")
	}
	length, err := contentLength(req.Header)
	if err != nil {
		return nil, err
	}
	if length > limits.MaxBodyBytes {
		return nil, refuse(413, "body of %d bytes, the limit is %d", length, limits.MaxBodyBytes)
	}
	if length > 0 {
		req.Body = make([]byte, length)
		if _, err := io.ReadFull(r, req.Body); err != nil {
			return nil, refuse(400, "connection closed before the %d bytes of the body arrived", length)
		}
	}
	return req, nil
}

// contentLength returns the body length announced by the headers, 0 when there is none.
func contentLength(h Header) (int64, error) {
	// EN: The value must be only digits. "+5", "5 5" or "0x10" are refused, and so are two
	//     Content-Length headers that disagree: guessing which one is right is how a proxy and
	//     a server end up disagreeing about where the request ends.
	// PT: O valor precisa ter só dígitos. "+5", "5 5" ou "0x10" são recusados, assim como dois
	//     cabeçalhos Content-Length que discordam: adivinhar qual está certo é como um proxy e
	//     um servidor acabam discordando sobre onde a requisição termina.
	// ES: El valor debe tener solo dígitos. "+5", "5 5" o "0x10" se rechazan, igual que dos
	//     cabeceras Content-Length que discrepan: adivinar cuál es la correcta es como un proxy
	//     y un servidor terminan discrepando sobre dónde termina la petición.
	values := h["content-length"]
	if len(values) == 0 {
		return 0, nil
	}
	for _, value := range values[1:] {
		if value != values[0] {
			return 0, refuse(400, "conflicting Content-Length headers")
		}
	}
	text := values[0]
	if text == "" || strings.Trim(text, "0123456789") != "" {
		return 0, refuse(400, "Content-Length must be a decimal number")
	}
	length, err := strconv.ParseInt(text, 10, 64)
	if err != nil {
		return 0, refuse(400, "Content-Length is out of range")
	}
	return length, nil
}
