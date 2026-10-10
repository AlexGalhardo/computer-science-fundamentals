// EN: A CPU scheduling simulator. One engine runs every policy: it keeps a ready queue, asks the
//     policy which entry runs next and for how long, and records who had the CPU and when.
//     Time is an abstract integer unit, so every result can be checked by hand.
// PT: Um simulador de escalonamento de CPU. Um único motor executa todas as políticas: ele mantém
//     a fila de prontos, pergunta à política quem executa em seguida e por quanto tempo, e anota
//     quem teve a CPU e quando. O tempo é uma unidade inteira abstrata, então todo resultado pode
//     ser conferido à mão.
// ES: Un simulador de planificación de CPU. Un único motor ejecuta todas las políticas: mantiene
//     la cola de listos, pregunta a la política quién se ejecuta a continuación y por cuánto
//     tiempo, y registra quién tuvo la CPU y cuándo. El tiempo es una unidad entera abstracta, así
//     que todo resultado puede comprobarse a mano.

export interface Process {
	id: string;
	/** Instant when the process becomes ready. */
	arrival: number;
	/** Total CPU time the process needs. */
	burst: number;
	/** Lower number means higher priority. Only the priority policy reads it. */
	priority: number;
}

/** One uninterrupted stretch of CPU given to a process: a bar of the Gantt chart. */
export interface Slice {
	id: string;
	start: number;
	end: number;
}

export interface ProcessMetrics {
	id: string;
	waiting: number;
	turnaround: number;
	response: number;
	/** How many times the process was given the CPU. */
	dispatches: number;
}

export interface Averages {
	waiting: number;
	turnaround: number;
	response: number;
	/** The worst waiting time: a simple view of fairness and starvation. */
	maxWaiting: number;
}

export interface Schedule {
	policy: string;
	slices: Slice[];
	metrics: ProcessMetrics[];
	averages: Averages;
}

/** A process inside the simulator, with the state the engine and the policies need. */
export interface Entry {
	process: Process;
	remaining: number;
	/** Queue level, used only by the multilevel feedback queue. Level 0 is the highest. */
	level: number;
	firstStart: number | undefined;
	finish: number;
	dispatches: number;
}

// EN: A policy answers three questions. Which ready entry runs next? For how long may it run
//     before the CPU is taken away (Infinity means "until it finishes", that is, no preemption)?
//     And what happens to an entry that used its whole quantum without finishing?
// PT: Uma política responde a três perguntas. Qual entrada pronta executa em seguida? Por quanto
//     tempo ela pode executar antes de perder a CPU (Infinity significa "até terminar", isto é,
//     sem preempção)? E o que acontece com a entrada que usou o quantum inteiro sem terminar?
// ES: Una política responde tres preguntas. ¿Qué entrada lista se ejecuta a continuación? ¿Por
//     cuánto tiempo puede ejecutarse antes de que le quiten la CPU (Infinity significa "hasta
//     terminar", es decir, sin expropiación)? ¿Y qué pasa con una entrada que usó todo su quantum
//     sin terminar?
export interface Policy {
	name: string;
	select(ready: readonly Entry[]): number;
	quantum(entry: Entry): number;
	expired(entry: Entry): void;
}

function indexOfMin(ready: readonly Entry[], key: (entry: Entry) => number): number {
	let best = 0;
	for (let i = 1; i < ready.length; i++) {
		// EN: Strictly smaller, so ties keep the entry that has been in the queue the longest.
		// PT: Estritamente menor, então empates mantêm a entrada que está há mais tempo na fila.
		// ES: Estrictamente menor, así los empates conservan la entrada que lleva más tiempo en la cola.
		if (key(ready[i] as Entry) < key(ready[best] as Entry)) {
			best = i;
		}
	}
	return best;
}

// EN: First come, first served. The head of the queue runs to completion. Simple and fair in
//     order of arrival, but one long job makes every short job behind it wait (convoy effect).
// PT: Primeiro a chegar, primeiro a ser servido. A cabeça da fila executa até terminar. Simples e
//     justo na ordem de chegada, mas um job longo faz todos os curtos atrás dele esperarem
//     (efeito comboio).
// ES: Primero en llegar, primero en ser atendido. La cabeza de la cola se ejecuta hasta terminar.
//     Simple y justo en orden de llegada, pero un trabajo largo hace esperar a todos los cortos
//     que están detrás (efecto convoy).
export function fcfs(): Policy {
	return { name: "FCFS", select: () => 0, quantum: () => Number.POSITIVE_INFINITY, expired: () => {} };
}

