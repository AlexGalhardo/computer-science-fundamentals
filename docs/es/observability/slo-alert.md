# SLO y alerta (MP-OBS-3)

> English version: [docs/en/observability/slo-alert.md](../../en/observability/slo-alert.md) · Versão em português: [docs/pt/observability/slo-alert.md](../../pt/observability/slo-alert.md)

Miniproyecto: [`projects/observability/slo-alert`](../../../projects/observability/slo-alert/README.es.md). Temas del quiz: `sli-slo-error-budgets`, `alerting`, `metric-types-cardinality`, `prometheus-grafana-loki-tempo`.

## El problema

"Alertar cuando la CPU esté por encima del 90%" avisa a las personas por cosas que los usuarios nunca notan y se queda callada mientras los usuarios sufren. Una alerta debe decir que **los usuarios están siendo perjudicados, más rápido de lo que se acordó que era aceptable**. Para escribir eso como una regla, hay que definir cuatro cosas en orden.

## 1. SLI: qué se mide

Un indicador de nivel de servicio (SLI) es una razón: eventos buenos sobre eventos válidos.

| Objetivo | Evento bueno | Evento válido |
| --- | --- | --- |
| Disponibilidad | una petición que no falló (sin 5xx) | toda petición |
| Latencia | una petición exitosa que tardó 100 ms o menos | toda petición exitosa |

El indicador de latencia es una porción de peticiones bajo un umbral, no un promedio: un promedio de 60 ms puede esconder que una de cada diez peticiones tarda 400 ms. Con un histograma de Prometheus la porción es una división, porque los buckets son acumulativos: `le="0.1"` ya cuenta toda petición de 100 ms o menos. Por lo tanto, el umbral del objetivo debe ser uno de los límites de bucket.

Las peticiones fallidas se dejan fuera del histograma de latencia. Un 503 se rechaza en menos de un milisegundo, y contarlo haría que la latencia pareciera mejor justamente cuando el servicio está fallando.

## 2. SLO y presupuesto de error

El objetivo es una meta para el indicador sobre una ventana: 99% en 30 días. El **presupuesto de error** es lo que el objetivo deja: puede fallar el 1% de las peticiones. Es un presupuesto porque está hecho para gastarse, en lanzamientos, experimentos y fallos no planeados. Un objetivo de 100% no dejaría nada, y nunca se podría hacer ningún cambio de forma segura.

## 3. Burn rate

```text
burn rate = share of bad events / error budget
```

| Burn rate | Significado para una ventana de 30 días (720 horas) |
| --- | --- |
| 1 | El presupuesto dura exactamente 30 días |
| 6 | Se agota en 720 / 6 = 120 horas (5 días) |
| 14.4 | Se agota en 720 / 14.4 = 50 horas. Una hora gasta 14.4 / 720 = 2% |

El burn rate convierte "qué tan mal está" en "cuánto falta para agotar el presupuesto", que es lo que decide entre una página y un ticket.

## 4. De PromQL a reglas

Una **recording rule** guarda el resultado de una expresión como una nueva serie. El indicador:

```yaml
- record: job:slo_errors_per_request:ratio_rate5m
  expr: |
    sum by (job) (rate(http_requests_total{code=~"5.."}[5m]))
    /
    sum by (job) (rate(http_requests_total[5m]))
```

`rate()` de un counter son peticiones por segundo; dividir dos tasas da una porción de 0 a 1. Un detalle importa: la serie `code="503"` debe existir con valor 0 antes del primer fallo. Una serie que no existe no es cero, está ausente, y la razón no tendría valor.

El burn rate es el indicador dividido por el presupuesto, y la alerta lo compara con un umbral en **dos ventanas**:

```yaml
- alert: AvailabilityBudgetBurn
  expr: |
    job:slo_availability_burn_rate:ratio_rate5m > 14.4
    and
    job:slo_availability_burn_rate:ratio_rate1m > 14.4
  for: 10s
  labels:
    severity: page
```

- La **ventana larga** prueba que una parte real del presupuesto se fue. Una petición fallida en un minuto tranquilo no avisa a nadie.
- La **ventana corta** prueba que todavía está ocurriendo. Cuando el problema termina, la ventana corta se vacía rápido y el `and` pasa a ser falso, aunque la ventana larga todavía recuerde.
- **`for`** pide que la condición se mantenga antes de dispararse. Hasta entonces la alerta está `pending`.

El laboratorio usa 5 minutos y 1 minuto. Producción usa 1 hora y 5 minutos con los mismos umbrales.

## 5. Probar reglas sin un servicio

`promtool test rules` entrega muestras inventadas a las reglas y comprueba las series y alertas que salen en momentos elegidos:

```yaml
input_series:
  - series: 'http_requests_total{job="shop", code="200"}'
    values: "0+135x121"          # +135 every 15 s = 9 requests per second
  - series: 'http_requests_total{job="shop", code="503"}'
    values: "0x40 60+60x39 2400x40"   # nothing, then 4 per second for 10 minutes, then nothing
alert_rule_test:
  - eval_time: 16m
    alertname: AvailabilityBudgetBurn
    exp_alerts: [ ... ]          # firing: 4 of 13 fail, burn rate 30.77
  - eval_time: 21m30s
    alertname: AvailabilityBudgetBurn
    exp_alerts: []               # resolved 90 s after the end; the 5 m window still burns at 23.3
```

Treinta minutos de historial corren en milisegundos, y un error en un umbral se encuentra antes de cualquier incidente.

## 6. El incidente real

La tienda atiende 8 peticiones a la vez; cada petición en curso vuelve más lentas a las otras, y más allá de 8 responde 503. k6 con 30 usuarios virtuales basta para romper ambos objetivos. Medido en el laboratorio:

| Momento | Segundos |
| --- | --- |
| La carga empieza → alerta de disponibilidad pending | 4 |
| La carga empieza → firing, receiver notificado | 14 |
| La carga se detiene → alerta resuelta | 53 |
| Burn rate de la ventana de 5 m en ese momento | 77.7 (umbral 14.4) |

Prometheus decide cuándo se dispara una alerta. **Alertmanager** decide quién se entera: agrupa alertas (`group_by`), espera un poco por las relacionadas (`group_wait`), y envía una notificación `resolved` cuando terminan. Aquí el receiver es un webhook local.

## Qué recordar

- Un SLI son eventos buenos sobre eventos válidos. Un SLI de latencia es una porción bajo un umbral, no un promedio.
- El presupuesto de error es 1 menos el objetivo, y existe para gastarse.
- Burn rate = porción mala / presupuesto. 14.4 gasta el 2% de un presupuesto de 30 días en una hora.
- Dos ventanas: la larga evita el ruido, la corta hace que la alerta se detenga cuando el problema se detiene.
- Las reglas son código. Tienen pruebas unitarias.
- Una prueba de carga apunta solo a un servicio que es tuyo. Aquí k6 rechaza cualquier cosa que no sea local.

## Fuentes

- Majors, Fong-Jones y Miranda, *Observability Engineering*, capítulos 12 y 13.
- Google, *The Site Reliability Workbook*, capítulo 5 (alerting on SLOs).
- Documentación de Prometheus: recording rules, alerting rules, unit testing for rules, histogramas, Alertmanager.
