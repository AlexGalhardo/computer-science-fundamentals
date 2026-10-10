package balancer

import (
	"bytes"
	"errors"
	"io"
	"net"
	"net/http"
	"strings"
	"time"
)

// Proxy is the HTTP handler of the balancer: one call of ServeHTTP is one client request.
type Proxy struct {
	pool      *Pool
	strategy  Strategy
	transport http.RoundTripper
	maxBody   int64
}

// Options are the timeouts and limits of the proxy.
type Options struct {
	// DialTimeout is how long to wait for the TCP connection to a back end.
	DialTimeout time.Duration
	// ResponseTimeout is how long to wait for the response headers of a back end.
	ResponseTimeout time.Duration
	// MaxBodyBytes is the largest request body accepted.
	MaxBodyBytes int64
}

// DefaultOptions are short on purpose: a balancer that waits a minute for a dead back end
// makes every client wait a minute.
func DefaultOptions() Options {
	return Options{DialTimeout: time.Second, ResponseTimeout: 5 * time.Second, MaxBodyBytes: 1 << 20}
}

// NewProxy builds the handler.
//
// EN: The transport keeps idle connections to the back ends open and reuses them. This is
// the "two connections" of a layer 7 proxy: the client's connection ends here, and the
// request travels on another one, which usually already exists.
//
// PT: O transporte mantém abertas as conexões ociosas com os back ends e as reutiliza. Estas
// são as "duas conexões" de um proxy de camada 7: a conexão do cliente termina aqui, e a
// requisição viaja em outra, que normalmente já existe.
//
// ES: El transporte mantiene abiertas las conexiones ociosas con los back ends y las reutiliza.
// Estas son las "dos conexiones" de un proxy de capa 7: la conexión del cliente termina aquí, y
// la solicitud viaja en otra, que normalmente ya existe.
func NewProxy(pool *Pool, strategy Strategy, options Options) *Proxy {
	dialer := &net.Dialer{Timeout: options.DialTimeout}
	return &Proxy{
		pool:     pool,
		strategy: strategy,
		maxBody:  options.MaxBodyBytes,
		transport: &http.Transport{
			DialContext:           dialer.DialContext,
			MaxIdleConns:          1024,
			MaxIdleConnsPerHost:   256,
			IdleConnTimeout:       90 * time.Second,
			ResponseHeaderTimeout: options.ResponseTimeout,
			DisableCompression:    true,
		},
	}
}

// hopByHop are the headers that describe one connection, not the request (RFC 9110, 7.6.1).
// A proxy must not copy them to the next hop.
var hopByHop = []string{
	"Connection",
	"Keep-Alive",
	"Proxy-Authenticate",
	"Proxy-Authorization",
	"Proxy-Connection",
	"Te",
	"Trailer",
	"Transfer-Encoding",
	"Upgrade",
}

// EN: `Connection: close, X-Custom` also turns X-Custom into a hop-by-hop header, so the
// values of Connection are read before it is deleted.
// PT: `Connection: close, X-Custom` também transforma X-Custom em cabeçalho hop-by-hop, então
// os valores de Connection são lidos antes de ele ser apagado.
// ES: `Connection: close, X-Custom` también convierte a X-Custom en un encabezado hop-by-hop, así
// que los valores de Connection se leen antes de borrarlo.
func removeHopByHop(header http.Header) {
	for _, value := range header.Values("Connection") {
		for name := range strings.SplitSeq(value, ",") {
			if name = strings.TrimSpace(name); name != "" {
				header.Del(name)
			}
		}
	}
	for _, name := range hopByHop {
		header.Del(name)
	}
}

// EN: The back end sees a connection that comes from the balancer, so the address of the real
// client has to travel in a header. Each proxy appends the peer it received the request
// from. A back end must believe this header only when the connection comes from a proxy it
// trusts, because any client can send it too.
//
// PT: O back end vê uma conexão que vem do balanceador, então o endereço do cliente real
// precisa viajar em um cabeçalho. Cada proxy acrescenta o par de quem recebeu a requisição.
// Um back end só deve acreditar nesse cabeçalho quando a conexão vem de um proxy em que
// confia, porque qualquer cliente também pode enviá-lo.
//
// ES: El back end ve una conexión que viene del balanceador, así que la dirección del cliente
// real debe viajar en un encabezado. Cada proxy agrega el par de quien le entregó la solicitud.
// Un back end solo debe creer en este encabezado cuando la conexión viene de un proxy en el que
// confía, porque cualquier cliente también puede enviarlo.
func forwardedHeaders(in *http.Request) http.Header {
	header := in.Header.Clone()
	removeHopByHop(header)
	if host, _, err := net.SplitHostPort(in.RemoteAddr); err == nil {
		if previous := header.Get("X-Forwarded-For"); previous != "" {
			host = previous + ", " + host
		}
		header.Set("X-Forwarded-For", host)
	}
	header.Set("X-Forwarded-Host", in.Host)
	header.Set("X-Forwarded-Proto", "http")
	return header
}