// EN: Shortest job first, without preemption. Among the ready jobs the one with the smallest
//     burst runs to completion. It minimises the average waiting time when all jobs are
//     available together, but it needs to know the bursts and can starve long jobs.
// PT: Job mais curto primeiro, sem preempção. Entre os jobs prontos, o de menor tempo de CPU
//     executa até terminar. Minimiza a espera média quando todos os jobs estão disponíveis
//     juntos, mas precisa conhecer os tempos e pode deixar jobs longos em inanição.
// ES: Primero el trabajo más corto, sin expropiación. Entre los trabajos listos, el de menor
//     ráfaga se ejecuta hasta terminar. Minimiza el tiempo medio de espera cuando todos los
//     trabajos están disponibles a la vez, pero necesita conocer las ráfagas y puede dejar en
//     inanición a los trabajos largos.
export function sjf(): Policy {
	return {
		name: "SJF",
		select: (ready) => indexOfMin(ready, (entry) => entry.process.burst),
		quantum: () => Number.POSITIVE_INFINITY,
		expired: () => {},
	};
}

// EN: Round-robin. The head of the queue runs for at most one quantum and then goes to the
//     tail. Nobody waits more than (n - 1) quanta for a turn, which gives good response time.
//     The price is more context switches and a longer turnaround for everybody.
// PT: Round-robin. A cabeça da fila executa por no máximo um quantum e depois vai para o fim.
//     Ninguém espera mais que (n - 1) quanta pela vez, o que dá bom tempo de resposta. O preço
//     são mais trocas de contexto e um tempo de retorno maior para todos.
// ES: Round-robin. La cabeza de la cola se ejecuta como máximo un quantum y luego va al final.
//     Nadie espera más de (n - 1) quantums por su turno, lo que da buen tiempo de respuesta. El
//     precio son más cambios de contexto y un mayor tiempo de retorno para todos.
export function roundRobin(quantum: number): Policy {
	if (!Number.isInteger(quantum) || quantum < 1) {
		throw new Error("quantum must be a positive integer");
	}
	return { name: `RR(q=${quantum})`, select: () => 0, quantum: () => quantum, expired: () => {} };
}

// EN: Priority scheduling, without preemption. The ready process with the lowest priority
//     number runs to completion. Important work goes first, but a low-priority process can
//     starve while higher-priority ones keep arriving. Real systems fix that with aging.
// PT: Escalonamento por prioridade, sem preempção. O processo pronto com o menor número de
//     prioridade executa até terminar. O trabalho importante passa na frente, mas um processo
//     de baixa prioridade pode ficar em inanição enquanto chegam outros de prioridade maior.
//     Sistemas reais corrigem isso com envelhecimento (aging).
// ES: Planificación por prioridad, sin expropiación. El proceso listo con el menor número de
//     prioridad se ejecuta hasta terminar. El trabajo importante va primero, pero un proceso de
//     baja prioridad puede quedar en inanición mientras siguen llegando otros de mayor prioridad.
//     Los sistemas reales lo corrigen con envejecimiento (aging).
export function priority(): Policy {
	return {
		name: "Priority",
		select: (ready) => indexOfMin(ready, (entry) => entry.process.priority),
		quantum: () => Number.POSITIVE_INFINITY,
		expired: () => {},
	};
}

// EN: Multilevel feedback queue. Every process starts at level 0 with a short quantum. A
//     process that uses its whole quantum is assumed to be CPU-bound and moves down one level,
//     where the quantum is twice as long but the turn comes only when the levels above are
//     empty. Short and interactive work finishes at the top without anyone telling the scheduler
//     the bursts. The last level behaves as round-robin.
//     Simplification: a running process is not interrupted in the middle of its quantum when a
//     new process arrives at a higher level. The newcomer runs when the quantum ends.
// PT: Múltiplas filas com realimentação. Todo processo começa no nível 0, com quantum curto. O
//     processo que usa o quantum inteiro é considerado orientado a CPU e desce um nível, onde o
//     quantum é o dobro, mas a vez só chega quando os níveis acima estão vazios. Trabalho curto
//     e interativo termina no topo sem que ninguém informe os tempos ao escalonador. O último
//     nível funciona como round-robin.
//     Simplificação: o processo em execução não é interrompido no meio do quantum quando chega
//     um processo novo em um nível mais alto. O recém-chegado executa quando o quantum termina.
// ES: Múltiples colas con retroalimentación. Todo proceso empieza en el nivel 0, con un quantum
//     corto. El proceso que usa todo el quantum se considera limitado por CPU y baja un nivel,
//     donde el quantum es el doble, pero el turno solo llega cuando los niveles superiores están
//     vacíos. El trabajo corto e interactivo termina arriba sin que nadie informe las ráfagas al
//     planificador. El último nivel se comporta como round-robin.
//     Simplificación: un proceso en ejecución no es interrumpido a mitad de su quantum cuando
//     llega un proceso nuevo a un nivel superior. El recién llegado se ejecuta cuando termina el
//     quantum.
export function mlfq(baseQuantum: number, levels: number): Policy {
	if (!Number.isInteger(baseQuantum) || baseQuantum < 1 || !Number.isInteger(levels) || levels < 1) {
		throw new Error("baseQuantum and levels must be positive integers");
	}
	return {
		name: `MLFQ(q=${baseQuantum},levels=${levels})`,
		select: (ready) => indexOfMin(ready, (entry) => entry.level),
		quantum: (entry) => baseQuantum * 2 ** entry.level,
		expired: (entry) => {
			entry.level = Math.min(entry.level + 1, levels - 1);
		},
	};
}

