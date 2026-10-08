// Package trace sends raw bytes to the server over a real TCP connection and prints what went
// each way, with the invisible characters made visible.
package trace

import (
	"bufio"
	"context"
	"fmt"
	"io"
	"net"
	"strings"
	"time"

	"http-server-raw-tcp/httpraw"
)

// Exchange is the bytes of one connection: everything the client sent and everything the server
// answered until it closed.
type Exchange struct {
	Sent     []byte
	Received []byte
}

// Run starts a server with the handler on a loopback port chosen by the system, sends the raw
// request bytes, and reads until the server closes the connection.
func Run(ctx context.Context, handler httpraw.Handler, raw string) (Exchange, error) {
	var config net.ListenConfig
	listener, err := config.Listen(ctx, "tcp", "127.0.0.1:0")
	if err != nil {
		return Exchange{}, fmt.Errorf("listen: %w", err)
	}
	serveCtx, cancel := context.WithCancel(ctx)
	defer cancel()
	server := &httpraw.Server{Handler: handler, IdleTimeout: 2 * time.Second}
	done := make(chan error, 1)
	go func() { done <- server.Serve(serveCtx, listener) }()

	var dialer net.Dialer
	conn, err := dialer.DialContext(ctx, "tcp", listener.Addr().String())
	if err != nil {
		return Exchange{}, fmt.Errorf("dial: %w", err)
	}
	defer func() { _ = conn.Close() }()
	if _, err := io.WriteString(conn, raw); err != nil {
		return Exchange{}, fmt.Errorf("send: %w", err)
	}
	_ = conn.SetReadDeadline(time.Now().Add(5 * time.Second))
	received, err := io.ReadAll(bufio.NewReader(conn))
	if err != nil {
		return Exchange{}, fmt.Errorf("receive: %w", err)
	}
	cancel()
	if err := <-done; err != nil {
		return Exchange{}, fmt.Errorf("serve: %w", err)
	}
	return Exchange{Sent: []byte(raw), Received: received}, nil
}

// Visible rewrites wire bytes for people: one line of output per line of the protocol, with CR
// shown as \r and LF as \n, each line prefixed by a marker such as "> " or "< ".
func Visible(prefix string, data []byte) string {
	var out strings.Builder
	line := prefix
	for _, b := range data {
		switch {
		case b == '\r':
			line += `\r`
		case b == '\n':
			out.WriteString(line + `\n` + "\n")
			line = prefix
		case b < 0x20 || b > 0x7e:
			line += fmt.Sprintf(`\x%02x`, b)
		default:
			line += string(rune(b))
		}
	}
	if line != prefix {
		out.WriteString(line + "\n")
	}
	return out.String()
}

// HexDump prints the bytes the way a packet analyser does: offset, 16 bytes in hexadecimal, and
// the same bytes as text with a dot for everything that is not printable.
func HexDump(data []byte) string {
	var out strings.Builder
	for offset := 0; offset < len(data); offset += 16 {
		row := data[offset:min(offset+16, len(data))]
		hexPart := make([]string, 0, 16)
		text := make([]byte, 0, 16)
		for _, b := range row {
			hexPart = append(hexPart, fmt.Sprintf("%02x", b))
			if b < 0x20 || b > 0x7e {
				b = '.'
			}
			text = append(text, b)
		}
		fmt.Fprintf(&out, "%04x  %-47s  %s\n", offset, strings.Join(hexPart, " "), text)
	}
	return out.String()
}
