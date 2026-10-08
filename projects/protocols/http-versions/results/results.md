# http-versions: results

- Command: `docker compose run --rm bench`
- Machine: AMD Ryzen 7 5700X3D 8-Core Processor, 16 cores, 16 GB visible to the container, linux x64
- Client: chromium 153.0.8010.12 (Playwright), headless. Server: Caddy 2.11.7, same machine, docker-compose internal network.
- Page: 1 HTML document and 200 images of about 2 kB, no cache, no compression, TLS on every port.
- Method: 1 warm-up load per port discarded, then 10 cold loads per port (new browser context each time: empty cache, new connection), ports interleaved. Load time = navigation start to the load event, as reported by the browser.
- Shaping: `tc netem` on the outgoing packets of the server only. `delay 50ms` therefore adds about 50 ms to each round trip.
- Std dev is between the loads of one port. A difference smaller than it is not a difference.
- Connection setup is the mean time the browser spent opening the connection of the document: TCP and TLS handshakes for HTTP/1.1 and HTTP/2, the QUIC handshake for HTTP/3.
- Half of the images is the mean time at which 100 of the 200 images had fully arrived.

## Total load time per protocol and condition

| Condition | Protocol | Port | Mean (ms) | Std dev (ms) | Median (ms) | Min (ms) | Max (ms) | Connection setup (ms) | Half of the images (ms) |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| no shaping | HTTP/1.1 | 8001 | 598 | 149 | 561 | 395 | 915 | 2 | 359 |
| no shaping | HTTP/2 | 8002 | 605 | 214 | 533 | 455 | 1175 | 2 | 405 |
| no shaping | HTTP/3 | 8003 | 926 | 365 | 786 | 536 | 1585 | 2 | 775 |
| latency (`netem delay 50ms`) | HTTP/1.1 | 8101 | 2455 | 191 | 2453 | 2211 | 2811 | 102 | 1351 |
| latency (`netem delay 50ms`) | HTTP/2 | 8102 | 742 | 78 | 752 | 615 | 847 | 102 | 533 |
| latency (`netem delay 50ms`) | HTTP/3 | 8103 | 735 | 73 | 721 | 642 | 877 | 52 | 518 |
| latency and loss (`netem delay 50ms loss 2%`) | HTTP/1.1 | 8201 | 2539 | 191 | 2470 | 2294 | 2846 | 127 | 1385 |
| latency and loss (`netem delay 50ms loss 2%`) | HTTP/2 | 8202 | 1024 | 333 | 987 | 675 | 1567 | 102 | 645 |
| latency and loss (`netem delay 50ms loss 2%`) | HTTP/3 | 8203 | 1159 | 484 | 1009 | 678 | 2041 | 53 | 732 |
