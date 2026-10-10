# dns-subnet

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Cómo se resuelven los nombres y cómo se dividen las direcciones. Dos herramientas:

1. Un **resolvedor DNS iterativo** en Go, con una caché que respeta el tiempo de vida, que trabaja contra una jerarquía falsa de servidores raíz, TLD y autoritativos que también forman parte del proyecto. Habla el formato real de DNS sobre UDP e imprime cada paso.
2. Una **calculadora de subredes** en TypeScript: red, broadcast, rango de hosts y máscara para cualquier CIDR IPv4.

Explicación completa: [docs/es/networks/dns-subnet.md](../../../docs/es/networks/dns-subnet.md).

## Todo es local

El laboratorio nunca habla con un servidor DNS real. Los tres servidores de nombres y el resolvedor corren en una red de docker-compose marcada como `internal: true`, que no tiene ruta hacia el exterior, y no se publica ningún puerto. Las zonas son falsas: el TLD es `test` (reservado por la RFC 2606) y las direcciones de las respuestas salen de los rangos de documentación de la RFC 5737. La única dirección que recibe el resolvedor es la del servidor raíz falso.

## Temas del quiz que demuestra

- `networks` / `application-layer`: propósito de DNS, tipos de registro (A, NS, CNAME), resolución iterativa, caché y tiempo de vida
- `networks` / `network-layer`: subredes y CIDR, direcciones de red y de broadcast, número de hosts, si dos direcciones comparten una subred

## Ejecutar

El único requisito es Docker.

```sh
./setup-unix-dns-subnet.sh        # Linux y macOS
./setup-windows-dns-subnet.ps1    # Windows
```

El script construye las imágenes y ejecuta las pruebas de ambos lenguajes.

## Demo

Laboratorio de DNS:

```sh
docker compose up -d root tld auth        # los tres servidores de nombres falsos
docker compose run --rm -T resolver       # resuelve siete nombres, imprimiendo cada paso
docker compose logs root tld auth         # qué se le preguntó a cada servidor
docker compose down -v                    # elimina los contenedores y la red
```

Calculadora de subredes:

```sh
docker compose run --rm -T ts-subnet                                        # la tabla de casos
docker compose run --rm -T ts-subnet bun run src/cli.ts 192.168.10.77/26    # cualquier CIDR
```

Salida confirmada en el repositorio: [results/resolution.txt](results/resolution.txt) y [results/subnets.md](results/subnets.md).

Para resolver otros nombres de las zonas falsas, pásaselos al resolvedor. `wait=5s` hace una pausa, lo que deja expirar los registros en caché:

```sh
docker compose run --rm -T resolver resolve -roots 10.253.53.2 mail.example.test wait=5s mail.example.test
```

## Estructura

| Ruta | Qué es |
| --- | --- |
| `go/dnsmsg` | formato de DNS en el cable: encabezado, pregunta, registros A, NS y CNAME, compresión de nombres |
| `go/zone` | analizador de archivos de zona y la lógica de una respuesta autoritativa o de una referencia |
| `go/server` | servidor de nombres UDP que guarda una o más zonas |
| `go/resolver` | resolvedor iterativo y caché de TTL |
| `go/cmd/nameserver`, `go/cmd/resolve` | los dos comandos que usa el archivo compose |
| `go/zones` | las zonas falsas |
| `ts/src/subnet.ts` | la calculadora de subredes |
| `ts/src/cases.ts` | tabla de casos CIDR resueltos a mano |
| `results/` | salidas confirmadas en el repositorio |

Go lleva la parte de DNS porque trata de sockets y de un protocolo binario. TypeScript lleva la calculadora de subredes, donde la lección es la aritmética de bits y las trampas de los operadores de 32 bits en JavaScript.

## Pruebas

```sh
docker compose run --rm -T go-test
docker compose run --rm -T ts-test
```

Las pruebas de Go inician los mismos tres servidores dentro del proceso de prueba, en direcciones de loopback, así que también se ejecutan con la red desactivada. Cubren el formato en el cable (incluidos paquetes hostiles), referencias con y sin glue, el recorrido desde la raíz hasta el servidor autoritativo, la caché que responde una segunda consulta y expira exactamente a tiempo (con un reloj falso), alias, nombres inexistentes y el rechazo de registros sobre los que un servidor no tiene autoridad. Las pruebas de TypeScript comparan la calculadora con la tabla de casos.
