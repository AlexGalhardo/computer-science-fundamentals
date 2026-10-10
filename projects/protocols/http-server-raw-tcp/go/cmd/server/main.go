// Command server runs the demo site on a TCP port.
package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"net"
	"os/signal"
	"syscall"
	"time"

	"http-server-raw-tcp/app"
	"http-server-raw-tcp/httpraw"
)

func run(addr string, pause time.Duration) error {
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	// EN: net.Listen gives a TCP socket, and nothing above it. Everything that makes the bytes
	//     "HTTP" is in the httpraw package.
	// PT: net.Listen entrega um socket TCP, e nada acima dele. Tudo o que faz dos bytes "HTTP"
	//     está no pacote httpraw.
	// ES: net.Listen entrega un socket TCP, y nada por encima. Todo lo que convierte los bytes
	//     en "HTTP" está en el paquete httpraw.
	var config net.ListenConfig
	listener, err := config.Listen(ctx, "tcp", addr)
	if err != nil {
		return fmt.Errorf("listen: %w", err)
	}
	server := &httpraw.Server{
		Handler:     app.Routes(pause).Serve,
		IdleTimeout: 10 * time.Second,
		Log:         func(line string) { log.Print(line) },
	}
	log.Printf("listening on %s", listener.Addr())
	if err := server.Serve(ctx, listener); err != nil {
		return fmt.Errorf("serve: %w", err)
	}
	return nil
}

func main() {
	addr := flag.String("addr", ":8080", "address to listen on")
	pause := flag.Duration("pause", 200*time.Millisecond, "wait between two chunks of /stream")
	flag.Parse()
	if err := run(*addr, *pause); err != nil {
		log.Fatal(err)
	}
}
