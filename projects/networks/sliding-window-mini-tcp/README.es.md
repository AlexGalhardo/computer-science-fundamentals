# sliding-window-mini-tcp

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Cómo se construye la confiabilidad sobre un canal que pierde, duplica y reordena paquetes. El mini-proyecto tiene dos partes:

1. Un **canal simulado**, determinista con una semilla fija, y encima de él los tres protocolos ARQ clásicos: stop-and-wait, go-back-N y repetición selectiva. Escrito en Go y en Elixir.
2. Un **mini TCP sobre UDP** en Go: acuerdo de tres vías, números de secuencia de bytes, confirmaciones acumulativas, tiempo límite de retransmisión adaptativo y un cierre ordenado, que mueve un archivo de 10 MB entre dos sockets UDP reales con pérdida inyectada.

Explicación completa: [docs/es/networks/sliding-window-mini-tcp.md](../../../docs/es/networks/sliding-window-mini-tcp.md).

## Temas del quiz que demuestra

- `networks` / `data-link-layer`: stop-and-wait, números de secuencia, go-back-N, repetición selectiva, límites del tamaño de la ventana, utilización del enlace
- `networks` / `transport-layer`: acuerdo de tres vías, números de secuencia y de confirmación, tiempo límite de retransmisión, liberación de la conexión

## Ejecutar

El único requisito es Docker.

```sh
./setup-unix-sliding-window-mini-tcp.sh        # Linux y macOS
./setup-windows-sliding-window-mini-tcp.ps1    # Windows
```

El script construye las imágenes y ejecuta las pruebas de ambos lenguajes.

## Demo

```sh
docker compose run --rm -T go-demo        # protocolos simulados + transferencia de 10 MB con el mini TCP
docker compose run --rm -T elixir-demo    # protocolos simulados en Elixir
```

Cada comando imprime un informe en Markdown. Las copias confirmadas en el repositorio son [results/results.md](results/results.md) y [results/results-elixir.md](results/results-elixir.md). La demo de Go tarda cerca de medio minuto y termina con un error si alguna transferencia no llega intacta (SHA-256). Opciones: `-mb`, `-loss`, `-runs`, `-window`, por ejemplo `docker compose run --rm -T go-demo go run ./cmd/demo -mb 2 -loss 0.1`.

Nada usa la red: los contenedores se ejecutan con `network_mode: none` y el mini TCP conversa por la interfaz de loopback de su propio contenedor.

## Estructura

| Ruta | Qué es |
| --- | --- |
| `go/channel` | el canal simulado: pérdida, duplicación, reordenamiento, una semilla |
| `go/arq` | stop-and-wait, go-back-N y repetición selectiva como un solo motor con dos ventanas |
| `go/minitcp` | el mini TCP sobre sockets UDP, con la pérdida inyectada en cada socket |
| `go/cmd/demo` | el generador del informe |
| `elixir/lib` | el canal y los protocolos ARQ otra vez, como una función pura sobre un estado inmutable |
| `results/` | informes confirmados en el repositorio |

Go es la implementación principal. Elixir repite solo la simulación, porque ahí es donde cambia la lección: el mismo protocolo escrito sin estado mutable, con el generador aleatorio pasado como un valor. El mini TCP existe solo en Go.

## Pruebas

```sh
docker compose run --rm -T go-test
docker compose run --rm -T elixir-test
```

El servicio de Go verifica `gofmt`, `go vet` y `go test`; el de Elixir verifica `mix format` y `mix test --warnings-as-errors`. Las pruebas cubren el determinismo del canal, la entrega intacta de todos los protocolos con un 20% de pérdida, los límites de la ventana, y el mini TCP con un 5% y un 30% de pérdida.

## Qué muestran los números

- Stop-and-wait usa una pequeña fracción del enlace, porque queda inactivo un viaje de ida y vuelta completo por cada trama.
- Go-back-N mantiene el enlace ocupado, pero paga cada pérdida, y cada trama reordenada, con una ventana entera de retransmisiones.
- La repetición selectiva envía el mismo número de tramas que stop-and-wait (solo se reenvía lo que se perdió) mientras mantiene la ventana en movimiento.
- La simulación es exactamente repetible. El mini TCP no: corre sobre sockets reales y un reloj real, así que su tabla informa media, desviación y rango sobre varias ejecuciones.
