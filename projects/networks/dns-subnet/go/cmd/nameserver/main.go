// Command nameserver is an authoritative DNS server for the fake zones of the lab.
package main

import (
	"context"
	"flag"
	"fmt"
	"net"
	"os"
	"os/signal"
	"syscall"

	"dns-subnet/server"
	"dns-subnet/zone"
)

func main() {
	listen := flag.String("listen", ":53", "UDP address to listen on")
	label := flag.String("name", "nameserver", "label used in the log lines")
	flag.Parse()
	if err := run(*listen, *label, flag.Args()); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func run(listen, label string, files []string) error {
	if len(files) == 0 {
		return fmt.Errorf("no zone file given, usage: nameserver [-listen addr] [-name label] zone-file")
	}
	srv := &server.Server{Log: func(line string) { fmt.Printf("[%s] %s\n", label, line) }}
	for _, file := range files {
		text, err := os.ReadFile(file)
		if err != nil {
			return fmt.Errorf("reading the zone: %w", err)
		}
		parsed, err := zone.Parse(string(text))
		if err != nil {
			return fmt.Errorf("%s: %w", file, err)
		}
		srv.Zones = append(srv.Zones, parsed)
		fmt.Printf("[%s] serving zone %s\n", label, parsed.Origin)
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	var config net.ListenConfig
	conn, err := config.ListenPacket(ctx, "udp", listen)
	if err != nil {
		return fmt.Errorf("listening on %s: %w", listen, err)
	}
	return srv.Serve(ctx, conn)
}
