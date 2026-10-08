package httpraw

import (
	"bufio"
	"context"
	"errors"
	"io"
	"net"
	"strconv"
	"sync"
	"time"
)

// Server serves HTTP/1.1 on raw TCP connections.
type Server struct {
	Handler Handler
	Limits  Limits
	// IdleTimeout is how long a connection may stay silent while the server waits for a
	// request. It bounds both a slow client and an idle keep-alive connection.
	IdleTimeout time.Duration
	// MaxRequestsPerConn closes a keep-alive connection after this many requests. 0 = no limit.
	MaxRequestsPerConn int
	// Log, when set, receives one line per request and per refused request.
	Log func(line string)
}

func (s *Server) logf(line string) {
	if s.Log != nil {
		s.Log(line)
	}
}

// Serve accepts connections until the context is cancelled, then waits for the open ones.
func (s *Server) Serve(ctx context.Context, listener net.Listener) error {
	go func() {
		<-ctx.Done()
		_ = listener.Close()
	}()
	var open sync.WaitGroup
	defer open.Wait()
	for {
		conn, err := listener.Accept()
		if err != nil {
			if ctx.Err() != nil {
				return nil
			}
			return err
		}
		// EN: One goroutine per connection. TCP gives the server a stream of bytes per client,
		//     and each goroutine reads its own stream in a simple blocking loop.
		// PT: Uma goroutine por conexão. O TCP entrega ao servidor um fluxo de bytes por
		//     cliente, e cada goroutine lê o seu fluxo em um laço bloqueante simples.
		open.Go(func() {
			s.ServeConn(conn)
		})
	}
}

// ServeConn reads requests from one connection and answers them, until one side closes it.
func (s *Server) ServeConn(conn net.Conn) {
	defer func() { _ = conn.Close() }()
	limits := s.Limits
	if limits == (Limits{}) {
		limits = DefaultLimits
	}
	idle := s.IdleTimeout
	if idle == 0 {
		idle = 5 * time.Second
	}
	// EN: The SAME buffered reader is used for every request of the connection. A client may
	//     send the next request before the answer to the first one arrives (pipelining), so
	//     bytes of request 2 can already be in the buffer when request 1 ends. Knowing exactly
	//     where a body ends (Content-Length) is what keeps the two apart.
	// PT: O MESMO leitor com buffer é usado em todas as requisições da conexão. Um cliente pode
	//     enviar a próxima requisição antes de a resposta da primeira chegar (pipelining), então
	//     bytes da requisição 2 já podem estar no buffer quando a requisição 1 termina. Saber
	//     exatamente onde um corpo termina (Content-Length) é o que mantém as duas separadas.
	reader := bufio.NewReader(conn)
	writer := bufio.NewWriter(conn)

	for served := 1; ; served++ {
		_ = conn.SetReadDeadline(time.Now().Add(idle))
		req, err := ReadRequest(reader, limits)
		if err != nil {
			s.refuse(writer, err)
			return
		}

		// EN: Keep-alive. In HTTP/1.1 the connection stays open after a response unless one
		//     side says "Connection: close". In HTTP/1.0 it is the opposite: it closes unless
		//     the client asked for "Connection: keep-alive". Reusing the connection saves a TCP
		//     handshake (and a TLS one, when there is TLS) on every request after the first.
		// PT: Keep-alive. No HTTP/1.1 a conexão continua aberta depois de uma resposta, a menos
		//     que um dos lados diga "Connection: close". No HTTP/1.0 é o contrário: ela fecha, a
		//     menos que o cliente tenha pedido "Connection: keep-alive". Reaproveitar a conexão
		//     economiza um handshake TCP (e um de TLS, quando há TLS) em cada requisição depois
		//     da primeira.
		keepAlive := req.Proto == "HTTP/1.1" && !req.Header.HasToken("Connection", "close")
		if req.Proto == "HTTP/1.0" {
			keepAlive = req.Header.HasToken("Connection", "keep-alive")
		}
		if s.MaxRequestsPerConn > 0 && served >= s.MaxRequestsPerConn {
			keepAlive = false
		}

		resp := s.Handler(req)
		// EN: Chunked encoding does not exist in HTTP/1.0. For such a client the only way to
		//     mark the end of a body of unknown size is to close the connection, so the stream
		//     is collected and sent with a Content-Length instead.
		// PT: A codificação chunked não existe no HTTP/1.0. Para um cliente assim a única forma
		//     de marcar o fim de um corpo de tamanho desconhecido é fechar a conexão, então o
		//     fluxo é juntado e enviado com Content-Length.
		if resp.Stream != nil && req.Proto == "HTTP/1.0" {
			resp = buffered(resp)
		}
		_ = conn.SetWriteDeadline(time.Now().Add(idle))
		if err := writeResponse(writer, req.Method, resp, keepAlive); err != nil {
			s.logf("write failed: " + err.Error())
			return
		}
		s.logf(req.Method + " " + req.Target + " -> " + strconv.Itoa(resp.Status))
		if !keepAlive {
			return
		}
	}
}

// refuse answers a request that could not be read, when an answer makes sense.
func (s *Server) refuse(writer *bufio.Writer, err error) {
	// EN: After a malformed request the server cannot know where the next one would start, so
	//     it answers once and closes the connection. Trying to "resynchronise" on the following
	//     bytes is exactly what request smuggling attacks rely on.
	// PT: Depois de uma requisição malformada o servidor não tem como saber onde a próxima
	//     começaria, então ele responde uma vez e fecha a conexão. Tentar "ressincronizar" nos
	//     bytes seguintes é exatamente aquilo de que os ataques de request smuggling dependem.
	var parseErr *ParseError
	var netErr net.Error
	switch {
	case errors.Is(err, io.EOF):
		// The client closed an idle connection: the normal end, nothing to say.
	case errors.As(err, &parseErr):
		s.logf("refused: " + parseErr.Error())
		_ = writeResponse(writer, "GET", Text(parseErr.Status, parseErr.Reason+"\n"), false)
	case errors.As(err, &netErr) && netErr.Timeout():
		s.logf("idle connection closed")
	default:
		s.logf("read failed: " + err.Error())
	}
}

func buffered(resp Response) Response {
	var body []byte
	err := resp.Stream(func(piece []byte) error {
		body = append(body, piece...)
		return nil
	})
	if err != nil {
		return Text(500, "the handler failed\n")
	}
	return Response{Status: resp.Status, Header: resp.Header, Body: body}
}
