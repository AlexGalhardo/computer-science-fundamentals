package ratelimiter

// EN: The burst experiment, with the same traffic and the same configuration as the
// TypeScript version: 10 requests per second, 80 requests in four phases. The Go test
// compares these totals with `results/burst.json`, written by the TypeScript run, so the
// two languages are checked against each other.
//
// PT: O experimento de rajada, com o mesmo tráfego e a mesma configuração da versão em
// TypeScript: 10 requisições por segundo, 80 requisições em quatro fases. O teste em Go
// compara estes totais com `results/burst.json`, gravado pela execução em TypeScript, então
// as duas linguagens são conferidas uma contra a outra.

// ExperimentConfig is the limit every algorithm gets in the experiment.
var ExperimentConfig = Config{Limit: 10, WindowMs: 1000}

// Phase is one stretch of the experiment, [FromMs, ToMs).
type Phase struct {
	ID     string
	FromMs int64
	ToMs   int64
}

// Phases are the four stretches of traffic, each exposing one behaviour.
var Phases = []Phase{
	{ID: "calm", FromMs: 0, ToMs: 1000},
	{ID: "boundary", FromMs: 1000, ToMs: 3000},
	{ID: "overload", FromMs: 3000, ToMs: 6000},
	{ID: "instant", FromMs: 6000, ToMs: 8000},
}

// BuildTraffic returns the arrival times, in milliseconds, in order.
func BuildTraffic() []int64 {
	var arrivals []int64
	// EN: Calm: 5 requests in one second, half the limit.
	// PT: Calmaria: 5 requisições em um segundo, metade do limite.
	for t := int64(100); t < 1000; t += 200 {
		arrivals = append(arrivals, t)
	}
	// EN: 10 requests at the end of one fixed window and 10 at the start of the next.
	// PT: 10 requisições no fim de uma janela fixa e 10 no começo da seguinte.
	for t := int64(1900); t < 2100; t += 10 {
		arrivals = append(arrivals, t)
	}
	// EN: Sustained overload: twice the limit for two seconds.
	// PT: Sobrecarga contínua: o dobro do limite por dois segundos.
	for t := int64(3000); t < 5000; t += 50 {
		arrivals = append(arrivals, t)
	}
	// EN: After silence, 15 requests in the same millisecond.
	// PT: Depois do silêncio, 15 requisições no mesmo milissegundo.
	for range 15 {
		arrivals = append(arrivals, 7000)
	}
	return arrivals
}

// Series summarises the events (admissions or departures) of one algorithm.
type Series struct {
	ID            string
	PerPhase      []int
	Total         int
	PeakPerWindow int
}

// PeakPerWindow is the largest number of events in any interval [t, t + windowMs).
//
// EN: The honest measure of a limiter: the worst interval of one window, wherever it starts.
// PT: A medida honesta de um limitador: o pior intervalo de uma janela, comece onde começar.
func PeakPerWindow(times []int64, windowMs int64) int {
	peak, end := 0, 0
	for start := range times {
		for end < len(times) && times[end] < times[start]+windowMs {
			end++
		}
		peak = max(peak, end-start)
	}
	return peak
}

func summarise(id string, times []int64) Series {
	perPhase := make([]int, len(Phases))
	for _, t := range times {
		for index, phase := range Phases {
			if t >= phase.FromMs && t < phase.ToMs {
				perPhase[index]++
			}
		}
	}
	return Series{ID: id, PerPhase: perPhase, Total: len(times), PeakPerWindow: PeakPerWindow(times, ExperimentConfig.WindowMs)}
}

// RunExperiment gives the same traffic to every algorithm and summarises what each admits.
func RunExperiment() ([]Series, error) {
	traffic := BuildTraffic()
	series := make([]Series, 0, len(Algorithms)+1)
	for _, algorithm := range Algorithms {
		limiter, err := New(algorithm, ExperimentConfig)
		if err != nil {
			return nil, err
		}
		var admitted []int64
		for _, t := range traffic {
			if limiter.Allow(t) {
				admitted = append(admitted, t)
			}
		}
		series = append(series, summarise(algorithm, admitted))
	}
	// EN: When the admitted requests of the leaky bucket leave its queue.
	// PT: Quando as requisições admitidas pelo leaky bucket saem da fila.
	shaper := &LeakyBucket{config: ExperimentConfig}
	var departures []int64
	for _, t := range traffic {
		if departAt, ok := shaper.Schedule(t); ok {
			departures = append(departures, departAt)
		}
	}
	return append(series, summarise("leaky-bucket-output", departures)), nil
}
