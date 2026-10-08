// Command trace prints the raw bytes of a few HTTP exchanges with the demo site. It is the
// source of the wire trace shown in the README.
package main

import (
	"context"
	"fmt"
	"os"

	"http-server-raw-tcp/app"
	"http-server-raw-tcp/trace"
)

type scenario struct {
	title string
	raw   string
}

// EN: Each scenario is the exact text a client would put on the wire. "Connection: close" on
//     the last request of a scenario makes the server close the connection, which ends the
//     trace.
// PT: Cada cenário é o texto exato que um cliente colocaria no fio. "Connection: close" na
//     última requisição de um cenário faz o servidor fechar a conexão, o que encerra o rastro.

var scenarios = []scenario{
	{
		"1. A POST with a body delimited by Content-Length",
		"POST /echo HTTP/1.1\r\nHost: localhost\r\nContent-Type: text/plain\r\nContent-Length: 11\r\nConnection: close\r\n\r\nhello world",
	},
	{
		"2. Keep-alive: two requests on the same TCP connection",
		"GET /hello/ana HTTP/1.1\r\nHost: localhost\r\n\r\nGET /hello/bia HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n",
	},
	{
		"3. A chunked response",
		"GET /stream HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n",
	},
	{
		"4. A malformed request line",
		"GET /hello/ana\r\nHost: localhost\r\n\r\n",
	},
}

func main() {
	ctx := context.Background()
	handler := app.Routes(0).Serve
	for index, item := range scenarios {
		exchange, err := trace.Run(ctx, handler, item.raw)
		if err != nil {
			fmt.Fprintln(os.Stderr, "trace:", err)
			os.Exit(1)
		}
		fmt.Printf("== %s ==\n\n", item.title)
		fmt.Print(trace.Visible("> ", exchange.Sent))
		fmt.Println()
		fmt.Print(trace.Visible("< ", exchange.Received))
		if index == 0 {
			fmt.Printf("\nThe same request as bytes (%d bytes):\n\n", len(exchange.Sent))
			fmt.Print(trace.HexDump(exchange.Sent))
		}
		fmt.Println()
	}
}
