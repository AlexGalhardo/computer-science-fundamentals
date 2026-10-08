// Package app is the small demo site served by the raw TCP server: a page for a browser, a
// route with a parameter, an echo of the request body and a chunked stream.
package app

import (
	"strconv"
	"time"

	"http-server-raw-tcp/httpraw"
)

// StreamLines is the number of chunks sent by GET /stream.
const StreamLines = 5

// page is what a browser shows. Its script calls the other routes with fetch(), all on the same
// keep-alive connection, and writes the results into the page. A browser check reads them back,
// which proves that a real browser understood the responses, chunked one included.
const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>HTTP on raw TCP</title>
<link rel="stylesheet" href="/style.css">
</head>
<body>
<h1>HTTP on raw TCP</h1>
<p>This page was served by a server that parses HTTP by hand.</p>
<ul>
<li>GET /hello/browser: <code id="hello">...</code></li>
<li>POST /echo: <code id="echo">...</code></li>
<li>GET /stream (chunked): <code id="stream">...</code></li>
<li>GET /missing: <code id="missing">...</code></li>
</ul>
<script>
async function show(id, promise) {
	const element = document.getElementById(id);
	try {
		const response = await promise;
		const text = (await response.text()).trim().replaceAll("\n", " | ");
		element.textContent = response.status + " " + text;
	} catch (error) {
		element.textContent = "failed: " + error;
	}
}
show("hello", fetch("/hello/browser"));
show("echo", fetch("/echo", { method: "POST", body: "sent by fetch" }));
show("stream", fetch("/stream"));
show("missing", fetch("/missing"));
</script>
</body>
</html>
`

const style = "body{font-family:sans-serif;margin:2rem;max-width:40rem}code{background:#eee;padding:0 .3rem}\n"

func typed(contentType, body string) httpraw.Response {
	header := httpraw.Header{}
	header.Add("Content-Type", contentType)
	return httpraw.Response{Status: 200, Header: header, Body: []byte(body)}
}

// Routes builds the router of the demo site. pause is the wait between two chunks of /stream:
// long enough to watch them arrive one by one with curl, and zero in the tests.
func Routes(pause time.Duration) *httpraw.Router {
	router := &httpraw.Router{}
	router.Handle("GET", "/", func(*httpraw.Request) httpraw.Response {
		return typed("text/html; charset=utf-8", page)
	})
	router.Handle("GET", "/style.css", func(*httpraw.Request) httpraw.Response {
		return typed("text/css; charset=utf-8", style)
	})
	router.Handle("GET", "/health", func(*httpraw.Request) httpraw.Response {
		return httpraw.Text(200, "ok\n")
	})
	router.Handle("GET", "/hello/:name", func(req *httpraw.Request) httpraw.Response {
		return httpraw.Text(200, "hello, "+req.Params["name"]+"\n")
	})
	router.Handle("POST", "/echo", func(req *httpraw.Request) httpraw.Response {
		resp := httpraw.Text(200, string(req.Body))
		resp.Header.Add("X-Body-Bytes", strconv.Itoa(len(req.Body)))
		return resp
	})
	// EN: The handler does not know the total size when it starts answering, so the server
	//     sends each line as one chunk the moment it is produced.
	// PT: O handler não sabe o tamanho total quando começa a responder, então o servidor envia
	//     cada linha como um pedaço no momento em que ela é produzida.
	router.Handle("GET", "/stream", func(*httpraw.Request) httpraw.Response {
		header := httpraw.Header{}
		header.Add("Content-Type", "text/plain; charset=utf-8")
		return httpraw.Response{
			Status: 200,
			Header: header,
			Stream: func(write func([]byte) error) error {
				for line := 1; line <= StreamLines; line++ {
					if err := write([]byte("line " + strconv.Itoa(line) + "\n")); err != nil {
						return err
					}
					time.Sleep(pause)
				}
				return nil
			},
		}
	})
	return router
}