function validate(processes: readonly Process[]): void {
	const seen = new Set<string>();
	for (const process of processes) {
		if (seen.has(process.id)) {
			throw new Error(`duplicate process id "${process.id}"`);
		}
		seen.add(process.id);
		if (!Number.isInteger(process.arrival) || process.arrival < 0) {
			throw new Error(`${process.id}: arrival must be a non-negative integer`);
		}
		if (!Number.isInteger(process.burst) || process.burst < 1) {
			throw new Error(`${process.id}: burst must be a positive integer`);
		}
	}
}

export function simulate(processes: readonly Process[], policy: Policy): Schedule {
	validate(processes);
	// EN: A stable sort keeps the input order among processes that arrive at the same instant.
	// PT: Uma ordenação estável mantém a ordem de entrada entre processos que chegam no mesmo instante.
	// ES: Un ordenamiento estable conserva el orden de entrada entre procesos que llegan en el mismo instante.
	const pending: Entry[] = [...processes]
		.sort((a, b) => a.arrival - b.arrival)
		.map((process) => ({
			process,
			remaining: process.burst,
			level: 0,
			firstStart: undefined,
			finish: 0,
			dispatches: 0,
		}));
	const all = [...pending];
	const ready: Entry[] = [];
	const slices: Slice[] = [];
	let time = 0;

	const admit = (): void => {
		while (pending.length > 0 && (pending[0] as Entry).process.arrival <= time) {
			ready.push(pending.shift() as Entry);
		}
	};

	while (pending.length > 0 || ready.length > 0) {
		admit();
		if (ready.length === 0) {
			// EN: Nobody is ready: the CPU idles until the next arrival.
			// PT: Ninguém está pronto: a CPU fica ociosa até a próxima chegada.
			// ES: Nadie está listo: la CPU queda ociosa hasta la siguiente llegada.
			time = (pending[0] as Entry).process.arrival;
			continue;
		}
		const [entry] = ready.splice(policy.select(ready), 1) as [Entry];
		const run = Math.min(entry.remaining, policy.quantum(entry));
		entry.firstStart ??= time;
		entry.dispatches += 1;
		const last = slices.at(-1);
		if (last !== undefined && last.id === entry.process.id && last.end === time) {
			last.end = time + run;
		} else {
			slices.push({ id: entry.process.id, start: time, end: time + run });
		}
		time += run;
		entry.remaining -= run;
		// EN: Processes that arrived while this one was running enter the queue BEFORE it goes
		//     back to the tail. This is the usual textbook convention for round-robin ties.
		// PT: Os processos que chegaram enquanto este executava entram na fila ANTES de ele voltar
		//     para o fim. Essa é a convenção usual dos livros para empates no round-robin.
		// ES: Los procesos que llegaron mientras este se ejecutaba entran en la cola ANTES de que
		//     vuelva al final. Esta es la convención habitual de los libros para los empates en
		//     round-robin.
		admit();
		if (entry.remaining === 0) {
			entry.finish = time;
		} else {
			policy.expired(entry);
			ready.push(entry);
		}
	}

	// EN: Turnaround is arrival to completion. Waiting is the part of it spent in the ready
	//     queue, so turnaround minus burst. Response is arrival to the first time on the CPU,
	//     which is what an interactive user feels.
	// PT: Tempo de retorno (turnaround) vai da chegada ao término. Espera é a parte dele gasta na
	//     fila de prontos, ou seja, retorno menos tempo de CPU. Resposta vai da chegada à primeira
	//     vez na CPU, que é o que um usuário interativo percebe.
	// ES: El tiempo de retorno (turnaround) va de la llegada a la finalización. La espera es la
	//     parte de él pasada en la cola de listos, es decir, retorno menos ráfaga. La respuesta va
	//     de la llegada a la primera vez en la CPU, que es lo que percibe un usuario interactivo.
	const metrics: ProcessMetrics[] = all.map((entry) => {
		const turnaround = entry.finish - entry.process.arrival;
		return {
			id: entry.process.id,
			waiting: turnaround - entry.process.burst,
			turnaround,
			response: (entry.firstStart ?? 0) - entry.process.arrival,
			dispatches: entry.dispatches,
		};
	});
	return { policy: policy.name, slices, metrics, averages: averages(metrics) };
}

export function averages(metrics: readonly ProcessMetrics[]): Averages {
	const count = Math.max(metrics.length, 1);
	const sum = (key: "waiting" | "turnaround" | "response"): number =>
		metrics.reduce((total, item) => total + item[key], 0) / count;
	return {
		waiting: sum("waiting"),
		turnaround: sum("turnaround"),
		response: sum("response"),
		maxWaiting: metrics.reduce((worst, item) => Math.max(worst, item.waiting), 0),
	};
}