// EN: When is it safe to send the same request to another back end? Always, if the
// connection was never opened: the back end saw nothing. After the request was sent, only
// if repeating it does no harm: a GET can be repeated, a POST may already have created the
// order or charged the card.
//
// PT: Quando é seguro mandar a mesma requisição para outro back end? Sempre, se a conexão
// nem chegou a ser aberta: o back end não viu nada. Depois que a requisição foi enviada, só
// se repeti-la não causa dano: um GET pode ser repetido, um POST pode já ter criado o pedido
// ou cobrado o cartão.
//
// ES: ¿Cuándo es seguro enviar la misma solicitud a otro back end? Siempre, si la conexión
// nunca llegó a abrirse: el back end no vio nada. Después de que la solicitud se envió, solo
// si repetirla no causa daño: un GET puede repetirse, un POST puede haber creado ya el pedido
// o cobrado la tarjeta.
func canRetry(method string, err error) bool {
	var opErr *net.OpError
	if errors.As(err, &opErr) && opErr.Op == "dial" {
		return true
	}
	switch method {
	case http.MethodGet, http.MethodHead, http.MethodOptions:
		return true
	default:
		return false
	}
}

// ServeHTTP handles one client request.
func (p *Proxy) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	// EN: The body is read into memory so that it can be sent again on a retry. A production
	// proxy streams large bodies and gives up the retry instead.
	// PT: O corpo é lido para a memória para poder ser enviado de novo em uma nova tentativa.
	// Um proxy de produção transmite corpos grandes aos poucos e abre mão da nova tentativa.
	// ES: El cuerpo se lee en memoria para poder enviarse de nuevo en un reintento. Un proxy de
	// producción transmite los cuerpos grandes por partes y renuncia al reintento.
	body, err := io.ReadAll(http.MaxBytesReader(w, r.Body, p.maxBody))
	if err != nil {
		http.Error(w, "request body too large", http.StatusRequestEntityTooLarge)
		return
	}
	header := forwardedHeaders(r)
	backends := p.pool.Backends()
	tried := make(map[*Backend]bool, len(backends))
	usable := func(backend *Backend) bool { return backend.Healthy() && !tried[backend] }

	for range backends {
		backend := p.strategy.Pick(backends, usable)
		if backend == nil {
			break
		}
		tried[backend] = true

		out, err := http.NewRequestWithContext(r.Context(), r.Method, backend.URL.String()+r.URL.RequestURI(), bytes.NewReader(body))
		if err != nil {
			http.Error(w, "bad request", http.StatusBadRequest)
			return
		}
		out.Header = header.Clone()
		out.Host = r.Host

		backend.inFlight.Add(1)
		backend.served.Add(1)
		response, err := p.transport.RoundTrip(out)
		if err == nil {
			copyResponse(w, response)
			backend.inFlight.Add(-1)
			return
		}
		backend.inFlight.Add(-1)

		// The client went away: nobody is waiting, and the back end did nothing wrong.
		if r.Context().Err() != nil {
			return
		}
		// EN: Passive health check: a failed request takes the back end out of rotation at
		// once, without waiting for the next probe. The active check puts it back.
		// PT: Verificação passiva: uma requisição que falha tira o back end da rotação na
		// hora, sem esperar a próxima sonda. A verificação ativa o coloca de volta.
		// ES: Verificación pasiva: una solicitud que falla saca el back end de la rotación de
		// inmediato, sin esperar la siguiente sonda. La verificación activa lo vuelve a poner.
		backend.SetHealthy(false)
		if !canRetry(r.Method, err) {
			http.Error(w, "the back end failed and the request cannot be repeated safely", http.StatusBadGateway)
			return
		}
	}

	if len(tried) == 0 {
		http.Error(w, "no healthy back end", http.StatusServiceUnavailable)
		return
	}
	http.Error(w, "every back end failed", http.StatusBadGateway)
}

// EN: The request counts as "in flight" until the last byte of the answer was copied, which
// is why the caller decrements the counter only after this function returns.
// PT: A requisição conta como "em andamento" até o último byte da resposta ser copiado, e é
// por isso que quem chama só decrementa o contador depois que esta função retorna.
// ES: La solicitud cuenta como "en curso" hasta que se copió el último byte de la respuesta, y
// por eso quien llama solo decrementa el contador después de que esta función retorna.
func copyResponse(w http.ResponseWriter, response *http.Response) {
	defer response.Body.Close() //nolint:errcheck // nothing useful to do with a close error
	removeHopByHop(response.Header)
	for name, values := range response.Header {
		for _, value := range values {
			w.Header().Add(name, value)
		}
	}
	w.WriteHeader(response.StatusCode)
	// A copy error means the client or the back end went away mid-answer; the status is sent.
	_, _ = io.Copy(w, response.Body)
}
