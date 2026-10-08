package httpraw

import (
	"bufio"
	"fmt"
	"sort"
	"strconv"
)

// Response is what a handler returns. Body is sent with a Content-Length header. When Stream is
// set it is used instead, and the body is sent with chunked transfer encoding.
type Response struct {
	Status int
	Header Header
	Body   []byte
	// Stream produces the body piece by piece. Each call of write sends one chunk at once.
	Stream func(write func(piece []byte) error) error
}

// Text builds a plain text response.
func Text(status int, body string) Response {
	header := Header{}
	header.Add("Content-Type", "text/plain; charset=utf-8")
	return Response{Status: status, Header: header, Body: []byte(body)}
}

var statusTexts = map[int]string{
	200: "OK",
	201: "Created",
	204: "No Content",
	400: "Bad Request",
	404: "Not Found",
	405: "Method Not Allowed",
	408: "Request Timeout",
	413: "Content Too Large",
	414: "URI Too Long",
	431: "Request Header Fields Too Large",
	500: "Internal Server Error",
	501: "Not Implemented",
	505: "HTTP Version Not Supported",
}

// StatusText returns the reason phrase of a status code. The phrase is only for people: clients
// decide by the number.
func StatusText(status int) string {
	if text, ok := statusTexts[status]; ok {
		return text
	}
	return "Unknown"
}

// bodyAllowed reports whether a response to this method with this status may carry a body.
func bodyAllowed(method string, status int) bool {
	return method != "HEAD" && status != 204 && status != 304 && status >= 200
}

// writeResponse serialises one response. method is the request method, keepAlive says whether
// the connection stays open afterwards.
func writeResponse(w *bufio.Writer, method string, resp Response, keepAlive bool) error {
	// EN: The status line: VERSION SP CODE SP REASON, then CRLF.
	// PT: A linha de status: VERSÃO SP CÓDIGO SP MOTIVO, e depois CRLF.
	if _, err := fmt.Fprintf(w, "HTTP/1.1 %d %s\r\n", resp.Status, StatusText(resp.Status)); err != nil {
		return err
	}

	header := Header{}
	for name, values := range resp.Header {
		header[name] = values
	}
	// EN: The receiver must know where the body ends, because the connection stays open for
	//     the next request. There are two ways to say it:
	//       Content-Length: N           the size is known before the first byte is sent
	//       Transfer-Encoding: chunked  the size is not known yet, so the body goes in pieces,
	//                                   each one announcing its own size
	//     Sending both would be a contradiction, so exactly one is set here.
	// PT: O receptor precisa saber onde o corpo termina, porque a conexão continua aberta para
	//     a próxima requisição. Há duas formas de dizer isso:
	//       Content-Length: N           o tamanho é conhecido antes do primeiro byte ser enviado
	//       Transfer-Encoding: chunked  o tamanho ainda não é conhecido, então o corpo vai em
	//                                   pedaços, cada um anunciando o próprio tamanho
	//     Enviar os dois seria uma contradição, então exatamente um é definido aqui.
	delete(header, "content-length")
	delete(header, "transfer-encoding")
	delete(header, "connection")
	chunked := resp.Stream != nil
	switch {
	case chunked:
		header.Add("Transfer-Encoding", "chunked")
	case resp.Status != 204 && resp.Status != 304:
		// A HEAD response announces the length the GET response would have, and sends no body.
		header.Add("Content-Length", strconv.Itoa(len(resp.Body)))
	}
	if keepAlive {
		header.Add("Connection", "keep-alive")
	} else {
		header.Add("Connection", "close")
	}

	// Sorted names make the output deterministic, which the tests and the wire trace rely on.
	names := make([]string, 0, len(header))
	for name := range header {
		names = append(names, name)
	}
	sort.Strings(names)
	for _, name := range names {
		for _, value := range header[name] {
			if _, err := fmt.Fprintf(w, "%s: %s\r\n", canonical(name), value); err != nil {
				return err
			}
		}
	}
	// EN: The empty line that ends the header section.
	// PT: A linha vazia que encerra a seção de cabeçalhos.
	if _, err := w.WriteString("\r\n"); err != nil {
		return err
	}

	if !bodyAllowed(method, resp.Status) {
		return w.Flush()
	}
	if !chunked {
		if _, err := w.Write(resp.Body); err != nil {
			return err
		}
		return w.Flush()
	}

	// EN: Chunked encoding. Each chunk is: its size in HEXADECIMAL, CRLF, the bytes, CRLF.
	//     A chunk of size zero, followed by an empty line, ends the body:
	//         5\r\nhello\r\n   6\r\n world\r\n   0\r\n\r\n
	//     Each chunk is flushed at once, so the client receives the pieces as they are made.
	// PT: Codificação chunked. Cada pedaço é: o tamanho em HEXADECIMAL, CRLF, os bytes, CRLF.
	//     Um pedaço de tamanho zero, seguido de uma linha vazia, encerra o corpo:
	//         5\r\nhello\r\n   6\r\n world\r\n   0\r\n\r\n
	//     Cada pedaço é enviado na hora, então o cliente recebe as partes conforme são feitas.
	writeChunk := func(piece []byte) error {
		if len(piece) == 0 {
			// An empty chunk would be read as the end of the body.
			return nil
		}
		if _, err := fmt.Fprintf(w, "%x\r\n", len(piece)); err != nil {
			return err
		}
		if _, err := w.Write(piece); err != nil {
			return err
		}
		if _, err := w.WriteString("\r\n"); err != nil {
			return err
		}
		return w.Flush()
	}
	if err := resp.Stream(writeChunk); err != nil {
		return err
	}
	if _, err := w.WriteString("0\r\n\r\n"); err != nil {
		return err
	}
	return w.Flush()
}

// canonical turns "content-type" into "Content-Type". Header names are case-insensitive, this
// is only the spelling people are used to reading.
func canonical(name string) string {
	out := []byte(name)
	upper := true
	for i, c := range out {
		if upper && c >= 'a' && c <= 'z' {
			out[i] = c - 'a' + 'A'
		}
		upper = c == '-'
	}
	return string(out)
}
