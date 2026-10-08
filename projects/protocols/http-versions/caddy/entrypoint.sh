#!/bin/sh
# EN: Shapes the outgoing traffic of this container, then starts Caddy. `tc netem` is the Linux
#     network emulator: it delays or drops packets as they leave the interface. Shaping the
#     server side matters because that is the direction the 200 images travel.
#     The traffic is split by SOURCE port, so one container serves the three conditions at once:
#       80xx  untouched
#       81xx  NETEM_LATENCY       (for example "delay 50ms")
#       82xx  NETEM_LATENCY_LOSS  (for example "delay 50ms loss 2%")
#     This needs the NET_ADMIN capability, granted to this one container in docker-compose.yml.
# PT: Molda o tráfego de saída deste contêiner e depois inicia o Caddy. `tc netem` é o emulador
#     de rede do Linux: ele atrasa ou descarta pacotes quando saem da interface. Moldar o lado do
#     servidor importa porque é nesse sentido que as 200 imagens viajam.
#     O tráfego é separado pela porta de ORIGEM, então um contêiner serve as três condições ao
#     mesmo tempo:
#       80xx  intocado
#       81xx  NETEM_LATENCY       (por exemplo "delay 50ms")
#       82xx  NETEM_LATENCY_LOSS  (por exemplo "delay 50ms loss 2%")
#     Isso exige a capability NET_ADMIN, dada a este único contêiner no docker-compose.yml.
set -eu

DEV=eth0

# EN: With segmentation offload the kernel hands netem one large "packet" that is split later,
#     so one drop would discard many TCP segments at once. Turning it off makes a drop mean one
#     real packet, for TCP and for QUIC alike.
# PT: Com segmentation offload o kernel entrega ao netem um "pacote" grande que é dividido
#     depois, então um descarte jogaria fora vários segmentos TCP de uma vez. Desligar faz um
#     descarte significar um pacote real, tanto para TCP quanto para QUIC.
ethtool -K "$DEV" tso off gso off gro off >/dev/null

# EN: A `prio` qdisc with three bands. The priomap sends everything to band 1 (untouched) unless
#     a filter says otherwise. Bands 2 and 3 get a netem each. The u32 filters match the source
#     port with mask 0xfffc: 8100 to 8103 and 8200 to 8203. The same filter matches TCP and UDP,
#     because both keep the source port in the first two bytes of their header.
# PT: Uma qdisc `prio` com três faixas. O priomap manda tudo para a faixa 1 (intocada), a menos
#     que um filtro diga o contrário. As faixas 2 e 3 recebem um netem cada. Os filtros u32 casam
#     a porta de origem com a máscara 0xfffc: 8100 a 8103 e 8200 a 8203. O mesmo filtro casa TCP
#     e UDP, porque ambos guardam a porta de origem nos dois primeiros bytes do cabeçalho.
tc qdisc replace dev "$DEV" root handle 1: prio bands 3 priomap 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
# shellcheck disable=SC2086 # the netem arguments are meant to be split into words
tc qdisc add dev "$DEV" parent 1:2 handle 20: netem $NETEM_LATENCY
# shellcheck disable=SC2086
tc qdisc add dev "$DEV" parent 1:3 handle 30: netem $NETEM_LATENCY_LOSS
tc filter add dev "$DEV" parent 1: protocol ip u32 match ip sport 8100 0xfffc flowid 1:2
tc filter add dev "$DEV" parent 1: protocol ip u32 match ip sport 8200 0xfffc flowid 1:3

echo "netem ready: 81xx = $NETEM_LATENCY, 82xx = $NETEM_LATENCY_LOSS"

exec caddy run --config /etc/caddy/Caddyfile --adapter caddyfile
