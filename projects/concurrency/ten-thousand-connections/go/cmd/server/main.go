// Command server starts the Go echo and delayed-response server.
package main

import (
	"log"
	"net/http"
	"os"
	"time"

	server "ten-thousand-connections"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	srv := &http.Server{
		Addr:    ":" + port,
		Handler: server.NewHandler(),
		// Only the headers have a deadline: /delay keeps a request open for up to a minute.
		ReadHeaderTimeout: 10 * time.Second,
	}
	log.Printf("go server listening on :%s", port)
	log.Fatal(srv.ListenAndServe())
}
