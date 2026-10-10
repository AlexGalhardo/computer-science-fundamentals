// EN: Every text of the dashboard, in English and Portuguese. The page is written for a
//     curious ten-year-old: short sentences, everyday comparisons, and no technical word
//     without an explanation. A word written as [[term-id|visible words]] becomes a button
//     that opens the glossary entry `term-id`. Simple must never mean wrong: each sentence
//     here has to stay true for an adult reader too.
// PT: Todos os textos do dashboard, em inglês e português. A página é escrita para uma criança
//     curiosa de dez anos: frases curtas, comparações do dia a dia, e nenhuma palavra técnica
//     sem explicação. Uma palavra escrita como [[id-do-termo|palavras visíveis]] vira um botão
//     que abre a entrada `id-do-termo` do glossário. Simples nunca pode significar errado: cada
//     frase aqui precisa continuar verdadeira também para uma pessoa adulta.
// ES: Todos los textos del dashboard, en inglés, portugués y español. La página está escrita para
//     un niño curioso de diez años: frases cortas, comparaciones de todos los días y ninguna
//     palabra técnica sin explicación. Una palabra escrita como [[id-del-termino|palabras visibles]]
//     se convierte en un botón que abre la entrada `id-del-termino` del glosario. Simple nunca
//     puede significar incorrecto: cada frase de aquí tiene que seguir siendo verdadera también
//     para una persona adulta.

window.BENCH_CONTENT = {
	languageNames: {
		cpp: "C++",
		rust: "Rust",
		go: "Go",
		java: "Java",
		ts: "TypeScript (Bun)",
		python: "Python",
		elixir: "Elixir",
	},

	en: {
		ui: {
			title: "Language benchmarks",
			languageSwitch: "Language of the page",
			navLabel: "Sections",
			nav: {
				start: "Start",
				languages: "Languages",
				cpu: "CPU",
				parallelism: "Parallelism",
				concurrency: "Concurrency",
				http: "HTTP",
				memory: "Memory",
				build: "Build",
				size: "Size",
				database: "Database",
				glossary: "Glossary",
				methodology: "Methodology",
			},
			theme: { toDark: "Dark theme", toLight: "Light theme" },
			filterTitle: "Choose the languages to compare",
			filterHelp: "Untick a language to hide it in every chart. The sentences under the charts change too.",
			what: "What is measured",
			analogy: "Think of it like this",
			matters: "Why it matters",
			read: "How to read the charts",
			shows: "What this shows",
			why: "Why did this happen?",
			careful: "Careful!",
			numbers: "See the numbers in a table",
			noData: "No language selected. Tick at least one language in the filter at the top.",
			better: {
				lower: "Shorter bar = better",
				higher: "Longer bar = better",
				diagonal: "Closer to the dashed line = better",
			},
			gc: "garbage collector",
			manual: "no collector",
			ideal: "perfect",
			axes: { workers: "workers (how many work at the same time)", speedup: "times faster" },
			limits: { efficiency: "100 % = nothing wasted", cpu: "400 % = the 4 cores allowed" },
			endpoint: {
				label: "Kind of request",
				rich: "Kind of [[request|request]]:",
				echo: "JSON echo",
				primes: "Count primes (CPU)",
			},
			models: {
				coroutines: "coroutines",
				"os-threads": "OS threads",
				"tokio-tasks": "async tasks",
				goroutines: "goroutines",
				"virtual-threads": "virtual threads",
				promises: "promises",
				processes: "BEAM processes",
				"asyncio-tasks": "asyncio tasks",
			},
			steps: {
				"compile-and-link": "compile to machine code",
				"compile-to-bytecode": "compile to bytecode",
				"bundle-no-typecheck": "bundle, no type check",
				"bytecode-automatic": "bytecode, normally automatic",
			},
			phase: {
				label: "Kind of operation",
				rich: "Kind of [[query|operation]]:",
				insert: "Insert rows",
				read: "Read by key",
				query: "Filter and add up",
				pool: "Read by key, 8 at once",
			},
			artifacts: {
				cpp: "The program as processor instructions. It borrows the C++ library from the system.",
				rust: "The program as processor instructions, with Rust's own library inside.",
				go: "The program as processor instructions, with the whole Go runtime inside.",
				java: "A jar: the program as bytecode for the JVM.",
				ts: "One JavaScript file with the program.",
				elixir: "The program as bytecode for the BEAM.",
				python: "The program as text. Python ships the source.",
			},
			runtimes: {
				cpp: "The C++ library of the system.",
				rust: "A small helper library of the system.",
				go: "Nothing.",
				java: "A Java machine reduced to the minimum (made with jlink).",
				ts: "The Bun program, with its JavaScript engine.",
				elixir: "The Erlang machine and the Erlang and Elixir libraries.",
				python: "The Python interpreter and its standard library.",
			},
			captions: {
				single: "Only {name} is selected. Tick more languages to compare.",
				same: "{best} and {worst} were about the same here: the difference is smaller than the noise of the measurement.",
				faster: "{best} finished first: about {times} times faster than {worst}, the slowest one here.",
				lighter: "{best} used the least memory: about {times} times less than {worst}, which used the most.",
				more: "{best} answered the most requests: about {times} times more per second than {worst}.",
				efficiency:
					"{best} wasted the least: its workers were about {times} times better used than those of {worst}.",
				cpu: "{best} kept the processor the least busy, about {times} times less than {worst}. Low is only good if the requests were still answered fast.",
				speedup:
					"With {workers} workers, {best} got about {times} times faster than with 1 worker. {worst} got about {worstTimes} times faster. Perfect would be {workers} times.",
				latency:
					"The typical request (p50) was quickest in {typical}: {p50}. The unlucky requests (p99) waited the least in {tail}: {p99}.",
				smaller: "{best} is the smallest here: about {times} times smaller than {worst}, the largest.",
				moreOps: "{best} did the most operations: about {times} times more per second than {worst}.",
				lessCpu:
					"{best} used the least processor time for the whole test: about {times} times less than {worst}.",
				dbLatency:
					"The typical operation (p50) was quickest in {typical}: {p50}. The unlucky operations (p99) waited the least in {tail}: {p99}.",
			},
			tips: {
				time: "{name}\nMean of 5 runs: {mean}\nFastest and slowest run: {low} to {high}\nWork only, without start-up: {section}\nCPU time: {cpu}",
				memory: "{name}\nMost memory in use at one moment: {value}",
				speedup:
					"{name}, {workers} workers\n{speedup} faster than 1 worker\nEfficiency: {efficiency}\nTime of the work: {time}\nCPU time (all cores): {cpu}",
				efficiency:
					"{name}, {workers} workers\nEfficiency: {efficiency}\nSpeed-up: {speedup} (perfect would be {workers}×)",
				tasks: "{name}\n{n} tasks waiting at once\nTotal time: {mean}\nWork only, without start-up: {section}\nPeak memory: {peak}\nMemory per task: {each}",
				rps: "{name}\n{rps} on average\nSlowest and fastest run: {low} to {high}\nLoad generator CPU: {k6} (near 400 % it is the limit)",
				latency:
					"{name}\nHalf of the requests took less than {p50}\n95 in 100 took less than {p95}\n99 in 100 took less than {p99}",
				cpu: "{name}\nMean CPU of the server: {cpu}\nThat is about {cores} of the 4 cores it may use",
				ops: "{name}\n{ops} on average\nSlowest and fastest run: {low} to {high}\nDriver: {driver}",
				clientCpu: "{name}\nProcessor time used by the client program in the whole test: {cpu}",
				build: "{name}\nWhat is measured: {step}\nFrom nothing: {cold}\nAfter changing one line: {warm}\nCommand: {command}",
				size: "{name}\nWhat you ship: {artifact}\nWhat it needs to run: {runtime}\nTogether: {total}\n{what}\nNeeds: {needs}",
			},
			tables: {
				language: "Language",
				process: "Whole program",
				range: "Fastest – slowest (ms)",
				section: "Work only",
				cpu: "CPU time",
				peak: "Peak memory",
				workers: "Workers",
				sectionTime: "Time of the work",
				speedup: "Speed-up",
				efficiency: "Efficiency",
				model: "Kind of task",
				tasks: "Tasks",
				total: "Total time",
				perTask: "Memory per task",
				rps: "Requests per second",
				meanCpu: "Mean CPU",
				k6Cpu: "Load generator CPU",
				step: "What is measured",
				cold: "From nothing",
				warm: "After one edit",
				command: "Command",
				artifact: "What you ship",
				runtime: "What it needs",
				totalSize: "Together",
				artifactIs: "The artifact is",
				runtimeIs: "The runtime is",
				ops: "Operations per second",
				clientCpu: "Client CPU time",
				clientMemory: "Client memory",
				driver: "Driver",
			},
			footer: "Data built on {date}. Everything on this page was measured on one machine, on one day. Run the suite on your own computer and the numbers will be different.",
		},

		intro: {
			title: "Seven programming languages, the same homework",
			paragraphs: [
				"A programming language is a way of telling a computer what to do. Here seven languages got exactly the same tasks, and a [[benchmark|benchmark]] measured how each one behaved: how long it took, how much [[memory|memory]] it needed and how busy it kept the [[core|processor]].",
				"There is no winner of everything. A language that is slow in one chart can be the lightest in another, and the easiest one to write does not appear in any chart at all. The goal of this page is to understand why the bars look the way they do.",
			],
			howTitle: "How to use this page",
			how: [
				"Words with a dotted line, like [[thread|thread]], have an explanation. Point at them, tap them, or reach them with the Tab key.",
				"Every chart says which direction is better, and has a sentence that reads the chart for you.",
				"The green card explains why the result happened. The yellow card says what the chart does not prove.",
				'Point at or tap a bar to see more numbers. "See the numbers in a table" shows all of them.',
				"All the hard words are together in the glossary at the end, and the methodology explains exactly how everything was measured.",
			],
		},

		languages: {
			title: "Meet the seven languages",
			lead: "Each language has its own way of turning your text into something the processor understands, and its own way of doing many things at once. Those two choices explain most of the charts below.",
			fields: { what: "What it is", runs: "How it runs", threads: "How it does many things at once" },
			cards: {
				cpp: {
					what: "A language from the 1980s used for games, browsers and operating systems. It gives the programmer control over every detail.",
					runs: "It is [[compiled|compiled]]: before the program runs, a translator turns it into instructions the processor follows directly. It starts in an instant.",
					threads:
						"It uses [[thread|threads]] of the operating system. They are powerful but heavy, so programs use a few of them. It also has [[coroutine|coroutines]], very light tasks, but you must organise them yourself. There is no [[gc|garbage collector]]: the program frees its own memory.",
				},
				rust: {
					what: "A young language (2015) built to be as fast as C++ while refusing to build programs with the most common memory mistakes.",
					runs: "It is [[compiled|compiled]] to instructions for the processor, like C++. It starts in an instant.",
					threads:
						"It uses operating-system [[thread|threads]] for calculations and very light [[async|async tasks]] for waiting. There is no [[gc|garbage collector]]: the compiler works out, before the program runs, when each piece of memory can be freed.",
				},
				go: {
					what: "A language from Google (2009) made for servers. It is small and simple on purpose.",
					runs: "It is [[compiled|compiled]] to instructions for the processor and starts in an instant. A [[gc|garbage collector]] cleans the memory while the program runs.",
					threads:
						"It has [[goroutine|goroutines]]: tiny tasks that Go itself spreads over the [[core|cores]]. Starting a hundred thousand of them is normal.",
				},
				java: {
					what: "A language from 1995, very common in banks and large companies.",
					runs: "It runs inside a [[vm|virtual machine]], the JVM. The JVM starts slowly, watches which parts of the program are used the most and turns them into fast instructions while it runs ([[jit|JIT]]). A [[gc|garbage collector]] cleans the memory.",
					threads:
						"It has classic [[thread|threads]] and, since 2023, [[virtual-thread|virtual threads]]: very light threads managed by the JVM, so a program can have many thousands of them.",
				},
				ts: {
					what: "TypeScript is JavaScript, the language of web pages, with extra checks. Here it runs on Bun, a program that runs JavaScript outside the browser.",
					runs: "Bun reads the text of the program and turns the most used parts into fast instructions while it runs ([[jit|JIT]]). A [[gc|garbage collector]] cleans the memory.",
					threads:
						"Your code runs on one [[thread|thread]] with an [[event-loop|event loop]]: it does one small thing at a time and switches very quickly while it waits. To use more [[core|cores]] it has to start separate workers.",
				},
				python: {
					what: "A language from 1991 that is easy to read and write. It is the favourite for learning, science and artificial intelligence.",
					runs: "It is [[interpreted|interpreted]]: a program reads your code and carries it out step by step. That is flexible and slow for heavy calculation. Real Python programs hand the heavy part to libraries written in C.",
					threads:
						"A lock called the [[gil|GIL]] lets only one [[thread|thread]] run Python code at a time. To calculate on several [[core|cores]] it starts several [[process|processes]]. To wait for many things it uses an [[event-loop|event loop]].",
				},
				elixir: {
					what: "A language from 2012 that runs on the Erlang machine, built in the 1980s for telephone exchanges that must never stop.",
					runs: "It runs inside a [[vm|virtual machine]], the BEAM, which also turns the program into fast instructions ([[jit|JIT]]). Each task has its own memory and its own [[gc|garbage collector]].",
					threads:
						"Everything is a [[beam-process|BEAM process]]: a tiny task that shares nothing and talks by sending messages. The BEAM spreads them over all the [[core|cores]] and makes sure no task keeps a core for too long.",
				},
			},
		},

		sections: {
			cpu: {
				title: "CPU: one worker thinking hard",
				lead: "How fast can each language calculate when it uses only one [[core|core]] of the processor?",
				what: "Two calculations. The first moves the Sun and four planets step by step, which is all arithmetic with decimal numbers ([[n-body|n-body]]). The second finds all the [[prime|prime numbers]] up to ten million with a method called the [[sieve|sieve]]. The time goes from the moment the program starts to the moment it ends.",
				analogy:
					"It is a maths test with the same questions for everyone. One student, one pencil, and a stopwatch.",
				matters:
					"Games, video, science and artificial intelligence spend their time calculating. If a language is ten times slower at this, the same job needs ten times more time or ten times more computers.",
				read: "Each bar is one language. A shorter bar means less time, so shorter is better. The number is in [[ms|milliseconds]]. The thin black line shows the fastest and the slowest of the 5 runs.",
				charts: {
					"cpu-nbody": {
						title: "Moving the planets one million steps",
						unit: "Time of the whole program, in [[ms|milliseconds]] ([[mean|mean]] of 5 runs, ± [[stddev|standard deviation]]).",
						why: "C++, Rust and Go are [[compiled|compiled]]: the processor follows their instructions directly. Java and TypeScript first have to notice which part is used the most and translate it while running ([[jit|JIT]]), so they lose a little at the start. Python is [[interpreted|interpreted]]: for every small sum it does a lot of extra checking. Elixir never changes a number in place, it creates new ones each step, and that costs time.",
						careful:
							"This is one small calculation, written the plain way in every language. Real Python programs use libraries such as NumPy, which do this in C and are far faster than this chart suggests. The chart measures the language itself, not what people build with it.",
					},
					"cpu-sieve": {
						title: "Finding every prime number up to ten million",
						unit: "Time of the whole program, in [[ms|milliseconds]] ([[mean|mean]] of 5 runs, ± [[stddev|standard deviation]]).",
						why: "This task writes into one big list ten million boxes long, so the speed of [[memory|memory]] matters as much as the speed of calculating. That is why the compiled languages end up close to each other. Elixir has no ordinary list that can be changed in place, so it uses a special one that is slower to reach. Java's bar includes the time the [[vm|JVM]] takes to start.",
						careful:
							"The bars include the [[startup|start-up]] of each language. For a job this short, start-up can be most of the bar. The table shows the time of the work alone, and there the order changes.",
					},
				},
			},

			parallelism: {
				title: "Parallelism: more workers, same job",
				lead: "If one [[worker|worker]] takes a while, do sixteen workers finish sixteen times sooner?",
				what: "One big job: counting the [[prime|prime numbers]] below two million. It is cut into 256 pieces and given to 1, 2, 4, 8 and then 16 [[worker|workers]]. We measure how many times faster the job gets. That number is the [[speedup|speed-up]].",
				analogy:
					"One cook makes 256 sandwiches. With two cooks it should take half the time. With sixteen cooks in a kitchen with eight stoves, they start to get in each other's way.",
				matters:
					"Processors stopped getting much faster years ago. They get more [[core|cores]] instead. A program only benefits if its language can really use them all.",
				read: "In the line chart, the dashed line is the perfect result: twice the workers, twice as fast. A line that stays close to it uses the cores well. In the bar chart, 100 % [[efficiency|efficiency]] means no worker wasted any time.",
				charts: {
					"par-speedup": {
						title: "How many times faster with more workers",
						unit: "[[speedup|Speed-up]]: time with 1 worker divided by time with more workers. Both axes double at each step.",
						why: "No language reaches the perfect line, for three reasons. First, the job is short, so the time to start the workers and hand out the pieces is a big part of it. Python starts a whole new [[process|process]] for each worker and TypeScript a separate worker with its own memory, which are slow to start. The others only start a light [[thread|thread]] or task. Second, this machine has 8 real [[core|cores]], and each one pretends to be two: workers 9 to 16 share a real core with another worker, so they add little or even get in the way. Third, other programs were using the same machine during the test.",
						careful:
							"Speed-up says how well a language uses more cores. It does not say which language is fastest. A slow language can have a great speed-up and still finish last. The table shows the real times. A point above the dashed line is not magic: it is noise in the measurement, because nothing can beat perfect here.",
					},
					"par-efficiency": {
						title: "How much of each worker was really used, with 8 workers",
						unit: "[[efficiency|Efficiency]]: speed-up divided by the number of workers, in percent.",
						why: "Efficiency drops when workers wait instead of working: waiting to be started, waiting for the next piece, or sharing a [[core|core]]. The job is short for the fast languages (a few hundredths of a second), so the time to start the workers is a big part of it. A longer job would show higher efficiency for them.",
						careful:
							'Other programs were running on this machine during the measurement. A busy neighbour takes cores away, and that lowers these bars. Read differences of a few percent as "the same".',
					},
				},
			},

			concurrency: {
				title: "Concurrency: a hundred thousand tasks waiting",
				lead: "Calculating fast is one skill. Keeping track of a huge number of things that are mostly waiting is another one.",
				what: "The program starts 100,000 [[task|tasks]]. Each one waits for a signal, then sends one message and ends. Nothing is calculated. We measure the total time and how much [[memory|memory]] each waiting task costs.",
				analogy:
					"A waiter looks after a hundred thousand tables. Nobody is eating yet, everyone is waiting for the kitchen. A good waiter does not need one person standing at each table: a small notebook is enough.",
				matters:
					"A chat app or a game server has many thousands of people connected, and almost all of them are waiting at any moment. If each waiting person costs a lot of memory, the server fills up quickly.",
				read: "Shorter bars are better in both charts. The first is the total time in [[ms|milliseconds]]. The second is the memory of one task in bytes (B). A thousand bytes is about a page of text.",
				charts: {
					"conc-time": {
						title: "Time to start, wake and finish all the tasks",
						unit: "Time of the whole program, in [[ms|milliseconds]] ([[mean|mean]] of 5 runs, ± [[stddev|standard deviation]]).",
						why: "Each language has its own kind of light task. C++ [[coroutine|coroutines]], Rust [[async|async tasks]] and TypeScript promises are little more than a note saying where the task stopped, so they are very quick. [[goroutine|Goroutines]] and [[beam-process|BEAM processes]] each carry a small private space, which costs a bit more. Java's [[virtual-thread|virtual threads]] are slow here because the [[vm|JVM]] has just started and has not yet made this code fast ([[jit|JIT]]): in a separate check, the same work repeated in a JVM that was already warm took more than 10 times less. C++ with one operating-system [[thread|thread]] per task was only allowed 10,000 tasks, and it is still slow, because the operating system has to manage each thread.",
						careful:
							"No task does real work here, so this chart says nothing about how fast the tasks would run. It also measures one cold start. A server that stays running for days behaves like the warm case.",
					},
					"conc-memory": {
						title: "Memory used by one waiting task",
						unit: "Bytes per task: extra [[peak-memory|peak memory]] with all tasks, divided by the number of tasks.",
						why: "The smallest tasks only store where they stopped. A [[goroutine|goroutine]] and a [[beam-process|BEAM process]] start with a couple of thousand bytes of their own, ready to grow. An operating-system [[thread|thread]] needs far more, because the system reserves space for it and keeps its own records.",
						careful:
							"A task that does real work needs more memory than an empty one. These are the starting prices. The number for a language with a [[gc|garbage collector]] also depends on when the collector decided to clean.",
					},
				},
			},

			http: {
				title: "HTTP: a server under pressure",
				lead: "Each language runs a small web [[server|server]]. A program plays the part of 32 impatient users who keep asking, one [[request|request]] after another.",
				what: "How many requests the server answers each second ([[rps|requests per second]]), how long each answer takes ([[latency|latency]]), and how much processor and [[memory|memory]] the server uses meanwhile. There are two kinds of request: one sends a small [[json|JSON]] text and gets it back, the other asks the server to count [[prime|prime numbers]], which makes it calculate.",
				analogy:
					"A toll booth on a road. Requests per second is how many cars get through each second. Latency is how long one car waits. A booth can let many cars through and still make a few unlucky ones wait a long time.",
				matters:
					"Every website and app talks to servers like these. A server that answers more requests with the same computer costs less. A server with long waits feels slow, even if it is fast on average.",
				read: "Use the buttons to switch the kind of request. For requests per second, longer is better. For latency, memory and CPU, shorter is better. In the latency chart each language has three bars: [[p50|p50]], [[p95|p95]] and [[p99|p99]].",
				charts: {
					"http-rps": {
						title: "Requests answered per second",
						unit: "[[rps|Requests per second]] ([[mean|mean]] of 3 runs of 10 seconds, ± [[stddev|standard deviation]]). 32 [[vu|virtual users]].",
						why: 'On the small echo request almost every server is quicker than the program that sends the requests. That program was using most of its own 4 [[core|cores]] (see "Load generator CPU" in the table), so the tallest bars mostly show the limit of the test, and their order is noise. Python is the exception: its server runs your code on one [[thread|thread]] and is [[interpreted|interpreted]], so there the server is the real limit. Switch to "Count primes" and every server has to calculate: the ones that spread the requests over their 4 cores and calculate fast (Go, Rust, C++) stay high, while TypeScript and Python can only use about one core.',
						careful:
							"Each language uses a different server library, and the library matters as much as the language. Python and TypeScript are run the default way, with one process. In real life people start several copies to use all the cores. And if the load generator's own CPU is near 400 % (see the table), the bar shows the limit of the generator, not of the server.",
					},
					"http-latency": {
						title: "How long one request waits",
						unit: "[[latency|Latency]] in [[ms|milliseconds]]: [[p50|p50]] (typical), [[p95|p95]] and [[p99|p99]] (the unlucky ones).",
						why: "When a server works on one request at a time, the others queue up, like cars at a single booth. The queue makes everyone wait longer. Servers that spread the work over several [[core|cores]] keep the queue short. A [[gc|garbage collector]] can also pause a server for a moment, and that shows up in p99.",
						careful:
							"The 32 users wait for an answer before asking again. So a slow server also receives fewer requests, and its latency looks better than it would under a real crowd that does not wait. The times also include the trip inside the computer between the two programs.",
					},
					"http-cpu": {
						title: "How busy the server kept the processor",
						unit: "[[mean|Mean]] CPU of the server while the load ran. 100 % is one [[core|core]] fully busy.",
						why: "A bar near 100 % belongs to a server that runs on one [[thread|thread]]: it cannot use a second core even when it is overloaded. Bars near 400 % belong to servers that spread the work over all 4 cores they were allowed. A server that was mostly waiting for the load generator to send more stays somewhere in between.",
						careful:
							"A short bar is not automatically good. Using little CPU and answering few requests means the server could not use the machine. Read this chart together with requests per second.",
					},
					"http-memory": {
						title: "Memory the server needed",
						unit: "[[peak-memory|Peak memory]] of the server, in [[mib|MiB]], while the load ran.",
						why: "C++, Rust and Go servers are a single small program. Java and Elixir carry a whole [[vm|virtual machine]], and Java reserves a lot of memory in advance so its [[gc|garbage collector]] can work less often. Python and TypeScript carry their own runtime and libraries.",
						careful:
							"Memory was sampled once per second, so a very short peak can be missed. Languages with a garbage collector can often be told to use less memory, at the cost of some speed. The defaults were used here.",
					},
				},
			},

			memory: {
				title: "Memory: the size of the backpack",
				lead: "How much [[memory|memory]] does a program carry, and who tidies it up?",
				what: "Two things. First, a program that builds and throws away millions of tiny pieces of data arranged as [[binary-tree|trees]]: we measure the most memory it held at one moment ([[peak-memory|peak memory]]) and the time. Second, a program that starts and stops without doing anything: its time is the [[startup|start-up time]] and its memory is the minimum that language needs.",
				analogy:
					"A backpack. Some students pack only what today needs and put each thing back as soon as they finish (no collector). Others throw everything in and tidy up from time to time ([[gc|garbage collector]]). The second way is easier, but the backpack gets bigger.",
				matters:
					"Memory costs money in the cloud and is scarce on phones and small devices. Start-up time matters for small tools that run thousands of times a day.",
				read: "Shorter bars are better in all four charts. Memory is in [[mib|MiB]], time in [[ms|milliseconds]]. Next to each name you can see whether the language has a garbage collector.",
				charts: {
					"mem-trees-peak": {
						title: "Building millions of small trees: most memory held",
						unit: "[[peak-memory|Peak memory]] of the program, in [[mib|MiB]].",
						why: "C++ and Rust give each piece of memory back the moment it is no longer needed, so they hold only what is alive. Languages with a [[gc|garbage collector]] let the rubbish pile up for a while before cleaning, so their peak is usually higher. Go cleans often and stays close to C++ and Rust. Java reserves a large space in advance on purpose: with plenty of room, its collector has to work less often.",
						careful:
							"More memory is not simply worse. A collector that cleans rarely can make the program faster. And most languages let you tune this. Only the default settings were measured.",
					},
					"mem-trees-time": {
						title: "Building millions of small trees: time",
						unit: "Time of the whole program, in [[ms|milliseconds]] ([[mean|mean]] of 5 runs, ± [[stddev|standard deviation]]).",
						why: "A surprise: some languages with a [[gc|garbage collector]] can beat C++ and Rust here. Asking for memory is very cheap for them (they just take the next free spot), and throwing away a short-lived tree costs almost nothing. C++ and Rust ask the system for each small piece and give each one back. Some collectors also work on other [[core|cores]] at the same time: look at the CPU time in the table, it can be higher than the time on the clock.",
						careful:
							"C++ and Rust programmers who need speed here use other techniques, such as taking one big block of memory at once. This test uses the plain, everyday way in every language.",
					},
					"mem-idle-time": {
						title: "A program that does nothing: time to start",
						unit: "[[startup|Start-up time]] in [[ms|milliseconds]]: the program starts and ends right away.",
						why: "A [[compiled|compiled]] program is ready the moment the system loads it. The others first have to start their own machinery: Python its interpreter, Bun its JavaScript engine, Java and Elixir a whole [[vm|virtual machine]].",
						careful:
							"This only matters for programs that start often and live briefly. A server that starts once and runs for months does not care about a fraction of a second.",
					},
					"mem-idle-peak": {
						title: "A program that does nothing: memory",
						unit: "[[peak-memory|Peak memory]] in [[mib|MiB]] of a program that starts and ends right away.",
						why: "This is the size of the empty backpack. A compiled program brings almost nothing with it. A [[vm|virtual machine]] or an interpreter brings its own tools along: the translator, the [[gc|garbage collector]], the standard library.",
						careful:
							"A few dozen MiB do not matter on a laptop. They matter when you run thousands of small programs at once, or on a tiny device.",
					},
				},
			},

			build: {
				title: "Build: waiting for the translator",
				lead: "Before some languages can run your program, a translator has to turn it into something else. How long do you wait?",
				what: 'The time to build the same small program (the planets and primes one from the CPU section). "From nothing" starts with no leftovers from earlier builds. "After one edit" changes one line and builds again, which is what a programmer does hundreds of times a day. Each bar says what the step really is, because the languages do not all do the same thing here.',
				analogy:
					"A book in a foreign language. You can pay a translator to translate the whole book first, and then read it fast ([[compiled|compiled]]). Or you can read with a dictionary in your hand, translating as you go: you start at once, but you read more slowly ([[interpreted|interpreted]]).",
				matters:
					"A programmer changes something, builds, and looks at the result, all day long. If each build takes a minute, the day is spent waiting. That is why Go was designed to compile fast.",
				read: "Shorter bars are better. The number is in [[ms|milliseconds]]. Next to each name is what the step does: turn the program into processor instructions, into [[bytecode|bytecode]], or just pack it into one file ([[bundle|bundle]]).",
				charts: {
					"build-cold": {
						title: "Building from nothing",
						unit: "Time in [[ms|milliseconds]] ([[mean|mean]] of 5 builds, ± [[stddev|standard deviation]]), with every earlier result deleted first.",
						why: "C++, Rust and Go do the hard work now: they turn the program into processor instructions and make them fast, so that running is quick later. C++ is slow even for a small file because it reads the text of large library files again on every build. Go also has to prepare its own library the first time, because its storage of ready pieces ([[cache|cache]]) was emptied. Java and Elixir only translate to [[bytecode|bytecode]], a halfway form, and leave the rest to their [[vm|virtual machine]] at run time. Most of their bar is the translator itself starting up. Bun only packs the file, without checking the types. Python does almost nothing here: it translates as it runs.",
						careful:
							"This is the other side of the CPU chart: the three languages that do the real translation here (C++, Rust, Go) were the fastest there. The program is one small file. A real project has thousands of files, and there the differences are much larger and depend on the tools as much as on the language.",
					},
					"build-warm": {
						title: "Building again after changing one line",
						unit: "Time in [[ms|milliseconds]] ([[mean|mean]] of 5 builds, ± [[stddev|standard deviation]]), after adding one line to the program.",
						why: "Go keeps the ready pieces it already built in a [[cache|cache]] and only rebuilds what changed, so this build is much quicker than the first one. Rust keeps its ready library pieces too, but still rebuilds the whole program file. For the others nothing changes: with a single file there is nothing to reuse, so the whole translation runs again.",
						careful:
							"With one file there is little to reuse, so this chart shows the least that a warm build can save. Big projects are split into many pieces precisely so that one edit rebuilds only one piece.",
					},
				},
			},

			size: {
				title: "Size: what goes in the box",
				lead: "To give your program to someone else, what do you have to put in the box, and how much does it weigh?",
				what: "Two sizes on disk for the same small program. The [[artifact|artifact]] is what the build produces from your code. The [[runtime|runtime]] is everything else that must be on the other computer for the artifact to run, not counting the operating system.",
				analogy:
					"A video game. The cartridge is small, but it is useless without the console. Some languages give you only the cartridge and expect the console to be there. Others build the console into every cartridge.",
				matters:
					"Small programs are quicker to download, start and copy to many machines. And a program that needs nothing installed is much easier to hand to someone.",
				read: "Shorter bars are better. The first chart is only what you ship. The second adds what it needs to run. Compare the two: a language can be the smallest in the first and one of the largest in the second.",
				charts: {
					"size-artifact": {
						title: "What you ship",
						unit: "Size on disk of the [[artifact|artifact]]. 1 MiB is 1,024 KiB.",
						why: "Python and TypeScript ship the text of the program, and Java and Elixir ship [[bytecode|bytecode]]: all of them are tiny, because the real machinery lives somewhere else. Go and Rust put their own machinery inside the program (Go even its [[gc|garbage collector]] and task manager), so the file is bigger. C++ is small because it borrows its library from the system.",
						careful:
							"A small bar here is half of the story: look at the next chart before deciding who is smallest. And nothing was squeezed: the compiled programs still carry information for finding bugs, which can be removed.",
					},
					"size-total": {
						title: "What you ship plus what it needs to run",
						unit: "Size on disk of the [[artifact|artifact]] plus its [[runtime|runtime]].",
						why: "Now the consoles are counted. Go needs nothing else, so its bar does not change. Java needs a Java machine, Python its interpreter and library, Bun its JavaScript engine, Elixir the Erlang machine. Those are the same size whether your program is ten lines or a million.",
						careful:
							"The runtime is paid once per computer, not once per program: ten Python programs share one Python. The operating system and its basic C library are not counted for anyone. A bigger program would make the first chart grow and leave the runtime the same.",
					},
				},
			},

			database: {
				title: "Database: asking the librarian",
				lead: "Most programs keep their data in a [[database|database]]. How fast can each language ask it questions?",
				what: "Each program talks to the same database (PostgreSQL) and does four things: insert 5,000 rows one by one, read each row by its number, ask a question that needs filtering and adding up, and read by number again with 8 workers at once sharing a [[pool|pool]] of connections. We measure operations per second, the [[latency|wait]] of each operation, and the processor and [[memory|memory]] the program used.",
				analogy:
					"A library where only the librarian may touch the shelves. You walk to the desk, ask for one book, wait, and walk back. Most of the time goes in walking and waiting, not in how fast you talk. A pool is like having eight desks open.",
				matters:
					"In a real website the database is usually what takes the time, not the language. This section shows that languages which were a hundred times apart in the CPU chart can be almost side by side here.",
				read: "Use the buttons to choose the kind of operation. For operations per second, longer is better. For latency, CPU and memory, shorter is better. CPU and memory belong to the whole test, so they do not change with the buttons.",
				charts: {
					"db-ops": {
						title: "Operations per second",
						unit: "Operations per second ([[mean|mean]] of 3 runs, ± [[stddev|standard deviation]]). Each operation is one [[round-trip|round trip]] to the database.",
						why: "Every operation is a trip to the database and back, and the program mostly waits. So the bars are much closer together than in the CPU section. What still differs is the [[driver|driver]], the library that speaks to the database: how many messages it sends for one question, and whether it remembers a question it has already asked. With 8 workers at once, several trips happen at the same time, so the total goes up for most languages. Python goes down instead: its 8 threads spend their time fighting over the [[gil|GIL]]. And Rust, one of the fastest languages on this page, is among the slowest on one connection: its library does more work around each question.",
						careful:
							"This mostly measures the driver and the trip, not the language. The database runs on the same computer and keeps its data in memory, so the trip is far shorter than in real life. With a real network, the bars would be even closer together.",
					},
					"db-latency": {
						title: "How long one operation waits",
						unit: "[[latency|Latency]] in [[ms|milliseconds]]: [[p50|p50]] (typical), [[p95|p95]] and [[p99|p99]] (the unlucky ones).",
						why: "The typical wait is the time of one trip plus the work of the database. The unlucky waits come from moments when something else needed the processor: another program on the machine, or a [[gc|garbage collector]] tidying up.",
						careful:
							"These are fractions of a millisecond. Differences this small are easily caused by the other programs that were running on the machine, so do not read much into the order.",
					},
					"db-cpu": {
						title: "Processor time used by the client program",
						unit: "[[cpu-time|CPU time]] in [[ms|milliseconds]] of the whole test (the four kinds of operation together).",
						why: "While it waits for the database a program should use almost no processor. What it does use goes into preparing each question and reading each answer. An [[interpreted|interpreted]] language spends more on that, and a [[vm|virtual machine]] also spends time starting up and preparing its code. The library counts too: Rust's used a lot of processor time here although the language itself is fast.",
						careful:
							"This is the client only. The database did the heavy part and is not in this bar. Start-up of each language is included.",
					},
					"db-memory": {
						title: "Memory used by the client program",
						unit: "[[peak-memory|Peak memory]] of the client program, in [[mib|MiB]].",
						why: "The data here is tiny, so this is almost the empty backpack of each language again (see the Memory section) plus its database library and 9 open connections.",
						careful:
							"A program that reads large results would need much more. This only shows the starting price.",
					},
				},
			},
		},

		glossary: {
			title: "Glossary",
			lead: "Every word with a dotted line on this page, explained in one place.",
			terms: {
				benchmark: {
					term: "Benchmark",
					text: "A fair test: everyone gets the same task and we measure the result, such as time or memory.",
				},
				core: {
					term: "Core",
					text: "One of the workers inside the processor. A processor with 8 cores can do 8 things at exactly the same moment.",
				},
				memory: {
					term: "Memory (RAM)",
					text: "The computer's desk space. It is where a program keeps the things it is using right now. It is emptied when the program ends.",
				},
				ms: {
					term: "Millisecond (ms)",
					text: "One thousandth of a second. A blink of an eye takes about 100 to 300 ms.",
				},
				mib: {
					term: "MiB (mebibyte)",
					text: "A unit of memory: a little more than a million bytes. One photo from a phone takes about 3 MiB.",
				},
				mean: {
					term: "Mean",
					text: "The usual kind of average: add all the results and divide by how many there are.",
				},
				stddev: {
					term: "Standard deviation (±)",
					text: "A number that says how much the results change from one run to the next. Small means the runs were alike. If two bars differ by less than this, treat them as equal.",
				},
				warmup: {
					term: "Warm-up",
					text: "A first run that is thrown away, like stretching before a race. It lets the computer get ready so the real runs are fair.",
				},
				compiled: {
					term: "Compiled",
					text: "The program is translated into the processor's own instructions before it runs. Translating takes time once, and then the program runs fast.",
				},
				interpreted: {
					term: "Interpreted",
					text: "Another program reads your code and carries it out step by step while it runs. Easy to change, but slower for heavy calculation.",
				},
				jit: {
					term: "JIT (just in time)",
					text: "A mix of both: the program starts being read step by step, and the parts used the most are translated into fast instructions while it runs.",
				},
				vm: {
					term: "Virtual machine",
					text: "A program that pretends to be a computer and runs your program inside it. It takes care of memory and of tasks for you.",
				},
				gc: {
					term: "Garbage collector",
					text: "A helper inside the language that finds memory nobody uses any more and frees it. The programmer does not need to remember to clean up.",
				},
				thread: {
					term: "Thread",
					text: "A line of work inside a program. A program with several threads can do several things at once, each one on a different core.",
				},
				process: {
					term: "Process",
					text: "A whole running program, with its own memory. Two processes cannot touch each other's memory.",
				},
				worker: {
					term: "Worker",
					text: "One of the helpers that share a job, so the job finishes sooner. It can be a thread or a whole process.",
				},
				task: {
					term: "Task",
					text: "A small job with a beginning and an end. Many tasks can be in progress at once, even if most of them are waiting.",
				},
				goroutine: {
					term: "Goroutine",
					text: "Go's very light task. Go itself decides which core runs each goroutine, so a program can have hundreds of thousands.",
				},
				"virtual-thread": {
					term: "Virtual thread",
					text: "Java's very light thread. The Java machine, not the operating system, takes care of it, so it costs little.",
				},
				"beam-process": {
					term: "BEAM process",
					text: "Elixir's very light task. It shares nothing with the others and talks only by sending messages.",
				},
				coroutine: {
					term: "Coroutine",
					text: "A function that can stop in the middle, let another one run, and continue later from where it stopped.",
				},
				async: {
					term: "Async task",
					text: 'A task that says "call me when it is ready" instead of standing still while it waits. Meanwhile the thread does other work.',
				},
				"event-loop": {
					term: "Event loop",
					text: "One worker with a to-do list. It takes the next small job, does it, and takes the next one. It is very quick while jobs are short, and everything waits when one job is long.",
				},
				gil: {
					term: "GIL",
					text: "A lock in Python that lets only one thread run Python code at a time, even on a computer with many cores.",
				},
				speedup: {
					term: "Speed-up",
					text: "How many times faster a job gets with more workers. Twice as fast with two workers is a speed-up of 2.",
				},
				efficiency: {
					term: "Efficiency",
					text: "Speed-up divided by the number of workers. 100 % means every worker did a full share. 50 % means half of their time was wasted.",
				},
				"cpu-time": {
					term: "CPU time",
					text: "The working time of all the cores added together. Four cores busy for one second make four seconds of CPU time.",
				},
				"wall-time": {
					term: "Wall-clock time",
					text: "The time you would read on a clock on the wall, from the start to the end.",
				},
				"peak-memory": {
					term: "Peak memory",
					text: "The most memory the program used at any one moment, like the fullest the backpack ever got.",
				},
				startup: {
					term: "Start-up time",
					text: "The time a program needs to get ready before it does its first useful thing.",
				},
				server: {
					term: "Server",
					text: "A program that waits for requests from other programs and answers them. Websites live on servers.",
				},
				request: {
					term: "Request",
					text: 'One question sent to a server, such as "send me this page". The server sends back a response.',
				},
				json: {
					term: "JSON",
					text: "A simple way to write data as text, so that programs in different languages can understand each other.",
				},
				rps: {
					term: "Requests per second",
					text: "How many requests the server answers each second. It is also called throughput. More is better.",
				},
				latency: {
					term: "Latency",
					text: "The time between sending a request and getting the answer. Less is better.",
				},
				p50: {
					term: "p50 (median)",
					text: "Half of the requests were faster than this and half were slower. It is the typical wait.",
				},
				p95: {
					term: "p95",
					text: "95 out of 100 requests were faster than this. Only the 5 slowest waited longer.",
				},
				p99: {
					term: "p99",
					text: "99 out of 100 requests were faster than this. It is the wait of the one unlucky request in a hundred.",
				},
				vu: {
					term: "Virtual user",
					text: "A pretend user made by the test program. It sends a request, waits for the answer, and sends the next one.",
				},
				"n-body": {
					term: "N-body",
					text: "A calculation of how several bodies in space, such as the Sun and the planets, pull on each other and move.",
				},
				prime: {
					term: "Prime number",
					text: "A number bigger than 1 that can only be divided by 1 and by itself, such as 2, 3, 5, 7 and 11.",
				},
				sieve: {
					term: "Sieve",
					text: "An old method to find primes: write all the numbers, then cross out the multiples of 2, of 3, of 5... What is left is prime.",
				},
				database: {
					term: "Database",
					text: 'A program whose job is to keep data safe and answer questions about it, such as "which items cost less than 10?".',
				},
				driver: {
					term: "Driver",
					text: "A library that lets a program talk to a database. It turns your question into the messages the database understands.",
				},
				pool: {
					term: "Connection pool",
					text: "A few connections to the database kept open and shared. Opening a connection is slow, so programs borrow one, use it and give it back.",
				},
				query: {
					term: "Query",
					text: 'A question or an order sent to a database, such as "give me row 7" or "add this row".',
				},
				"round-trip": {
					term: "Round trip",
					text: "Sending a message and waiting for the answer to come back. Each trip takes time even when the work is tiny.",
				},
				bytecode: {
					term: "Bytecode",
					text: "A halfway translation of a program: no longer the text you wrote, not yet instructions for the processor. A virtual machine runs it.",
				},
				bundle: {
					term: "Bundle",
					text: "All the files of a program packed into one file, so it is easy to send and quick to load.",
				},
				artifact: {
					term: "Artifact",
					text: "The thing a build produces and that you hand to someone else: a program file, a package or a bundle.",
				},
				runtime: {
					term: "Runtime",
					text: "The machinery a program needs around it in order to run, such as an interpreter, a virtual machine or a garbage collector.",
				},
				cache: {
					term: "Cache",
					text: "A place where results are kept so that the same work does not have to be done twice.",
				},
				"binary-tree": {
					term: "Binary tree",
					text: "A way of organising data in which each piece points to two others, like a family tree upside down.",
				},
			},
		},

		methodology: {
			title: "Methodology",
			lead: "This part is for readers who want to check the work or repeat it. The same information is in benchmarks/README.md.",
			measuredAt: "Measured at:",
			databaseLabel: "Database",
			blocks: [
				{
					title: "How the numbers were produced",
					items: [
						"Every program runs in a Docker container built from a pinned image, with no network. Programs are compiled into the image, so no run reads the program through a bind mount.",
						"CPU, parallelism, concurrency and memory use the shared runner of the repository (tools/bench): hyperfine 2.0.0 runs each command 5 times after 1 discarded warm-up run, inside the container, and records wall-clock time, CPU time (user plus system) and peak resident memory of the whole process. The program also prints the time of its measured section, without start-up.",
						"The charts of time show the whole process (mean, with the range of the 5 runs). The tables also show the measured section.",
						"Speed-up uses the measured section, because the start-up of a runtime is not parallel work. The runner reads the section only once, so a small extra collector (scripts/collect-sections.ts) runs each case 5 more times. Speed-up = mean section time with 1 worker / mean with w workers. Efficiency = speed-up / w.",
						"Memory per task = (peak memory with n tasks − peak memory with 0 tasks) / n.",
						"HTTP: each server runs alone, limited to 4 CPUs and 2 GiB, on an internal Docker network with no published port. k6 2.3.0, also limited to 4 CPUs, runs 32 virtual users for 10 s, 3 times, each after a 3 s warm-up run. CPU and memory of the server container are sampled about once per second from docker stats while k6 is sending load. The first and last sample of each run are dropped.",
						"Build: hyperfine runs the build command 5 times with --prepare. Cold deletes the output and the compiler cache before each run (for Go, the whole build cache). Warm appends one comment line to the source before each run. The program is the one of cpu-single.",
						"Size: exact sizes from stat and du inside the images. Runtime means what must be present besides the artifact, not counting the operating system and glibc: shared libstdc++ and libgcc for C++, libgcc for Rust, nothing for Go, a jlink runtime with java.base for Java, the bun executable, the rest of the mix release for Elixir, the CPython installation for Python.",
						"Database: PostgreSQL 18.6 with its data on tmpfs, on an internal Docker network, 4 CPUs for the server and 4 for the client. Each client runs once as warm-up and 3 times measured: 5,000 single-row inserts, 5,000 reads by primary key, 200 filtered aggregates, then 5,000 reads by key from 8 workers on a pool of 8 connections. Latency is measured by the client around each call. CPU time and peak memory are the client's own, from the kernel.",
						"Before any measurement, tests check that all seven implementations print the same checksum for the same input, and that the seven servers pass the same protocol test suite.",
					],
				},
				{
					title: "Machine",
					data: "machine",
					paragraphs: [
						"All results come from this one machine. Docker runs inside a virtual machine (WSL 2), which adds its own overhead and noise.",
					],
				},
				{
					title: "Runtime versions",
					data: "runtimes",
					paragraphs: [
						"Image tags are pinned, and so is every library (Cargo.lock, mix.lock, requirements.txt, fixed download URLs).",
					],
				},
				{
					title: "Exact commands",
					data: "commands",
					paragraphs: [
						"One command reproduces everything: ./setup-unix-benchmarks.sh or ./setup-windows-benchmarks.ps1. The commands below are what ran inside each container.",
					],
				},
				{
					title: "How to read each chart",
					items: [
						"Bars of time: shorter is better. The whisker is the fastest and slowest of the 5 runs, and ± is the standard deviation. Bars start at zero and the scale is linear, so very fast languages look like a sliver next to a slow one: read the number.",
						"Speed-up: both axes are logarithmic in base 2. The dashed diagonal is linear speed-up. The host has 8 physical cores with SMT (16 logical), so the step from 8 to 16 workers cannot double.",
						"Efficiency: speed-up divided by workers, shown for 8 workers, the number of physical cores.",
						"Requests per second: longer is better. Check the k6 CPU column in the table: near 400 % the load generator was saturated and the server could have done more.",
						"Latency: p50, p95 and p99 of the request duration seen by k6, mean of the 3 runs. The load model is closed (a user waits for the answer), so latency under overload is underestimated (coordinated omission).",
						"Server CPU: 100 % is one core. The limit of each server is 400 %.",
						"Memory: peak resident set size of the process (runner) or largest docker stats sample of the container (HTTP).",
					],
				},
				{
					title: "Limits of this comparison",
					items: [
						"Noise. Other containers were running on the same machine during the measurement. Runs are few (5, or 3 for HTTP) and short. Treat a difference smaller than the spread as no difference, and do not rank languages whose bars are close.",
						"One machine, one day, one version of each runtime, default settings. No JVM flags, no GOGC tuning, no allocator swap, no profile-guided optimisation.",
						"Small programs written the plain way. They measure the language runtime on a narrow task, not real applications, and not the libraries people use to go faster (NumPy, arenas, SIMD).",
						"The whole-process times include runtime start-up, which dominates the short runs of the fast languages.",
						"HTTP compares server stacks, not only languages: cpp-httplib, axum, net/http, the JDK server, Bun.serve, Bandit and FastAPI on uvicorn. Python and Bun run one process (their default) while the others use 4 cores. Client and server share the machine.",
						"Concurrency measures a cold start. The JVM result is dominated by code that is not yet compiled by the JIT. C++ OS threads stop at 10,000 because 100,000 threads would hit the thread limit of the Docker virtual machine shared with other work.",
						"Python parallelism uses processes started with the spawn method, so the time includes starting interpreters.",
						"Build time uses a one-file program, and Python, Bun, Java and Elixir do not produce machine code ahead of time, so their bars measure a different step. Binary size counts nothing of the operating system and nothing is stripped.",
						"Database mostly measures the driver and a very short round trip. Drivers differ in defaults that matter more than the language, such as preparing a statement once or on every call. libpq has no pool, so the C++ pool phase uses one connection per thread.",
						"Speed, memory and CPU are only three of the reasons to choose a language. Safety, ease of writing, libraries and the team's experience are not in any chart.",
					],
				},
			],
		},
	},

	pt: {
		ui: {
			title: "Benchmark das linguagens",
			languageSwitch: "Idioma da página",
			navLabel: "Seções",
			nav: {
				start: "Início",
				languages: "Linguagens",
				cpu: "CPU",
				parallelism: "Paralelismo",
				concurrency: "Concorrência",
				http: "HTTP",
				memory: "Memória",
				build: "Build",
				size: "Tamanho",
				database: "Banco de dados",
				glossary: "Glossário",
				methodology: "Metodologia",
			},
			theme: { toDark: "Tema escuro", toLight: "Tema claro" },
			filterTitle: "Escolha as linguagens para comparar",
			filterHelp:
				"Desmarque uma linguagem para escondê-la em todos os gráficos. As frases embaixo dos gráficos mudam também.",
			what: "O que é medido",
			analogy: "Pense assim",
			matters: "Por que isso importa",
			read: "Como ler os gráficos",
			shows: "O que isto mostra",
			why: "Por que isso aconteceu?",
			careful: "Cuidado!",
			numbers: "Ver os números em uma tabela",
			noData: "Nenhuma linguagem selecionada. Marque pelo menos uma linguagem no filtro lá em cima.",
			better: {
				lower: "Barra mais curta = melhor",
				higher: "Barra mais longa = melhor",
				diagonal: "Mais perto da linha tracejada = melhor",
			},
			gc: "coletor de lixo",
			manual: "sem coletor",
			ideal: "perfeito",
			axes: { workers: "workers (quantos trabalham ao mesmo tempo)", speedup: "vezes mais rápido" },
			limits: { efficiency: "100 % = nada desperdiçado", cpu: "400 % = os 4 núcleos permitidos" },
			endpoint: {
				label: "Tipo de requisição",
				rich: "Tipo de [[request|requisição]]:",
				echo: "Eco de JSON",
				primes: "Contar primos (CPU)",
			},
			models: {
				coroutines: "corrotinas",
				"os-threads": "threads do SO",
				"tokio-tasks": "tarefas assíncronas",
				goroutines: "goroutines",
				"virtual-threads": "virtual threads",
				promises: "promises",
				processes: "processos da BEAM",
				"asyncio-tasks": "tarefas asyncio",
			},
			steps: {
				"compile-and-link": "compilar para código de máquina",
				"compile-to-bytecode": "compilar para bytecode",
				"bundle-no-typecheck": "empacotar, sem checar tipos",
				"bytecode-automatic": "bytecode, normalmente automático",
			},
			phase: {
				label: "Tipo de operação",
				rich: "Tipo de [[query|operação]]:",
				insert: "Inserir linhas",
				read: "Ler pela chave",
				query: "Filtrar e somar",
				pool: "Ler pela chave, 8 de uma vez",
			},
			artifacts: {
				cpp: "O programa em instruções do processador. Ele pega emprestada a biblioteca de C++ do sistema.",
				rust: "O programa em instruções do processador, com a biblioteca do Rust dentro.",
				go: "O programa em instruções do processador, com o runtime inteiro do Go dentro.",
				java: "Um jar: o programa em bytecode para a JVM.",
				ts: "Um arquivo JavaScript com o programa.",
				elixir: "O programa em bytecode para a BEAM.",
				python: "O programa em texto. O Python entrega o fonte.",
			},
			runtimes: {
				cpp: "A biblioteca de C++ do sistema.",
				rust: "Uma pequena biblioteca auxiliar do sistema.",
				go: "Nada.",
				java: "Uma máquina Java reduzida ao mínimo (feita com jlink).",
				ts: "O programa Bun, com seu motor de JavaScript.",
				elixir: "A máquina do Erlang e as bibliotecas do Erlang e do Elixir.",
				python: "O interpretador Python e sua biblioteca padrão.",
			},
			captions: {
				single: "Só {name} está selecionada. Marque mais linguagens para comparar.",
				same: "{best} e {worst} ficaram praticamente iguais aqui: a diferença é menor que o ruído da medição.",
				faster: "{best} terminou primeiro: cerca de {times} vezes mais rápido que {worst}, a mais lenta aqui.",
				lighter: "{best} usou menos memória: cerca de {times} vezes menos que {worst}, a que mais usou.",
				more: "{best} respondeu mais requisições: cerca de {times} vezes mais por segundo que {worst}.",
				efficiency:
					"{best} desperdiçou menos: seus workers foram cerca de {times} vezes mais bem aproveitados que os de {worst}.",
				cpu: "{best} deixou o processador menos ocupado, cerca de {times} vezes menos que {worst}. Pouco só é bom se as requisições ainda foram respondidas rápido.",
				speedup:
					"Com {workers} workers, {best} ficou cerca de {times} vezes mais rápido que com 1 worker. {worst} ficou cerca de {worstTimes} vezes mais rápido. O perfeito seria {workers} vezes.",
				latency:
					"A requisição típica (p50) foi mais rápida em {typical}: {p50}. As requisições azaradas (p99) esperaram menos em {tail}: {p99}.",
				smaller: "{best} é a menor aqui: cerca de {times} vezes menor que {worst}, a maior.",
				moreOps: "{best} fez mais operações: cerca de {times} vezes mais por segundo que {worst}.",
				lessCpu:
					"{best} usou menos tempo de processador no teste inteiro: cerca de {times} vezes menos que {worst}.",
				dbLatency:
					"A operação típica (p50) foi mais rápida em {typical}: {p50}. As operações azaradas (p99) esperaram menos em {tail}: {p99}.",
			},
			tips: {
				time: "{name}\nMédia de 5 execuções: {mean}\nExecução mais rápida e mais lenta: {low} a {high}\nSó o trabalho, sem a inicialização: {section}\nTempo de CPU: {cpu}",
				memory: "{name}\nMáximo de memória em uso em um momento: {value}",
				speedup:
					"{name}, {workers} workers\n{speedup} mais rápido que 1 worker\nEficiência: {efficiency}\nTempo do trabalho: {time}\nTempo de CPU (todos os núcleos): {cpu}",
				efficiency:
					"{name}, {workers} workers\nEficiência: {efficiency}\nSpeed-up: {speedup} (o perfeito seria {workers}×)",
				tasks: "{name}\n{n} tarefas esperando ao mesmo tempo\nTempo total: {mean}\nSó o trabalho, sem a inicialização: {section}\nPico de memória: {peak}\nMemória por tarefa: {each}",
				rps: "{name}\n{rps} em média\nExecução mais lenta e mais rápida: {low} a {high}\nCPU do gerador de carga: {k6} (perto de 400 % o limite é ele)",
				latency:
					"{name}\nMetade das requisições levou menos de {p50}\n95 em cada 100 levaram menos de {p95}\n99 em cada 100 levaram menos de {p99}",
				cpu: "{name}\nCPU média do servidor: {cpu}\nIsso é cerca de {cores} dos 4 núcleos que ele pode usar",
				ops: "{name}\n{ops} em média\nExecução mais lenta e mais rápida: {low} a {high}\nDriver: {driver}",
				clientCpu: "{name}\nTempo de processador usado pelo programa cliente no teste inteiro: {cpu}",
				build: "{name}\nO que é medido: {step}\nA partir do nada: {cold}\nDepois de mudar uma linha: {warm}\nComando: {command}",
				size: "{name}\nO que você entrega: {artifact}\nO que ele precisa para rodar: {runtime}\nJuntos: {total}\n{what}\nPrecisa de: {needs}",
			},
			tables: {
				language: "Linguagem",
				process: "Programa inteiro",
				range: "Mais rápida – mais lenta (ms)",
				section: "Só o trabalho",
				cpu: "Tempo de CPU",
				peak: "Pico de memória",
				workers: "Workers",
				sectionTime: "Tempo do trabalho",
				speedup: "Speed-up",
				efficiency: "Eficiência",
				model: "Tipo de tarefa",
				tasks: "Tarefas",
				total: "Tempo total",
				perTask: "Memória por tarefa",
				rps: "Requisições por segundo",
				meanCpu: "CPU média",
				k6Cpu: "CPU do gerador de carga",
				step: "O que é medido",
				cold: "A partir do nada",
				warm: "Depois de uma edição",
				command: "Comando",
				artifact: "O que você entrega",
				runtime: "O que ele precisa",
				totalSize: "Juntos",
				artifactIs: "O artefato é",
				runtimeIs: "O runtime é",
				ops: "Operações por segundo",
				clientCpu: "Tempo de CPU do cliente",
				clientMemory: "Memória do cliente",
				driver: "Driver",
			},
			footer: "Dados gerados em {date}. Tudo nesta página foi medido em uma máquina, em um dia. Rode a suíte no seu computador e os números serão diferentes.",
		},

		intro: {
			title: "Sete linguagens de programação, a mesma lição de casa",
			paragraphs: [
				"Uma linguagem de programação é um jeito de dizer ao computador o que fazer. Aqui sete linguagens receberam exatamente as mesmas tarefas, e um [[benchmark|benchmark]] mediu como cada uma se comportou: quanto tempo levou, de quanta [[memory|memória]] precisou e o quanto ocupou o [[core|processador]].",
				"Não existe uma campeã de tudo. Uma linguagem lenta em um gráfico pode ser a mais leve em outro, e a mais fácil de escrever não aparece em gráfico nenhum. O objetivo desta página é entender por que as barras são do jeito que são.",
			],
			howTitle: "Como usar esta página",
			how: [
				"Palavras com linha pontilhada, como [[thread|thread]], têm explicação. Passe o mouse, toque nelas, ou chegue até elas com a tecla Tab.",
				"Todo gráfico diz qual direção é melhor, e tem uma frase que lê o gráfico para você.",
				"O cartão verde explica por que o resultado aconteceu. O cartão amarelo diz o que o gráfico não prova.",
				'Passe o mouse ou toque em uma barra para ver mais números. "Ver os números em uma tabela" mostra todos.',
				"Todas as palavras difíceis estão juntas no glossário, no final, e a metodologia explica exatamente como tudo foi medido.",
			],
		},

		languages: {
			title: "Conheça as sete linguagens",
			lead: "Cada linguagem tem seu jeito de transformar o seu texto em algo que o processador entende, e seu jeito de fazer muitas coisas ao mesmo tempo. Essas duas escolhas explicam a maior parte dos gráficos abaixo.",
			fields: { what: "O que é", runs: "Como roda", threads: "Como faz muitas coisas ao mesmo tempo" },
			cards: {
				cpp: {
					what: "Uma linguagem dos anos 1980 usada em jogos, navegadores e sistemas operacionais. Ela dá a quem programa o controle de cada detalhe.",
					runs: "É [[compiled|compilada]]: antes de o programa rodar, um tradutor o transforma em instruções que o processador segue diretamente. Ela começa num instante.",
					threads:
						"Usa [[thread|threads]] do sistema operacional. Elas são poderosas mas pesadas, então os programas usam poucas. Também tem [[coroutine|corrotinas]], tarefas bem leves, mas é você quem precisa organizá-las. Não há [[gc|coletor de lixo]]: o programa libera a própria memória.",
				},
				rust: {
					what: "Uma linguagem jovem (2015) feita para ser tão rápida quanto C++ e, ao mesmo tempo, se recusar a construir programas com os erros de memória mais comuns.",
					runs: "É [[compiled|compilada]] para instruções do processador, como C++. Ela começa num instante.",
					threads:
						"Usa [[thread|threads]] do sistema operacional para cálculos e [[async|tarefas assíncronas]] bem leves para esperar. Não há [[gc|coletor de lixo]]: o compilador descobre, antes de o programa rodar, quando cada pedaço de memória pode ser liberado.",
				},
				go: {
					what: "Uma linguagem do Google (2009) feita para servidores. Ela é pequena e simples de propósito.",
					runs: "É [[compiled|compilada]] para instruções do processador e começa num instante. Um [[gc|coletor de lixo]] limpa a memória enquanto o programa roda.",
					threads:
						"Tem [[goroutine|goroutines]]: tarefas minúsculas que o próprio Go espalha pelos [[core|núcleos]]. Criar cem mil delas é normal.",
				},
				java: {
					what: "Uma linguagem de 1995, muito comum em bancos e grandes empresas.",
					runs: "Roda dentro de uma [[vm|máquina virtual]], a JVM. A JVM começa devagar, observa quais partes do programa são mais usadas e as transforma em instruções rápidas enquanto roda ([[jit|JIT]]). Um [[gc|coletor de lixo]] limpa a memória.",
					threads:
						"Tem [[thread|threads]] clássicas e, desde 2023, [[virtual-thread|virtual threads]]: threads bem leves cuidadas pela JVM, então um programa pode ter muitos milhares delas.",
				},
				ts: {
					what: "TypeScript é JavaScript, a linguagem das páginas web, com verificações a mais. Aqui ele roda no Bun, um programa que roda JavaScript fora do navegador.",
					runs: "O Bun lê o texto do programa e transforma as partes mais usadas em instruções rápidas enquanto roda ([[jit|JIT]]). Um [[gc|coletor de lixo]] limpa a memória.",
					threads:
						"Seu código roda em uma [[thread|thread]] com um [[event-loop|event loop]]: ele faz uma coisa pequena por vez e troca muito rápido enquanto espera. Para usar mais [[core|núcleos]] ele precisa criar workers separados.",
				},
				python: {
					what: "Uma linguagem de 1991, fácil de ler e escrever. É a favorita para aprender, para ciência e para inteligência artificial.",
					runs: "É [[interpreted|interpretada]]: um programa lê o seu código e o executa passo a passo. Isso é flexível e lento para cálculo pesado. Programas Python de verdade entregam a parte pesada a bibliotecas escritas em C.",
					threads:
						"Uma trava chamada [[gil|GIL]] deixa só uma [[thread|thread]] rodar código Python por vez. Para calcular em vários [[core|núcleos]] ele cria vários [[process|processos]]. Para esperar muitas coisas ele usa um [[event-loop|event loop]].",
				},
				elixir: {
					what: "Uma linguagem de 2012 que roda na máquina do Erlang, construída nos anos 1980 para centrais telefônicas que nunca podem parar.",
					runs: "Roda dentro de uma [[vm|máquina virtual]], a BEAM, que também transforma o programa em instruções rápidas ([[jit|JIT]]). Cada tarefa tem sua própria memória e seu próprio [[gc|coletor de lixo]].",
					threads:
						"Tudo é um [[beam-process|processo da BEAM]]: uma tarefa minúscula que não compartilha nada e conversa enviando mensagens. A BEAM os espalha por todos os [[core|núcleos]] e garante que nenhuma tarefa fique com um núcleo por tempo demais.",
				},
			},
		},

		sections: {
			cpu: {
				title: "CPU: um trabalhador pensando muito",
				lead: "Com que velocidade cada linguagem calcula quando usa só um [[core|núcleo]] do processador?",
				what: "Dois cálculos. O primeiro move o Sol e quatro planetas passo a passo, e é todo feito de contas com números decimais ([[n-body|n-body]]). O segundo acha todos os [[prime|números primos]] até dez milhões com um método chamado [[sieve|crivo]]. O tempo vai do momento em que o programa começa até o momento em que termina.",
				analogy:
					"É uma prova de matemática com as mesmas questões para todos. Um aluno, um lápis e um cronômetro.",
				matters:
					"Jogos, vídeo, ciência e inteligência artificial passam o tempo calculando. Se uma linguagem é dez vezes mais lenta nisso, o mesmo trabalho precisa de dez vezes mais tempo ou de dez vezes mais computadores.",
				read: "Cada barra é uma linguagem. Barra mais curta significa menos tempo, então mais curta é melhor. O número está em [[ms|milissegundos]]. A linha preta fina mostra a mais rápida e a mais lenta das 5 execuções.",
				charts: {
					"cpu-nbody": {
						title: "Movendo os planetas um milhão de passos",
						unit: "Tempo do programa inteiro, em [[ms|milissegundos]] ([[mean|média]] de 5 execuções, ± [[stddev|desvio padrão]]).",
						why: "C++, Rust e Go são [[compiled|compiladas]]: o processador segue as instruções delas diretamente. Java e TypeScript primeiro precisam perceber qual parte é mais usada e traduzi-la enquanto rodam ([[jit|JIT]]), então perdem um pouco no começo. Python é [[interpreted|interpretada]]: para cada pequena soma ela faz muita verificação a mais. Elixir nunca altera um número no lugar, ele cria números novos a cada passo, e isso custa tempo.",
						careful:
							"Este é um cálculo pequeno, escrito do jeito simples em todas as linguagens. Programas Python de verdade usam bibliotecas como o NumPy, que fazem isso em C e são muito mais rápidas do que este gráfico sugere. O gráfico mede a linguagem em si, não o que as pessoas constroem com ela.",
					},
					"cpu-sieve": {
						title: "Achando todos os números primos até dez milhões",
						unit: "Tempo do programa inteiro, em [[ms|milissegundos]] ([[mean|média]] de 5 execuções, ± [[stddev|desvio padrão]]).",
						why: "Esta tarefa escreve em uma lista grande, com dez milhões de casas, então a velocidade da [[memory|memória]] importa tanto quanto a velocidade de calcular. Por isso as linguagens compiladas ficam perto umas das outras. Elixir não tem uma lista comum que possa ser alterada no lugar, então usa uma especial, mais lenta de acessar. A barra do Java inclui o tempo que a [[vm|JVM]] leva para iniciar.",
						careful:
							"As barras incluem a [[startup|inicialização]] de cada linguagem. Em um trabalho tão curto, a inicialização pode ser a maior parte da barra. A tabela mostra o tempo só do trabalho, e lá a ordem muda.",
					},
				},
			},

			parallelism: {
				title: "Paralelismo: mais trabalhadores, o mesmo trabalho",
				lead: "Se um [[worker|worker]] demora um tanto, dezesseis workers terminam dezesseis vezes antes?",
				what: "Um trabalho grande: contar os [[prime|números primos]] abaixo de dois milhões. Ele é cortado em 256 pedaços e entregue a 1, 2, 4, 8 e depois 16 [[worker|workers]]. Medimos quantas vezes mais rápido o trabalho fica. Esse número é o [[speedup|speed-up]].",
				analogy:
					"Um cozinheiro faz 256 sanduíches. Com dois cozinheiros deveria levar metade do tempo. Com dezesseis cozinheiros em uma cozinha com oito fogões, eles começam a se atrapalhar.",
				matters:
					"Os processadores pararam de ficar muito mais rápidos há anos. Em vez disso, ganham mais [[core|núcleos]]. Um programa só aproveita se a linguagem conseguir usar todos de verdade.",
				read: "No gráfico de linhas, a linha tracejada é o resultado perfeito: o dobro de workers, o dobro da velocidade. Uma linha que fica perto dela usa bem os núcleos. No gráfico de barras, 100 % de [[efficiency|eficiência]] significa que nenhum worker desperdiçou tempo.",
				charts: {
					"par-speedup": {
						title: "Quantas vezes mais rápido com mais workers",
						unit: "[[speedup|Speed-up]]: tempo com 1 worker dividido pelo tempo com mais workers. Os dois eixos dobram a cada passo.",
						why: "Nenhuma linguagem chega à linha perfeita, por três motivos. Primeiro, o trabalho é curto, então o tempo de criar os workers e distribuir os pedaços é uma parte grande dele. Python cria um [[process|processo]] inteiro novo para cada worker e TypeScript um worker separado com sua própria memória, que demoram a iniciar. As outras só criam uma [[thread|thread]] ou tarefa leve. Segundo, esta máquina tem 8 [[core|núcleos]] de verdade, e cada um finge ser dois: os workers de 9 a 16 dividem um núcleo real com outro worker, então acrescentam pouco ou até atrapalham. Terceiro, outros programas estavam usando a mesma máquina durante o teste.",
						careful:
							"O speed-up diz o quanto uma linguagem aproveita mais núcleos. Ele não diz qual linguagem é a mais rápida. Uma linguagem lenta pode ter um ótimo speed-up e ainda terminar por último. A tabela mostra os tempos reais. Um ponto acima da linha tracejada não é mágica: é ruído da medição, porque nada consegue ganhar do perfeito aqui.",
					},
					"par-efficiency": {
						title: "Quanto de cada worker foi realmente usado, com 8 workers",
						unit: "[[efficiency|Eficiência]]: speed-up dividido pelo número de workers, em porcentagem.",
						why: "A eficiência cai quando os workers esperam em vez de trabalhar: esperando ser criados, esperando o próximo pedaço, ou dividindo um [[core|núcleo]]. O trabalho é curto para as linguagens rápidas (alguns centésimos de segundo), então o tempo de criar os workers é uma parte grande dele. Um trabalho mais longo mostraria eficiência maior para elas.",
						careful:
							'Outros programas estavam rodando nesta máquina durante a medição. Um vizinho ocupado tira núcleos, e isso baixa estas barras. Leia diferenças de poucos por cento como "igual".',
					},
				},
			},

			concurrency: {
				title: "Concorrência: cem mil tarefas esperando",
				lead: "Calcular rápido é uma habilidade. Cuidar de um número enorme de coisas que estão quase todas esperando é outra.",
				what: "O programa cria 100.000 [[task|tarefas]]. Cada uma espera um sinal, depois envia uma mensagem e termina. Nada é calculado. Medimos o tempo total e quanta [[memory|memória]] custa cada tarefa esperando.",
				analogy:
					"Um garçom cuida de cem mil mesas. Ninguém está comendo ainda, todos esperam a cozinha. Um bom garçom não precisa de uma pessoa parada em cada mesa: um caderninho basta.",
				matters:
					"Um aplicativo de conversa ou um servidor de jogo tem muitos milhares de pessoas conectadas, e quase todas estão esperando a qualquer momento. Se cada pessoa esperando custa muita memória, o servidor enche depressa.",
				read: "Barras mais curtas são melhores nos dois gráficos. O primeiro é o tempo total em [[ms|milissegundos]]. O segundo é a memória de uma tarefa em bytes (B). Mil bytes são mais ou menos uma página de texto.",
				charts: {
					"conc-time": {
						title: "Tempo para criar, acordar e terminar todas as tarefas",
						unit: "Tempo do programa inteiro, em [[ms|milissegundos]] ([[mean|média]] de 5 execuções, ± [[stddev|desvio padrão]]).",
						why: "Cada linguagem tem seu tipo de tarefa leve. As [[coroutine|corrotinas]] do C++, as [[async|tarefas assíncronas]] do Rust e as promises do TypeScript são pouco mais que uma anotação de onde a tarefa parou, então são muito rápidas. [[goroutine|Goroutines]] e [[beam-process|processos da BEAM]] carregam cada um um pequeno espaço particular, o que custa um pouco mais. As [[virtual-thread|virtual threads]] do Java são lentas aqui porque a [[vm|JVM]] acabou de iniciar e ainda não tornou esse código rápido ([[jit|JIT]]): em uma verificação à parte, o mesmo trabalho repetido em uma JVM já aquecida levou mais de 10 vezes menos. O C++ com uma [[thread|thread]] do sistema operacional por tarefa só pôde ter 10.000 tarefas, e ainda assim é lento, porque o sistema operacional precisa cuidar de cada thread.",
						careful:
							"Nenhuma tarefa faz trabalho de verdade aqui, então este gráfico não diz nada sobre a velocidade com que as tarefas rodariam. Ele também mede um início a frio. Um servidor que fica ligado por dias se comporta como o caso aquecido.",
					},
					"conc-memory": {
						title: "Memória usada por uma tarefa esperando",
						unit: "Bytes por tarefa: [[peak-memory|pico de memória]] a mais com todas as tarefas, dividido pelo número de tarefas.",
						why: "As menores tarefas só guardam onde pararam. Uma [[goroutine|goroutine]] e um [[beam-process|processo da BEAM]] começam com uns dois mil bytes próprios, prontos para crescer. Uma [[thread|thread]] do sistema operacional precisa de muito mais, porque o sistema reserva espaço para ela e mantém seus próprios registros.",
						careful:
							"Uma tarefa que faz trabalho de verdade precisa de mais memória que uma vazia. Estes são os preços de entrada. O número de uma linguagem com [[gc|coletor de lixo]] também depende de quando o coletor resolveu limpar.",
					},
				},
			},

			http: {
				title: "HTTP: um servidor sob pressão",
				lead: "Cada linguagem roda um pequeno [[server|servidor]] web. Um programa faz o papel de 32 usuários impacientes que não param de pedir, uma [[request|requisição]] atrás da outra.",
				what: "Quantas requisições o servidor responde a cada segundo ([[rps|requisições por segundo]]), quanto tempo cada resposta leva ([[latency|latência]]), e quanto de processador e [[memory|memória]] o servidor usa enquanto isso. Há dois tipos de requisição: uma envia um pequeno texto [[json|JSON]] e o recebe de volta, a outra pede ao servidor para contar [[prime|números primos]], o que o faz calcular.",
				analogy:
					"Uma cabine de pedágio em uma estrada. Requisições por segundo é quantos carros passam a cada segundo. Latência é quanto tempo um carro espera. Uma cabine pode deixar passar muitos carros e ainda assim fazer alguns azarados esperarem muito.",
				matters:
					"Todo site e aplicativo conversa com servidores como estes. Um servidor que responde mais requisições com o mesmo computador custa menos. Um servidor com esperas longas parece lento, mesmo sendo rápido na média.",
				read: "Use os botões para trocar o tipo de requisição. Em requisições por segundo, mais longa é melhor. Em latência, memória e CPU, mais curta é melhor. No gráfico de latência cada linguagem tem três barras: [[p50|p50]], [[p95|p95]] e [[p99|p99]].",
				charts: {
					"http-rps": {
						title: "Requisições respondidas por segundo",
						unit: "[[rps|Requisições por segundo]] ([[mean|média]] de 3 execuções de 10 segundos, ± [[stddev|desvio padrão]]). 32 [[vu|usuários virtuais]].",
						why: 'Na requisição pequena de eco quase todo servidor é mais rápido que o programa que envia as requisições. Esse programa estava usando a maior parte dos seus próprios 4 [[core|núcleos]] (veja "CPU do gerador de carga" na tabela), então as barras mais altas mostram principalmente o limite do teste, e a ordem entre elas é ruído. Python é a exceção: seu servidor roda o seu código em uma [[thread|thread]] e é [[interpreted|interpretada]], então ali o limite de verdade é o servidor. Troque para "Contar primos" e todo servidor precisa calcular: os que espalham as requisições pelos 4 núcleos e calculam rápido (Go, Rust, C++) continuam altos, enquanto TypeScript e Python só conseguem usar cerca de um núcleo.',
						careful:
							"Cada linguagem usa uma biblioteca de servidor diferente, e a biblioteca importa tanto quanto a linguagem. Python e TypeScript rodam do jeito padrão, com um processo. Na vida real as pessoas sobem várias cópias para usar todos os núcleos. E se a CPU do próprio gerador de carga está perto de 400 % (veja a tabela), a barra mostra o limite do gerador, não do servidor.",
					},
					"http-latency": {
						title: "Quanto tempo uma requisição espera",
						unit: "[[latency|Latência]] em [[ms|milissegundos]]: [[p50|p50]] (típica), [[p95|p95]] e [[p99|p99]] (as azaradas).",
						why: "Quando um servidor trabalha em uma requisição por vez, as outras fazem fila, como carros em uma cabine só. A fila faz todos esperarem mais. Servidores que espalham o trabalho por vários [[core|núcleos]] mantêm a fila curta. Um [[gc|coletor de lixo]] também pode pausar o servidor por um instante, e isso aparece no p99.",
						careful:
							"Os 32 usuários esperam a resposta antes de pedir de novo. Então um servidor lento também recebe menos requisições, e sua latência parece melhor do que seria com uma multidão de verdade, que não espera. Os tempos também incluem a viagem dentro do computador entre os dois programas.",
					},
					"http-cpu": {
						title: "O quanto o servidor ocupou o processador",
						unit: "CPU [[mean|média]] do servidor enquanto a carga rodava. 100 % é um [[core|núcleo]] totalmente ocupado.",
						why: "Uma barra perto de 100 % é de um servidor que roda em uma [[thread|thread]]: ele não consegue usar um segundo núcleo nem quando está sobrecarregado. Barras perto de 400 % são de servidores que espalham o trabalho pelos 4 núcleos permitidos. Um servidor que passou a maior parte do tempo esperando o gerador de carga enviar mais fica em algum ponto no meio.",
						careful:
							"Uma barra curta não é automaticamente boa. Usar pouca CPU e responder poucas requisições significa que o servidor não conseguiu usar a máquina. Leia este gráfico junto com o de requisições por segundo.",
					},
					"http-memory": {
						title: "Memória de que o servidor precisou",
						unit: "[[peak-memory|Pico de memória]] do servidor, em [[mib|MiB]], enquanto a carga rodava.",
						why: "Os servidores em C++, Rust e Go são um único programa pequeno. Java e Elixir carregam uma [[vm|máquina virtual]] inteira, e o Java reserva bastante memória de antemão para que seu [[gc|coletor de lixo]] trabalhe menos vezes. Python e TypeScript carregam o próprio runtime e as bibliotecas.",
						careful:
							"A memória foi amostrada uma vez por segundo, então um pico muito curto pode passar despercebido. Linguagens com coletor de lixo muitas vezes podem ser configuradas para usar menos memória, ao custo de alguma velocidade. Aqui foram usados os padrões.",
					},
				},
			},

			memory: {
				title: "Memória: o tamanho da mochila",
				lead: "Quanta [[memory|memória]] um programa carrega, e quem a arruma?",
				what: "Duas coisas. Primeiro, um programa que constrói e joga fora milhões de pedacinhos de dados organizados como [[binary-tree|árvores]]: medimos o máximo de memória que ele segurou em um momento ([[peak-memory|pico de memória]]) e o tempo. Segundo, um programa que inicia e para sem fazer nada: seu tempo é o [[startup|tempo de inicialização]] e sua memória é o mínimo de que aquela linguagem precisa.",
				analogy:
					"Uma mochila. Alguns alunos levam só o que o dia pede e guardam cada coisa assim que terminam (sem coletor). Outros jogam tudo dentro e arrumam de vez em quando ([[gc|coletor de lixo]]). O segundo jeito é mais fácil, mas a mochila fica maior.",
				matters:
					"Memória custa dinheiro na nuvem e é escassa em celulares e aparelhos pequenos. O tempo de inicialização importa para ferramentas pequenas que rodam milhares de vezes por dia.",
				read: "Barras mais curtas são melhores nos quatro gráficos. A memória está em [[mib|MiB]], o tempo em [[ms|milissegundos]]. Ao lado de cada nome dá para ver se a linguagem tem coletor de lixo.",
				charts: {
					"mem-trees-peak": {
						title: "Construindo milhões de pequenas árvores: máximo de memória",
						unit: "[[peak-memory|Pico de memória]] do programa, em [[mib|MiB]].",
						why: "C++ e Rust devolvem cada pedaço de memória no momento em que ele deixa de ser necessário, então seguram só o que está vivo. Linguagens com [[gc|coletor de lixo]] deixam o lixo acumular por um tempo antes de limpar, então o pico delas costuma ser mais alto. O Go limpa com frequência e fica perto de C++ e Rust. O Java reserva um espaço grande de antemão de propósito: com bastante espaço, seu coletor precisa trabalhar menos vezes.",
						careful:
							"Mais memória não é simplesmente pior. Um coletor que limpa raramente pode deixar o programa mais rápido. E a maioria das linguagens deixa ajustar isso. Só as configurações padrão foram medidas.",
					},
					"mem-trees-time": {
						title: "Construindo milhões de pequenas árvores: tempo",
						unit: "Tempo do programa inteiro, em [[ms|milissegundos]] ([[mean|média]] de 5 execuções, ± [[stddev|desvio padrão]]).",
						why: "Uma surpresa: algumas linguagens com [[gc|coletor de lixo]] podem ganhar de C++ e Rust aqui. Pedir memória é muito barato para elas (só pegam o próximo lugar livre), e jogar fora uma árvore de vida curta custa quase nada. C++ e Rust pedem ao sistema cada pedacinho e devolvem cada um. Alguns coletores também trabalham em outros [[core|núcleos]] ao mesmo tempo: veja o tempo de CPU na tabela, ele pode ser maior que o tempo do relógio.",
						careful:
							"Quem programa em C++ e Rust e precisa de velocidade aqui usa outras técnicas, como pegar um bloco grande de memória de uma vez. Este teste usa o jeito simples, do dia a dia, em todas as linguagens.",
					},
					"mem-idle-time": {
						title: "Um programa que não faz nada: tempo para iniciar",
						unit: "[[startup|Tempo de inicialização]] em [[ms|milissegundos]]: o programa inicia e termina em seguida.",
						why: "Um programa [[compiled|compilado]] está pronto no momento em que o sistema o carrega. Os outros primeiro precisam ligar a própria maquinaria: o Python seu interpretador, o Bun seu motor de JavaScript, Java e Elixir uma [[vm|máquina virtual]] inteira.",
						careful:
							"Isso só importa para programas que iniciam muitas vezes e vivem pouco. Um servidor que inicia uma vez e roda por meses não liga para uma fração de segundo.",
					},
					"mem-idle-peak": {
						title: "Um programa que não faz nada: memória",
						unit: "[[peak-memory|Pico de memória]] em [[mib|MiB]] de um programa que inicia e termina em seguida.",
						why: "Este é o tamanho da mochila vazia. Um programa compilado não traz quase nada consigo. Uma [[vm|máquina virtual]] ou um interpretador traz as próprias ferramentas: o tradutor, o [[gc|coletor de lixo]], a biblioteca padrão.",
						careful:
							"Algumas dezenas de MiB não importam em um notebook. Importam quando você roda milhares de programas pequenos ao mesmo tempo, ou em um aparelho minúsculo.",
					},
				},
			},

			build: {
				title: "Build: esperando o tradutor",
				lead: "Antes de algumas linguagens rodarem o seu programa, um tradutor precisa transformá-lo em outra coisa. Quanto tempo você espera?",
				what: 'O tempo para construir o mesmo programa pequeno (o dos planetas e dos primos, da seção de CPU). "A partir do nada" começa sem sobras de builds anteriores. "Depois de uma edição" muda uma linha e constrói de novo, que é o que quem programa faz centenas de vezes por dia. Cada barra diz o que a etapa realmente é, porque as linguagens não fazem todas a mesma coisa aqui.',
				analogy:
					"Um livro em outra língua. Você pode pagar um tradutor para traduzir o livro inteiro antes, e depois ler rápido ([[compiled|compilada]]). Ou pode ler com um dicionário na mão, traduzindo enquanto lê: começa na hora, mas lê mais devagar ([[interpreted|interpretada]]).",
				matters:
					"Quem programa muda alguma coisa, constrói e olha o resultado, o dia inteiro. Se cada build leva um minuto, o dia vai embora esperando. Foi por isso que o Go foi projetado para compilar rápido.",
				read: "Barras mais curtas são melhores. O número está em [[ms|milissegundos]]. Ao lado de cada nome está o que a etapa faz: transformar o programa em instruções do processador, em [[bytecode|bytecode]], ou só empacotá-lo em um arquivo ([[bundle|bundle]]).",
				charts: {
					"build-cold": {
						title: "Construindo a partir do nada",
						unit: "Tempo em [[ms|milissegundos]] ([[mean|média]] de 5 builds, ± [[stddev|desvio padrão]]), com todo resultado anterior apagado antes.",
						why: "C++, Rust e Go fazem o trabalho pesado agora: transformam o programa em instruções do processador e as deixam rápidas, para que rodar seja rápido depois. O C++ demora mesmo com um arquivo pequeno porque relê o texto de arquivos grandes de biblioteca a cada build. O Go também precisa preparar a própria biblioteca na primeira vez, porque seu depósito de peças prontas ([[cache|cache]]) foi esvaziado. Java e Elixir só traduzem para [[bytecode|bytecode]], uma forma intermediária, e deixam o resto para a [[vm|máquina virtual]] na hora de rodar. A maior parte da barra delas é o próprio tradutor iniciando. O Bun só empacota o arquivo, sem conferir os tipos. O Python não faz quase nada aqui: ele traduz enquanto roda.",
						careful:
							"Este é o outro lado do gráfico de CPU: as três linguagens que fazem a tradução de verdade aqui (C++, Rust, Go) foram as mais rápidas lá. O programa é um arquivo pequeno. Um projeto de verdade tem milhares de arquivos, e lá as diferenças são muito maiores e dependem das ferramentas tanto quanto da linguagem.",
					},
					"build-warm": {
						title: "Construindo de novo depois de mudar uma linha",
						unit: "Tempo em [[ms|milissegundos]] ([[mean|média]] de 5 builds, ± [[stddev|desvio padrão]]), depois de acrescentar uma linha ao programa.",
						why: "O Go guarda em um [[cache|cache]] as peças prontas que já construiu e só reconstrói o que mudou, então este build é bem mais rápido que o primeiro. O Rust também guarda as peças prontas da sua biblioteca, mas ainda reconstrói o arquivo inteiro do programa. Para as outras nada muda: com um arquivo só não há o que reaproveitar, então a tradução inteira roda de novo.",
						careful:
							"Com um arquivo há pouco a reaproveitar, então este gráfico mostra o mínimo que um build quente consegue economizar. Projetos grandes são divididos em muitas partes justamente para que uma edição reconstrua só uma parte.",
					},
				},
			},

			size: {
				title: "Tamanho: o que vai na caixa",
				lead: "Para entregar o seu programa a outra pessoa, o que você precisa pôr na caixa, e quanto ela pesa?",
				what: "Dois tamanhos em disco para o mesmo programa pequeno. O [[artifact|artefato]] é o que o build produz a partir do seu código. O [[runtime|runtime]] é todo o resto que precisa estar no outro computador para o artefato rodar, sem contar o sistema operacional.",
				analogy:
					"Um videogame. O cartucho é pequeno, mas não serve para nada sem o console. Algumas linguagens entregam só o cartucho e esperam que o console já esteja lá. Outras constroem o console dentro de cada cartucho.",
				matters:
					"Programas pequenos são mais rápidos de baixar, de iniciar e de copiar para muitas máquinas. E um programa que não precisa de nada instalado é muito mais fácil de entregar a alguém.",
				read: "Barras mais curtas são melhores. O primeiro gráfico é só o que você entrega. O segundo soma o que ele precisa para rodar. Compare os dois: uma linguagem pode ser a menor no primeiro e uma das maiores no segundo.",
				charts: {
					"size-artifact": {
						title: "O que você entrega",
						unit: "Tamanho em disco do [[artifact|artefato]]. 1 MiB são 1.024 KiB.",
						why: "Python e TypeScript entregam o texto do programa, e Java e Elixir entregam [[bytecode|bytecode]]: todos minúsculos, porque a maquinaria de verdade mora em outro lugar. Go e Rust põem a própria maquinaria dentro do programa (o Go até o [[gc|coletor de lixo]] e o gerente de tarefas), então o arquivo é maior. O C++ é pequeno porque pega emprestada a biblioteca do sistema.",
						careful:
							"Uma barra pequena aqui é metade da história: olhe o próximo gráfico antes de decidir quem é a menor. E nada foi espremido: os programas compilados ainda carregam informações para achar erros, que podem ser removidas.",
					},
					"size-total": {
						title: "O que você entrega mais o que ele precisa para rodar",
						unit: "Tamanho em disco do [[artifact|artefato]] mais o seu [[runtime|runtime]].",
						why: "Agora os consoles entram na conta. O Go não precisa de mais nada, então sua barra não muda. O Java precisa de uma máquina Java, o Python do interpretador e da biblioteca, o Bun do motor de JavaScript, o Elixir da máquina do Erlang. Esses têm o mesmo tamanho tenha o seu programa dez linhas ou um milhão.",
						careful:
							"O runtime é pago uma vez por computador, não uma vez por programa: dez programas Python dividem um Python. O sistema operacional e sua biblioteca C básica não são contados para ninguém. Um programa maior faria o primeiro gráfico crescer e deixaria o runtime igual.",
					},
				},
			},

			database: {
				title: "Banco de dados: perguntando ao bibliotecário",
				lead: "A maioria dos programas guarda seus dados em um [[database|banco de dados]]. Com que rapidez cada linguagem consegue fazer perguntas a ele?",
				what: "Cada programa conversa com o mesmo banco (PostgreSQL) e faz quatro coisas: insere 5.000 linhas uma a uma, lê cada linha pelo número, faz uma pergunta que exige filtrar e somar, e lê pelo número de novo com 8 workers de uma vez dividindo um [[pool|pool]] de conexões. Medimos operações por segundo, a [[latency|espera]] de cada operação, e o processador e a [[memory|memória]] que o programa usou.",
				analogy:
					"Uma biblioteca em que só o bibliotecário pode mexer nas estantes. Você anda até o balcão, pede um livro, espera, e anda de volta. A maior parte do tempo vai em andar e esperar, não na velocidade com que você fala. Um pool é como ter oito balcões abertos.",
				matters:
					"Em um site de verdade, o que costuma demorar é o banco de dados, não a linguagem. Esta seção mostra que linguagens que estavam cem vezes distantes no gráfico de CPU podem ficar quase lado a lado aqui.",
				read: "Use os botões para escolher o tipo de operação. Em operações por segundo, mais longa é melhor. Em latência, CPU e memória, mais curta é melhor. CPU e memória são do teste inteiro, então não mudam com os botões.",
				charts: {
					"db-ops": {
						title: "Operações por segundo",
						unit: "Operações por segundo ([[mean|média]] de 3 execuções, ± [[stddev|desvio padrão]]). Cada operação é uma [[round-trip|ida e volta]] ao banco.",
						why: "Toda operação é uma viagem ao banco e de volta, e o programa passa a maior parte do tempo esperando. Por isso as barras ficam bem mais próximas que na seção de CPU. O que ainda muda é o [[driver|driver]], a biblioteca que fala com o banco: quantas mensagens ele envia para uma pergunta, e se ele lembra de uma pergunta que já fez. Com 8 workers de uma vez, várias viagens acontecem ao mesmo tempo, então o total sobe na maioria das linguagens. Em Python ele cai: suas 8 threads passam o tempo disputando a [[gil|GIL]]. E o Rust, uma das linguagens mais rápidas desta página, fica entre as mais lentas em uma conexão: sua biblioteca faz mais trabalho em volta de cada pergunta.",
						careful:
							"Isto mede principalmente o driver e a viagem, não a linguagem. O banco roda no mesmo computador e guarda os dados em memória, então a viagem é muito mais curta que na vida real. Com uma rede de verdade, as barras ficariam ainda mais próximas.",
					},
					"db-latency": {
						title: "Quanto tempo uma operação espera",
						unit: "[[latency|Latência]] em [[ms|milissegundos]]: [[p50|p50]] (típica), [[p95|p95]] e [[p99|p99]] (as azaradas).",
						why: "A espera típica é o tempo de uma viagem mais o trabalho do banco. As esperas azaradas vêm de momentos em que outra coisa precisou do processador: outro programa na máquina, ou um [[gc|coletor de lixo]] arrumando a casa.",
						careful:
							"São frações de milissegundo. Diferenças tão pequenas são facilmente causadas pelos outros programas que rodavam na máquina, então não leia muita coisa na ordem.",
					},
					"db-cpu": {
						title: "Tempo de processador usado pelo programa cliente",
						unit: "[[cpu-time|Tempo de CPU]] em [[ms|milissegundos]] do teste inteiro (os quatro tipos de operação juntos).",
						why: "Enquanto espera o banco, um programa deveria usar quase nada de processador. O que ele usa vai em preparar cada pergunta e ler cada resposta. Uma linguagem [[interpreted|interpretada]] gasta mais nisso, e uma [[vm|máquina virtual]] também gasta tempo para iniciar e preparar seu código. A biblioteca também conta: a do Rust usou bastante tempo de processador aqui, embora a linguagem em si seja rápida.",
						careful:
							"Este é só o cliente. O banco fez a parte pesada e não está nesta barra. A inicialização de cada linguagem está incluída.",
					},
					"db-memory": {
						title: "Memória usada pelo programa cliente",
						unit: "[[peak-memory|Pico de memória]] do programa cliente, em [[mib|MiB]].",
						why: "Os dados aqui são minúsculos, então isto é quase a mochila vazia de cada linguagem de novo (veja a seção de Memória) mais a biblioteca de banco e 9 conexões abertas.",
						careful:
							"Um programa que lê resultados grandes precisaria de muito mais. Isto só mostra o preço de entrada.",
					},
				},
			},
		},

		glossary: {
			title: "Glossário",
			lead: "Todas as palavras com linha pontilhada desta página, explicadas em um lugar só.",
			terms: {
				benchmark: {
					term: "Benchmark",
					text: "Um teste justo: todos recebem a mesma tarefa e medimos o resultado, como tempo ou memória.",
				},
				core: {
					term: "Núcleo",
					text: "Um dos trabalhadores dentro do processador. Um processador com 8 núcleos consegue fazer 8 coisas exatamente no mesmo momento.",
				},
				memory: {
					term: "Memória (RAM)",
					text: "O espaço de mesa do computador. É onde um programa guarda as coisas que está usando agora. Ela é esvaziada quando o programa termina.",
				},
				ms: {
					term: "Milissegundo (ms)",
					text: "Um milésimo de segundo. Um piscar de olhos leva de 100 a 300 ms.",
				},
				mib: {
					term: "MiB (mebibyte)",
					text: "Uma unidade de memória: um pouco mais de um milhão de bytes. Uma foto de celular ocupa uns 3 MiB.",
				},
				mean: {
					term: "Média",
					text: "O tipo mais comum de média: some todos os resultados e divida por quantos são.",
				},
				stddev: {
					term: "Desvio padrão (±)",
					text: "Um número que diz o quanto os resultados mudam de uma execução para outra. Pequeno significa que as execuções foram parecidas. Se duas barras diferem menos que isso, trate-as como iguais.",
				},
				warmup: {
					term: "Aquecimento",
					text: "Uma primeira execução que é jogada fora, como alongar antes de uma corrida. Ela deixa o computador se preparar para que as execuções de verdade sejam justas.",
				},
				compiled: {
					term: "Compilada",
					text: "O programa é traduzido para as instruções do próprio processador antes de rodar. Traduzir leva tempo uma vez, e depois o programa roda rápido.",
				},
				interpreted: {
					term: "Interpretada",
					text: "Outro programa lê o seu código e o executa passo a passo enquanto roda. Fácil de mudar, mas mais lento para cálculo pesado.",
				},
				jit: {
					term: "JIT (just in time)",
					text: "Uma mistura dos dois: o programa começa sendo lido passo a passo, e as partes mais usadas são traduzidas para instruções rápidas enquanto ele roda.",
				},
				vm: {
					term: "Máquina virtual",
					text: "Um programa que finge ser um computador e roda o seu programa dentro dele. Ela cuida da memória e das tarefas para você.",
				},
				gc: {
					term: "Coletor de lixo",
					text: "Um ajudante dentro da linguagem que acha a memória que ninguém usa mais e a libera. Quem programa não precisa lembrar de limpar.",
				},
				thread: {
					term: "Thread",
					text: "Uma linha de trabalho dentro de um programa. Um programa com várias threads consegue fazer várias coisas ao mesmo tempo, cada uma em um núcleo.",
				},
				process: {
					term: "Processo",
					text: "Um programa inteiro em execução, com sua própria memória. Dois processos não conseguem mexer na memória um do outro.",
				},
				worker: {
					term: "Worker",
					text: "Um dos ajudantes que dividem um trabalho, para que ele termine antes. Pode ser uma thread ou um processo inteiro.",
				},
				task: {
					term: "Tarefa",
					text: "Um pequeno trabalho com começo e fim. Muitas tarefas podem estar em andamento ao mesmo tempo, mesmo que a maioria esteja esperando.",
				},
				goroutine: {
					term: "Goroutine",
					text: "A tarefa bem leve do Go. O próprio Go decide qual núcleo roda cada goroutine, então um programa pode ter centenas de milhares.",
				},
				"virtual-thread": {
					term: "Virtual thread",
					text: "A thread bem leve do Java. Quem cuida dela é a máquina do Java, não o sistema operacional, então custa pouco.",
				},
				"beam-process": {
					term: "Processo da BEAM",
					text: "A tarefa bem leve do Elixir. Ela não compartilha nada com as outras e conversa só enviando mensagens.",
				},
				coroutine: {
					term: "Corrotina",
					text: "Uma função que consegue parar no meio, deixar outra rodar, e continuar depois de onde parou.",
				},
				async: {
					term: "Tarefa assíncrona",
					text: 'Uma tarefa que diz "me chame quando estiver pronto" em vez de ficar parada enquanto espera. Enquanto isso a thread faz outro trabalho.',
				},
				"event-loop": {
					term: "Event loop",
					text: "Um trabalhador com uma lista de afazeres. Ele pega o próximo trabalhinho, faz, e pega o seguinte. É muito rápido enquanto os trabalhos são curtos, e tudo espera quando um trabalho é longo.",
				},
				gil: {
					term: "GIL",
					text: "Uma trava do Python que deixa só uma thread rodar código Python por vez, mesmo em um computador com muitos núcleos.",
				},
				speedup: {
					term: "Speed-up",
					text: "Quantas vezes mais rápido um trabalho fica com mais workers. Duas vezes mais rápido com dois workers é um speed-up de 2.",
				},
				efficiency: {
					term: "Eficiência",
					text: "Speed-up dividido pelo número de workers. 100 % significa que cada worker fez sua parte inteira. 50 % significa que metade do tempo deles foi desperdiçada.",
				},
				"cpu-time": {
					term: "Tempo de CPU",
					text: "O tempo de trabalho de todos os núcleos somado. Quatro núcleos ocupados por um segundo dão quatro segundos de tempo de CPU.",
				},
				"wall-time": {
					term: "Tempo de relógio",
					text: "O tempo que você leria em um relógio na parede, do começo ao fim.",
				},
				"peak-memory": {
					term: "Pico de memória",
					text: "O máximo de memória que o programa usou em um momento, como o mais cheia que a mochila chegou a ficar.",
				},
				startup: {
					term: "Tempo de inicialização",
					text: "O tempo de que um programa precisa para ficar pronto antes de fazer a primeira coisa útil.",
				},
				server: {
					term: "Servidor",
					text: "Um programa que espera requisições de outros programas e as responde. Os sites moram em servidores.",
				},
				request: {
					term: "Requisição",
					text: 'Uma pergunta enviada a um servidor, como "me mande esta página". O servidor devolve uma resposta.',
				},
				json: {
					term: "JSON",
					text: "Um jeito simples de escrever dados como texto, para que programas em linguagens diferentes se entendam.",
				},
				rps: {
					term: "Requisições por segundo",
					text: "Quantas requisições o servidor responde a cada segundo. Também se chama vazão (throughput). Mais é melhor.",
				},
				latency: {
					term: "Latência",
					text: "O tempo entre enviar uma requisição e receber a resposta. Menos é melhor.",
				},
				p50: {
					term: "p50 (mediana)",
					text: "Metade das requisições foi mais rápida que isso e metade foi mais lenta. É a espera típica.",
				},
				p95: {
					term: "p95",
					text: "95 de cada 100 requisições foram mais rápidas que isso. Só as 5 mais lentas esperaram mais.",
				},
				p99: {
					term: "p99",
					text: "99 de cada 100 requisições foram mais rápidas que isso. É a espera da única requisição azarada em cem.",
				},
				vu: {
					term: "Usuário virtual",
					text: "Um usuário de mentira criado pelo programa de teste. Ele envia uma requisição, espera a resposta, e envia a próxima.",
				},
				"n-body": {
					term: "N-body",
					text: "Um cálculo de como vários corpos no espaço, como o Sol e os planetas, se atraem e se movem.",
				},
				prime: {
					term: "Número primo",
					text: "Um número maior que 1 que só pode ser dividido por 1 e por ele mesmo, como 2, 3, 5, 7 e 11.",
				},
				sieve: {
					term: "Crivo",
					text: "Um método antigo para achar primos: escreva todos os números, depois risque os múltiplos de 2, de 3, de 5... O que sobra é primo.",
				},
				database: {
					term: "Banco de dados",
					text: 'Um programa cujo trabalho é guardar dados em segurança e responder perguntas sobre eles, como "quais itens custam menos de 10?".',
				},
				driver: {
					term: "Driver",
					text: "Uma biblioteca que deixa um programa conversar com um banco de dados. Ela transforma a sua pergunta nas mensagens que o banco entende.",
				},
				pool: {
					term: "Pool de conexões",
					text: "Algumas conexões com o banco mantidas abertas e compartilhadas. Abrir uma conexão é lento, então os programas pegam uma emprestada, usam e devolvem.",
				},
				query: {
					term: "Consulta",
					text: 'Uma pergunta ou uma ordem enviada a um banco de dados, como "me dê a linha 7" ou "acrescente esta linha".',
				},
				"round-trip": {
					term: "Ida e volta",
					text: "Enviar uma mensagem e esperar a resposta voltar. Cada viagem leva tempo mesmo quando o trabalho é minúsculo.",
				},
				bytecode: {
					term: "Bytecode",
					text: "Uma tradução pela metade de um programa: não é mais o texto que você escreveu, ainda não são instruções do processador. Uma máquina virtual o executa.",
				},
				bundle: {
					term: "Bundle",
					text: "Todos os arquivos de um programa empacotados em um arquivo só, para ser fácil de enviar e rápido de carregar.",
				},
				artifact: {
					term: "Artefato",
					text: "A coisa que um build produz e que você entrega a outra pessoa: um arquivo de programa, um pacote ou um bundle.",
				},
				runtime: {
					term: "Runtime",
					text: "A maquinaria de que um programa precisa ao redor para rodar, como um interpretador, uma máquina virtual ou um coletor de lixo.",
				},
				cache: {
					term: "Cache",
					text: "Um lugar onde resultados ficam guardados para que o mesmo trabalho não precise ser feito duas vezes.",
				},
				"binary-tree": {
					term: "Árvore binária",
					text: "Um jeito de organizar dados em que cada pedaço aponta para outros dois, como uma árvore genealógica de cabeça para baixo.",
				},
			},
		},

		methodology: {
			title: "Metodologia",
			lead: "Esta parte é para quem quer conferir o trabalho ou repeti-lo. As mesmas informações estão em benchmarks/README.pt-BR.md.",
			measuredAt: "Medido em:",
			databaseLabel: "Banco",
			blocks: [
				{
					title: "Como os números foram produzidos",
					items: [
						"Todo programa roda em um contêiner Docker construído de uma imagem fixada, sem rede. Os programas são compilados dentro da imagem, então nenhuma execução lê o programa por um bind mount.",
						"CPU, paralelismo, concorrência e memória usam o runner compartilhado do repositório (tools/bench): o hyperfine 2.0.0 roda cada comando 5 vezes depois de 1 execução de aquecimento descartada, dentro do contêiner, e registra tempo de relógio, tempo de CPU (usuário mais sistema) e pico de memória residente do processo inteiro. O programa também imprime o tempo do seu trecho medido, sem a inicialização.",
						"Os gráficos de tempo mostram o processo inteiro (média, com o intervalo das 5 execuções). As tabelas mostram também o trecho medido.",
						"O speed-up usa o trecho medido, porque a inicialização de um runtime não é trabalho paralelo. O runner lê o trecho uma vez só, então um pequeno coletor extra (scripts/collect-sections.ts) roda cada caso mais 5 vezes. Speed-up = tempo médio do trecho com 1 worker / médio com w workers. Eficiência = speed-up / w.",
						"Memória por tarefa = (pico de memória com n tarefas − pico de memória com 0 tarefas) / n.",
						"HTTP: cada servidor roda sozinho, limitado a 4 CPUs e 2 GiB, em uma rede interna do Docker sem porta publicada. O k6 2.3.0, também limitado a 4 CPUs, roda 32 usuários virtuais por 10 s, 3 vezes, cada uma depois de uma execução de aquecimento de 3 s. CPU e memória do contêiner do servidor são amostradas cerca de uma vez por segundo pelo docker stats enquanto o k6 envia carga. A primeira e a última amostra de cada execução são descartadas.",
						"Build: o hyperfine roda o comando de build 5 vezes com --prepare. O frio apaga a saída e o cache do compilador antes de cada execução (no Go, o cache de build inteiro). O quente acrescenta uma linha de comentário ao fonte antes de cada execução. O programa é o do cpu-single.",
						"Tamanho: tamanhos exatos de stat e du dentro das imagens. Runtime é o que precisa estar presente além do artefato, sem contar o sistema operacional e a glibc: libstdc++ e libgcc compartilhadas no C++, libgcc no Rust, nada no Go, um runtime do jlink com java.base no Java, o executável bun, o resto do mix release no Elixir, a instalação do CPython no Python.",
						"Banco de dados: PostgreSQL 18.6 com os dados em tmpfs, em uma rede interna do Docker, 4 CPUs para o servidor e 4 para o cliente. Cada cliente roda uma vez como aquecimento e 3 vezes medido: 5.000 inserts de uma linha, 5.000 leituras pela chave primária, 200 agregações com filtro, e depois 5.000 leituras pela chave a partir de 8 workers em um pool de 8 conexões. A latência é medida pelo cliente em volta de cada chamada. O tempo de CPU e o pico de memória são do próprio cliente, vindos do kernel.",
						"Antes de qualquer medição, testes conferem que as sete implementações imprimem o mesmo checksum para a mesma entrada, e que os sete servidores passam na mesma suíte de testes de protocolo.",
					],
				},
				{
					title: "Máquina",
					data: "machine",
					paragraphs: [
						"Todos os resultados vêm desta única máquina. O Docker roda dentro de uma máquina virtual (WSL 2), que acrescenta seu próprio custo e ruído.",
					],
				},
				{
					title: "Versões dos runtimes",
					data: "runtimes",
					paragraphs: [
						"As tags das imagens são fixadas, e toda biblioteca também (Cargo.lock, mix.lock, requirements.txt, URLs de download fixas).",
					],
				},
				{
					title: "Comandos exatos",
					data: "commands",
					paragraphs: [
						"Um comando reproduz tudo: ./setup-unix-benchmarks.sh ou ./setup-windows-benchmarks.ps1. Os comandos abaixo são o que rodou dentro de cada contêiner.",
					],
				},
				{
					title: "Como ler cada gráfico",
					items: [
						"Barras de tempo: mais curta é melhor. O traço é a mais rápida e a mais lenta das 5 execuções, e ± é o desvio padrão. As barras começam em zero e a escala é linear, então linguagens muito rápidas parecem um risquinho ao lado de uma lenta: leia o número.",
						"Speed-up: os dois eixos são logarítmicos na base 2. A diagonal tracejada é o speed-up linear. O host tem 8 núcleos físicos com SMT (16 lógicos), então o passo de 8 para 16 workers não consegue dobrar.",
						"Eficiência: speed-up dividido pelos workers, mostrada para 8 workers, o número de núcleos físicos.",
						"Requisições por segundo: mais longa é melhor. Confira a coluna de CPU do k6 na tabela: perto de 400 % o gerador de carga estava saturado e o servidor poderia ter feito mais.",
						"Latência: p50, p95 e p99 da duração da requisição vista pelo k6, média das 3 execuções. O modelo de carga é fechado (o usuário espera a resposta), então a latência sob sobrecarga é subestimada (omissão coordenada).",
						"CPU do servidor: 100 % é um núcleo. O limite de cada servidor é 400 %.",
						"Memória: pico do conjunto residente do processo (runner) ou maior amostra do docker stats do contêiner (HTTP).",
					],
				},
				{
					title: "Limites desta comparação",
					items: [
						"Ruído. Outros contêineres estavam rodando na mesma máquina durante a medição. As execuções são poucas (5, ou 3 no HTTP) e curtas. Trate uma diferença menor que a dispersão como nenhuma diferença, e não faça ranking de linguagens com barras próximas.",
						"Uma máquina, um dia, uma versão de cada runtime, configurações padrão. Sem flags da JVM, sem ajuste de GOGC, sem troca de alocador, sem otimização guiada por perfil.",
						"Programas pequenos escritos do jeito simples. Eles medem o runtime da linguagem em uma tarefa estreita, não aplicações reais, nem as bibliotecas que as pessoas usam para ir mais rápido (NumPy, arenas, SIMD).",
						"Os tempos do processo inteiro incluem a inicialização do runtime, que domina as execuções curtas das linguagens rápidas.",
						"O HTTP compara pilhas de servidor, não só linguagens: cpp-httplib, axum, net/http, o servidor do JDK, Bun.serve, Bandit e FastAPI no uvicorn. Python e Bun rodam um processo (o padrão deles) enquanto os outros usam 4 núcleos. Cliente e servidor dividem a máquina.",
						"A concorrência mede um início a frio. O resultado da JVM é dominado por código ainda não compilado pelo JIT. As threads de SO em C++ param em 10.000 porque 100.000 threads bateriam no limite de threads da máquina virtual do Docker, compartilhada com outros trabalhos.",
						"O paralelismo em Python usa processos criados com o método spawn, então o tempo inclui subir interpretadores.",
						"O tempo de build usa um programa de um arquivo, e Python, Bun, Java e Elixir não produzem código de máquina antes da hora, então as barras deles medem outra etapa. O tamanho do binário não conta nada do sistema operacional e nada passa por strip.",
						"O banco de dados mede principalmente o driver e uma ida e volta muito curta. Os drivers diferem em padrões que pesam mais que a linguagem, como preparar um comando uma vez ou a cada chamada. A libpq não tem pool, então a fase de pool em C++ usa uma conexão por thread.",
						"Velocidade, memória e CPU são só três das razões para escolher uma linguagem. Segurança, facilidade de escrever, bibliotecas e a experiência do time não estão em gráfico nenhum.",
					],
				},
			],
		},
	},

	es: {
		ui: {
			title: "Benchmark de lenguajes",
			languageSwitch: "Idioma de la página",
			navLabel: "Secciones",
			nav: {
				start: "Inicio",
				languages: "Lenguajes",
				cpu: "CPU",
				parallelism: "Paralelismo",
				concurrency: "Concurrencia",
				http: "HTTP",
				memory: "Memoria",
				build: "Compilación",
				size: "Tamaño",
				database: "Base de datos",
				glossary: "Glosario",
				methodology: "Metodología",
			},
			theme: { toDark: "Tema oscuro", toLight: "Tema claro" },
			filterTitle: "Elige los lenguajes que quieres comparar",
			filterHelp:
				"Desmarca un lenguaje para ocultarlo en todos los gráficos. Las frases bajo los gráficos también cambian.",
			what: "Qué se mide",
			analogy: "Piénsalo así",
			matters: "Por qué importa",
			read: "Cómo leer los gráficos",
			shows: "Qué muestra esto",
			why: "¿Por qué pasó esto?",
			careful: "¡Cuidado!",
			numbers: "Ver los números en una tabla",
			noData: "Ningún lenguaje seleccionado. Marca al menos un lenguaje en el filtro de arriba.",
			better: {
				lower: "Barra más corta = mejor",
				higher: "Barra más larga = mejor",
				diagonal: "Más cerca de la línea punteada = mejor",
			},
			gc: "recolector de basura",
			manual: "sin recolector",
			ideal: "perfecto",
			axes: { workers: "workers (cuántos trabajan al mismo tiempo)", speedup: "veces más rápido" },
			limits: { efficiency: "100 % = nada desperdiciado", cpu: "400 % = los 4 núcleos permitidos" },
			endpoint: {
				label: "Tipo de petición",
				rich: "Tipo de [[request|petición]]:",
				echo: "Eco JSON",
				primes: "Contar primos (CPU)",
			},
			models: {
				coroutines: "corrutinas",
				"os-threads": "threads del SO",
				"tokio-tasks": "tareas async",
				goroutines: "goroutines",
				"virtual-threads": "threads virtuales",
				promises: "promesas",
				processes: "procesos BEAM",
				"asyncio-tasks": "tareas asyncio",
			},
			steps: {
				"compile-and-link": "compilar a código de máquina",
				"compile-to-bytecode": "compilar a bytecode",
				"bundle-no-typecheck": "empaquetar, sin revisar tipos",
				"bytecode-automatic": "bytecode, normalmente automático",
			},
			phase: {
				label: "Tipo de operación",
				rich: "Tipo de [[query|operación]]:",
				insert: "Insertar filas",
				read: "Leer por clave",
				query: "Filtrar y sumar",
				pool: "Leer por clave, 8 a la vez",
			},
			artifacts: {
				cpp: "El programa como instrucciones del procesador. Toma prestada la biblioteca de C++ del sistema.",
				rust: "El programa como instrucciones del procesador, con la biblioteca propia de Rust dentro.",
				go: "El programa como instrucciones del procesador, con todo el runtime de Go dentro.",
				java: "Un jar: el programa como bytecode para la JVM.",
				ts: "Un archivo JavaScript con el programa.",
				elixir: "El programa como bytecode para la BEAM.",
				python: "El programa como texto. Python entrega el código fuente.",
			},
			runtimes: {
				cpp: "La biblioteca de C++ del sistema.",
				rust: "Una pequeña biblioteca auxiliar del sistema.",
				go: "Nada.",
				java: "Una máquina Java reducida al mínimo (hecha con jlink).",
				ts: "El programa Bun, con su motor de JavaScript.",
				elixir: "La máquina de Erlang y las bibliotecas de Erlang y Elixir.",
				python: "El intérprete de Python y su biblioteca estándar.",
			},
			captions: {
				single: "Solo {name} está seleccionado. Marca más lenguajes para comparar.",
				same: "{best} y {worst} quedaron más o menos igual aquí: la diferencia es menor que el ruido de la medición.",
				faster: "{best} terminó primero: unas {times} veces más rápido que {worst}, el más lento de aquí.",
				lighter: "{best} usó la menor memoria: unas {times} veces menos que {worst}, que usó la mayor.",
				more: "{best} respondió la mayor cantidad de peticiones: unas {times} veces más por segundo que {worst}.",
				efficiency:
					"{best} desperdició lo mínimo: sus workers se aprovecharon unas {times} veces mejor que los de {worst}.",
				cpu: "{best} mantuvo el procesador menos ocupado, unas {times} veces menos que {worst}. Poco solo es bueno si las peticiones se respondieron igual de rápido.",
				speedup:
					"Con {workers} workers, {best} se volvió unas {times} veces más rápido que con 1 worker. {worst} se volvió unas {worstTimes} veces más rápido. Lo perfecto sería {workers} veces.",
				latency:
					"La petición típica (p50) fue más rápida en {typical}: {p50}. Las peticiones con mala suerte (p99) esperaron menos en {tail}: {p99}.",
				smaller: "{best} es el más pequeño aquí: unas {times} veces menor que {worst}, el más grande.",
				moreOps:
					"{best} hizo la mayor cantidad de operaciones: unas {times} veces más por segundo que {worst}.",
				lessCpu:
					"{best} usó el menor tiempo de procesador en toda la prueba: unas {times} veces menos que {worst}.",
				dbLatency:
					"La operación típica (p50) fue más rápida en {typical}: {p50}. Las operaciones con mala suerte (p99) esperaron menos en {tail}: {p99}.",
			},
			tips: {
				time: "{name}\nPromedio de 5 ejecuciones: {mean}\nEjecución más rápida y más lenta: {low} a {high}\nSolo el trabajo, sin el arranque: {section}\nTiempo de CPU: {cpu}",
				memory: "{name}\nMayor memoria en uso en un momento: {value}",
				speedup:
					"{name}, {workers} workers\n{speedup} más rápido que con 1 worker\nEficiencia: {efficiency}\nTiempo del trabajo: {time}\nTiempo de CPU (todos los núcleos): {cpu}",
				efficiency:
					"{name}, {workers} workers\nEficiencia: {efficiency}\nSpeed-up: {speedup} (lo perfecto sería {workers}×)",
				tasks: "{name}\n{n} tareas esperando a la vez\nTiempo total: {mean}\nSolo el trabajo, sin el arranque: {section}\nMemoria máxima: {peak}\nMemoria por tarea: {each}",
				rps: "{name}\n{rps} en promedio\nEjecución más lenta y más rápida: {low} a {high}\nCPU del generador de carga: {k6} (cerca de 400 % es el límite)",
				latency:
					"{name}\nLa mitad de las peticiones tardó menos de {p50}\n95 de cada 100 tardaron menos de {p95}\n99 de cada 100 tardaron menos de {p99}",
				cpu: "{name}\nCPU promedio del servidor: {cpu}\nEso es cerca de {cores} de los 4 núcleos que puede usar",
				ops: "{name}\n{ops} en promedio\nEjecución más lenta y más rápida: {low} a {high}\nDriver: {driver}",
				clientCpu: "{name}\nTiempo de procesador usado por el programa cliente en toda la prueba: {cpu}",
				build: "{name}\nQué se mide: {step}\nDesde cero: {cold}\nDespués de cambiar una línea: {warm}\nComando: {command}",
				size: "{name}\nLo que entregas: {artifact}\nLo que necesita para ejecutarse: {runtime}\nJuntos: {total}\n{what}\nNecesita: {needs}",
			},
			tables: {
				language: "Lenguaje",
				process: "Programa completo",
				range: "Más rápida – más lenta (ms)",
				section: "Solo el trabajo",
				cpu: "Tiempo de CPU",
				peak: "Memoria máxima",
				workers: "Workers",
				sectionTime: "Tiempo del trabajo",
				speedup: "Speed-up",
				efficiency: "Eficiencia",
				model: "Tipo de tarea",
				tasks: "Tareas",
				total: "Tiempo total",
				perTask: "Memoria por tarea",
				rps: "Peticiones por segundo",
				meanCpu: "CPU promedio",
				k6Cpu: "CPU del generador de carga",
				step: "Qué se mide",
				cold: "Desde cero",
				warm: "Después de una edición",
				command: "Comando",
				artifact: "Lo que entregas",
				runtime: "Lo que necesita",
				totalSize: "Juntos",
				artifactIs: "El artefacto es",
				runtimeIs: "El runtime es",
				ops: "Operaciones por segundo",
				clientCpu: "Tiempo de CPU del cliente",
				clientMemory: "Memoria del cliente",
				driver: "Driver",
			},
			footer: "Datos generados el {date}. Todo lo de esta página se midió en una sola máquina, en un solo día. Ejecuta la suite en tu propio computador y los números serán diferentes.",
		},

		intro: {
			title: "Siete lenguajes de programación, la misma tarea",
			paragraphs: [
				"Un lenguaje de programación es una forma de decirle a un computador qué hacer. Aquí siete lenguajes recibieron exactamente las mismas tareas, y un [[benchmark|benchmark]] midió cómo se comportó cada uno: cuánto tardó, cuánta [[memory|memoria]] necesitó y qué tan ocupado mantuvo el [[core|procesador]].",
				"No hay un ganador de todo. Un lenguaje que es lento en un gráfico puede ser el más liviano en otro, y el más fácil de escribir no aparece en ningún gráfico. El objetivo de esta página es entender por qué las barras se ven como se ven.",
			],
			howTitle: "Cómo usar esta página",
			how: [
				"Las palabras con una línea punteada, como [[thread|thread]], tienen una explicación. Apúntalas, tócalas o llega a ellas con la tecla Tab.",
				"Cada gráfico dice en qué dirección es mejor y tiene una frase que lo lee por ti.",
				"La tarjeta verde explica por qué ocurrió el resultado. La tarjeta amarilla dice lo que el gráfico no demuestra.",
				'Apunta o toca una barra para ver más números. "Ver los números en una tabla" muestra todos.',
				"Todas las palabras difíciles están juntas en el glosario al final, y la metodología explica exactamente cómo se midió todo.",
			],
		},

		languages: {
			title: "Conoce los siete lenguajes",
			lead: "Cada lenguaje tiene su propia forma de convertir tu texto en algo que el procesador entiende, y su propia forma de hacer muchas cosas a la vez. Esas dos decisiones explican la mayoría de los gráficos de abajo.",
			fields: { what: "Qué es", runs: "Cómo se ejecuta", threads: "Cómo hace muchas cosas a la vez" },
			cards: {
				cpp: {
					what: "Un lenguaje de los años 80 usado para juegos, navegadores y sistemas operativos. Le da al programador control sobre cada detalle.",
					runs: "Es [[compiled|compilado]]: antes de que el programa se ejecute, un traductor lo convierte en instrucciones que el procesador sigue directamente. Arranca al instante.",
					threads:
						"Usa [[thread|threads]] del sistema operativo. Son potentes pero pesados, así que los programas usan pocos. También tiene [[coroutine|corrutinas]], tareas muy livianas, pero debes organizarlas tú mismo. No hay [[gc|recolector de basura]]: el programa libera su propia memoria.",
				},
				rust: {
					what: "Un lenguaje joven (2015) creado para ser tan rápido como C++ y a la vez negarse a construir programas con los errores de memoria más comunes.",
					runs: "Es [[compiled|compilado]] a instrucciones para el procesador, como C++. Arranca al instante.",
					threads:
						"Usa [[thread|threads]] del sistema operativo para calcular y [[async|tareas async]] muy livianas para esperar. No hay [[gc|recolector de basura]]: el compilador calcula, antes de que el programa se ejecute, cuándo se puede liberar cada trozo de memoria.",
				},
				go: {
					what: "Un lenguaje de Google (2009) hecho para servidores. Es pequeño y simple a propósito.",
					runs: "Es [[compiled|compilado]] a instrucciones para el procesador y arranca al instante. Un [[gc|recolector de basura]] limpia la memoria mientras el programa se ejecuta.",
					threads:
						"Tiene [[goroutine|goroutines]]: tareas diminutas que el propio Go reparte entre los [[core|núcleos]]. Iniciar cien mil de ellas es normal.",
				},
				java: {
					what: "Un lenguaje de 1995, muy común en bancos y grandes empresas.",
					runs: "Se ejecuta dentro de una [[vm|máquina virtual]], la JVM. La JVM arranca despacio, observa qué partes del programa se usan más y las convierte en instrucciones rápidas mientras se ejecuta ([[jit|JIT]]). Un [[gc|recolector de basura]] limpia la memoria.",
					threads:
						"Tiene [[thread|threads]] clásicos y, desde 2023, [[virtual-thread|threads virtuales]]: threads muy livianos administrados por la JVM, así que un programa puede tener muchos miles de ellos.",
				},
				ts: {
					what: "TypeScript es JavaScript, el lenguaje de las páginas web, con verificaciones adicionales. Aquí se ejecuta en Bun, un programa que ejecuta JavaScript fuera del navegador.",
					runs: "Bun lee el texto del programa y convierte las partes más usadas en instrucciones rápidas mientras se ejecuta ([[jit|JIT]]). Un [[gc|recolector de basura]] limpia la memoria.",
					threads:
						"Tu código se ejecuta en un solo [[thread|thread]] con un [[event-loop|event loop]]: hace una cosa pequeña a la vez y cambia muy rápido mientras espera. Para usar más [[core|núcleos]] tiene que iniciar workers separados.",
				},
				python: {
					what: "Un lenguaje de 1991 fácil de leer y escribir. Es el favorito para aprender, para la ciencia y para la inteligencia artificial.",
					runs: "Es [[interpreted|interpretado]]: un programa lee tu código y lo ejecuta paso a paso. Eso es flexible y lento para cálculos pesados. Los programas reales de Python le pasan la parte pesada a bibliotecas escritas en C.",
					threads:
						"Un candado llamado [[gil|GIL]] deja que solo un [[thread|thread]] ejecute código Python a la vez. Para calcular en varios [[core|núcleos]] inicia varios [[process|procesos]]. Para esperar muchas cosas usa un [[event-loop|event loop]].",
				},
				elixir: {
					what: "Un lenguaje de 2012 que se ejecuta en la máquina de Erlang, creada en los años 80 para centrales telefónicas que nunca deben detenerse.",
					runs: "Se ejecuta dentro de una [[vm|máquina virtual]], la BEAM, que también convierte el programa en instrucciones rápidas ([[jit|JIT]]). Cada tarea tiene su propia memoria y su propio [[gc|recolector de basura]].",
					threads:
						"Todo es un [[beam-process|proceso BEAM]]: una tarea diminuta que no comparte nada y habla enviando mensajes. La BEAM los reparte entre todos los [[core|núcleos]] y se asegura de que ninguna tarea se quede con un núcleo por demasiado tiempo.",
				},
			},
		},

		sections: {
			cpu: {
				title: "CPU: un worker pensando duro",
				lead: "¿Qué tan rápido puede calcular cada lenguaje cuando usa un solo [[core|núcleo]] del procesador?",
				what: "Dos cálculos. El primero mueve el Sol y cuatro planetas paso a paso, lo que es pura aritmética con números decimales ([[n-body|n-body]]). El segundo encuentra todos los [[prime|números primos]] hasta diez millones con un método llamado [[sieve|criba]]. El tiempo va desde el momento en que el programa arranca hasta el momento en que termina.",
				analogy:
					"Es un examen de matemáticas con las mismas preguntas para todos. Un estudiante, un lápiz y un cronómetro.",
				matters:
					"Los juegos, el video, la ciencia y la inteligencia artificial pasan su tiempo calculando. Si un lenguaje es diez veces más lento en esto, el mismo trabajo necesita diez veces más tiempo o diez veces más computadores.",
				read: "Cada barra es un lenguaje. Una barra más corta significa menos tiempo, así que más corta es mejor. El número está en [[ms|milisegundos]]. La línea negra delgada muestra la más rápida y la más lenta de las 5 ejecuciones.",
				charts: {
					"cpu-nbody": {
						title: "Mover los planetas un millón de pasos",
						unit: "Tiempo del programa completo, en [[ms|milisegundos]] ([[mean|promedio]] de 5 ejecuciones, ± [[stddev|desviación estándar]]).",
						why: "C++, Rust y Go son [[compiled|compilados]]: el procesador sigue sus instrucciones directamente. Java y TypeScript primero tienen que notar qué parte se usa más y traducirla mientras se ejecuta ([[jit|JIT]]), así que pierden un poco al principio. Python es [[interpreted|interpretado]]: por cada suma pequeña hace muchas verificaciones adicionales. Elixir nunca cambia un número en su lugar, crea números nuevos en cada paso, y eso cuesta tiempo.",
						careful:
							"Este es un cálculo pequeño, escrito de la forma simple en cada lenguaje. Los programas reales de Python usan bibliotecas como NumPy, que hacen esto en C y son mucho más rápidas de lo que sugiere este gráfico. El gráfico mide el lenguaje en sí, no lo que la gente construye con él.",
					},
					"cpu-sieve": {
						title: "Encontrar todos los números primos hasta diez millones",
						unit: "Tiempo del programa completo, en [[ms|milisegundos]] ([[mean|promedio]] de 5 ejecuciones, ± [[stddev|desviación estándar]]).",
						why: "Esta tarea escribe en una lista enorme de diez millones de casillas, así que la velocidad de la [[memory|memoria]] importa tanto como la velocidad de calcular. Por eso los lenguajes compilados quedan cerca unos de otros. Elixir no tiene una lista común que se pueda modificar en su lugar, así que usa una especial que es más lenta de alcanzar. La barra de Java incluye el tiempo que tarda en arrancar la [[vm|JVM]].",
						careful:
							"Las barras incluyen el [[startup|arranque]] de cada lenguaje. Para un trabajo tan corto, el arranque puede ser la mayor parte de la barra. La tabla muestra el tiempo del trabajo solo, y ahí el orden cambia.",
					},
				},
			},

			parallelism: {
				title: "Paralelismo: más workers, el mismo trabajo",
				lead: "Si un [[worker|worker]] tarda un rato, ¿dieciséis workers terminan dieciséis veces antes?",
				what: "Un trabajo grande: contar los [[prime|números primos]] por debajo de dos millones. Se corta en 256 pedazos y se le da a 1, 2, 4, 8 y luego 16 [[worker|workers]]. Medimos cuántas veces más rápido se vuelve el trabajo. Ese número es el [[speedup|speed-up]].",
				analogy:
					"Un cocinero hace 256 sándwiches. Con dos cocineros debería tardar la mitad del tiempo. Con dieciséis cocineros en una cocina con ocho estufas, empiezan a estorbarse unos a otros.",
				matters:
					"Hace años que los procesadores dejaron de ser mucho más rápidos. En cambio, tienen más [[core|núcleos]]. Un programa solo se beneficia si su lenguaje realmente puede usarlos todos.",
				read: "En el gráfico de líneas, la línea punteada es el resultado perfecto: el doble de workers, el doble de rápido. Una línea que se mantiene cerca de ella usa bien los núcleos. En el gráfico de barras, una [[efficiency|eficiencia]] del 100 % significa que ningún worker desperdició tiempo.",
				charts: {
					"par-speedup": {
						title: "Cuántas veces más rápido con más workers",
						unit: "[[speedup|Speed-up]]: tiempo con 1 worker dividido por el tiempo con más workers. Los dos ejes se duplican en cada paso.",
						why: "Ningún lenguaje alcanza la línea perfecta, por tres razones. Primero, el trabajo es corto, así que el tiempo para iniciar los workers y repartir los pedazos es una parte grande. Python inicia un [[process|proceso]] completamente nuevo por cada worker y TypeScript un worker separado con su propia memoria, y ambos son lentos de iniciar. Los demás solo inician un [[thread|thread]] liviano o una tarea. Segundo, esta máquina tiene 8 [[core|núcleos]] reales, y cada uno finge ser dos: los workers del 9 al 16 comparten un núcleo real con otro worker, así que aportan poco o incluso estorban. Tercero, otros programas estaban usando la misma máquina durante la prueba.",
						careful:
							"El speed-up dice qué tan bien usa un lenguaje más núcleos. No dice qué lenguaje es el más rápido. Un lenguaje lento puede tener un gran speed-up y aun así terminar último. La tabla muestra los tiempos reales. Un punto por encima de la línea punteada no es magia: es ruido en la medición, porque aquí nada puede superar lo perfecto.",
					},
					"par-efficiency": {
						title: "Cuánto de cada worker se usó realmente, con 8 workers",
						unit: "[[efficiency|Eficiencia]]: speed-up dividido por el número de workers, en porcentaje.",
						why: "La eficiencia baja cuando los workers esperan en lugar de trabajar: esperan a ser iniciados, esperan el siguiente pedazo o comparten un [[core|núcleo]]. El trabajo es corto para los lenguajes rápidos (unas pocas centésimas de segundo), así que el tiempo para iniciar los workers es una parte grande. Un trabajo más largo mostraría una eficiencia más alta para ellos.",
						careful:
							'Otros programas se estaban ejecutando en esta máquina durante la medición. Un vecino ocupado se lleva núcleos, y eso baja estas barras. Lee las diferencias de unos pocos puntos porcentuales como "lo mismo".',
					},
				},
			},

			concurrency: {
				title: "Concurrencia: cien mil tareas esperando",
				lead: "Calcular rápido es una habilidad. Llevar la cuenta de una enorme cantidad de cosas que en su mayoría están esperando es otra.",
				what: "El programa inicia 100.000 [[task|tareas]]. Cada una espera una señal, luego envía un mensaje y termina. No se calcula nada. Medimos el tiempo total y cuánta [[memory|memoria]] cuesta cada tarea que espera.",
				analogy:
					"Un mesero atiende cien mil mesas. Nadie está comiendo todavía, todos esperan a la cocina. Un buen mesero no necesita a una persona parada en cada mesa: le basta una libretita.",
				matters:
					"Una aplicación de chat o un servidor de juegos tiene muchos miles de personas conectadas, y casi todas están esperando en cualquier momento. Si cada persona que espera cuesta mucha memoria, el servidor se llena rápido.",
				read: "Las barras más cortas son mejores en ambos gráficos. El primero es el tiempo total en [[ms|milisegundos]]. El segundo es la memoria de una tarea en bytes (B). Mil bytes son más o menos una página de texto.",
				charts: {
					"conc-time": {
						title: "Tiempo para iniciar, despertar y terminar todas las tareas",
						unit: "Tiempo del programa completo, en [[ms|milisegundos]] ([[mean|promedio]] de 5 ejecuciones, ± [[stddev|desviación estándar]]).",
						why: "Cada lenguaje tiene su propio tipo de tarea liviana. Las [[coroutine|corrutinas]] de C++, las [[async|tareas async]] de Rust y las promesas de TypeScript son poco más que una nota que dice dónde se detuvo la tarea, así que son muy rápidas. Las [[goroutine|goroutines]] y los [[beam-process|procesos BEAM]] llevan cada uno un pequeño espacio privado, lo que cuesta un poco más. Los [[virtual-thread|threads virtuales]] de Java son lentos aquí porque la [[vm|JVM]] acaba de arrancar y todavía no ha hecho rápido este código ([[jit|JIT]]): en una verificación aparte, el mismo trabajo repetido en una JVM que ya estaba caliente tardó más de 10 veces menos. C++ con un [[thread|thread]] del sistema operativo por tarea solo pudo con 10.000 tareas, y aun así es lento, porque el sistema operativo tiene que administrar cada thread.",
						careful:
							"Ninguna tarea hace trabajo real aquí, así que este gráfico no dice nada sobre qué tan rápido se ejecutarían las tareas. Además mide un solo arranque en frío. Un servidor que sigue funcionando durante días se comporta como el caso caliente.",
					},
					"conc-memory": {
						title: "Memoria usada por una tarea que espera",
						unit: "Bytes por tarea: [[peak-memory|memoria máxima]] adicional con todas las tareas, dividida por el número de tareas.",
						why: "Las tareas más pequeñas solo guardan dónde se detuvieron. Una [[goroutine|goroutine]] y un [[beam-process|proceso BEAM]] empiezan con un par de miles de bytes propios, listos para crecer. Un [[thread|thread]] del sistema operativo necesita mucho más, porque el sistema le reserva espacio y lleva sus propios registros.",
						careful:
							"Una tarea que hace trabajo real necesita más memoria que una vacía. Estos son los precios iniciales. El número de un lenguaje con [[gc|recolector de basura]] también depende de cuándo decidió limpiar el recolector.",
					},
				},
			},

			http: {
				title: "HTTP: un servidor bajo presión",
				lead: "Cada lenguaje ejecuta un pequeño [[server|servidor]] web. Un programa hace el papel de 32 usuarios impacientes que no paran de preguntar, una [[request|petición]] tras otra.",
				what: "Cuántas peticiones responde el servidor cada segundo ([[rps|peticiones por segundo]]), cuánto tarda cada respuesta ([[latency|latencia]]) y cuánto procesador y [[memory|memoria]] usa el servidor mientras tanto. Hay dos tipos de petición: una envía un pequeño texto [[json|JSON]] y lo recibe de vuelta, la otra le pide al servidor que cuente [[prime|números primos]], lo que lo obliga a calcular.",
				analogy:
					"Una caseta de peaje en una carretera. Las peticiones por segundo son cuántos autos pasan cada segundo. La latencia es cuánto espera un auto. Una caseta puede dejar pasar muchos autos y aun así hacer esperar mucho a unos pocos con mala suerte.",
				matters:
					"Todos los sitios web y aplicaciones hablan con servidores como estos. Un servidor que responde más peticiones con el mismo computador cuesta menos. Un servidor con esperas largas se siente lento, aunque sea rápido en promedio.",
				read: "Usa los botones para cambiar el tipo de petición. En peticiones por segundo, más largo es mejor. En latencia, memoria y CPU, más corto es mejor. En el gráfico de latencia cada lenguaje tiene tres barras: [[p50|p50]], [[p95|p95]] y [[p99|p99]].",
				charts: {
					"http-rps": {
						title: "Peticiones respondidas por segundo",
						unit: "[[rps|Peticiones por segundo]] ([[mean|promedio]] de 3 ejecuciones de 10 segundos, ± [[stddev|desviación estándar]]). 32 [[vu|usuarios virtuales]].",
						why: 'En la petición de eco pequeña casi todos los servidores son más rápidos que el programa que envía las peticiones. Ese programa estaba usando la mayor parte de sus propios 4 [[core|núcleos]] (mira "CPU del generador de carga" en la tabla), así que las barras más altas muestran sobre todo el límite de la prueba, y su orden es ruido. Python es la excepción: su servidor ejecuta tu código en un solo [[thread|thread]] y es [[interpreted|interpretado]], así que ahí el servidor es el verdadero límite. Cambia a "Contar primos" y todos los servidores tienen que calcular: los que reparten las peticiones entre sus 4 núcleos y calculan rápido (Go, Rust, C++) se mantienen arriba, mientras que TypeScript y Python solo pueden usar un núcleo aproximadamente.',
						careful:
							"Cada lenguaje usa una biblioteca de servidor distinta, y la biblioteca importa tanto como el lenguaje. Python y TypeScript se ejecutan de la forma predeterminada, con un solo proceso. En la vida real la gente inicia varias copias para usar todos los núcleos. Y si la CPU del propio generador de carga está cerca de 400 % (mira la tabla), la barra muestra el límite del generador, no el del servidor.",
					},
					"http-latency": {
						title: "Cuánto espera una petición",
						unit: "[[latency|Latencia]] en [[ms|milisegundos]]: [[p50|p50]] (típica), [[p95|p95]] y [[p99|p99]] (las de mala suerte).",
						why: "Cuando un servidor trabaja en una petición a la vez, las demás hacen fila, como autos en una sola caseta. La fila hace que todos esperen más. Los servidores que reparten el trabajo entre varios [[core|núcleos]] mantienen la fila corta. Un [[gc|recolector de basura]] también puede pausar un servidor por un momento, y eso aparece en p99.",
						careful:
							"Los 32 usuarios esperan una respuesta antes de volver a preguntar. Entonces un servidor lento también recibe menos peticiones, y su latencia se ve mejor de lo que sería con una multitud real que no espera. Los tiempos también incluyen el viaje dentro del computador entre los dos programas.",
					},
					"http-cpu": {
						title: "Qué tan ocupado mantuvo el servidor al procesador",
						unit: "CPU [[mean|promedio]] del servidor mientras corría la carga. 100 % es un [[core|núcleo]] completamente ocupado.",
						why: "Una barra cerca de 100 % pertenece a un servidor que corre en un solo [[thread|thread]]: no puede usar un segundo núcleo ni siquiera cuando está sobrecargado. Las barras cerca de 400 % pertenecen a servidores que reparten el trabajo entre los 4 núcleos que se les permitieron. Un servidor que estuvo esperando sobre todo a que el generador de carga enviara más queda en algún punto intermedio.",
						careful:
							"Una barra corta no es automáticamente buena. Usar poca CPU y responder pocas peticiones significa que el servidor no pudo aprovechar la máquina. Lee este gráfico junto con las peticiones por segundo.",
					},
					"http-memory": {
						title: "Memoria que necesitó el servidor",
						unit: "[[peak-memory|Memoria máxima]] del servidor, en [[mib|MiB]], mientras corría la carga.",
						why: "Los servidores de C++, Rust y Go son un solo programa pequeño. Java y Elixir cargan toda una [[vm|máquina virtual]], y Java reserva mucha memoria por adelantado para que su [[gc|recolector de basura]] trabaje con menos frecuencia. Python y TypeScript cargan su propio runtime y sus bibliotecas.",
						careful:
							"La memoria se muestreó una vez por segundo, así que un pico muy corto puede pasar desapercibido. A los lenguajes con recolector de basura a menudo se les puede indicar que usen menos memoria, a costa de algo de velocidad. Aquí se usaron los valores predeterminados.",
					},
				},
			},

			memory: {
				title: "Memoria: el tamaño de la mochila",
				lead: "¿Cuánta [[memory|memoria]] carga un programa y quién la ordena?",
				what: "Dos cosas. Primero, un programa que construye y desecha millones de pequeños datos organizados como [[binary-tree|árboles]]: medimos la mayor cantidad de memoria que tuvo en un momento ([[peak-memory|memoria máxima]]) y el tiempo. Segundo, un programa que arranca y se detiene sin hacer nada: su tiempo es el [[startup|tiempo de arranque]] y su memoria es el mínimo que necesita ese lenguaje.",
				analogy:
					"Una mochila. Algunos estudiantes empacan solo lo que necesitan hoy y guardan cada cosa apenas terminan (sin recolector). Otros lo tiran todo adentro y ordenan de vez en cuando ([[gc|recolector de basura]]). La segunda forma es más fácil, pero la mochila se hace más grande.",
				matters:
					"La memoria cuesta dinero en la nube y es escasa en teléfonos y dispositivos pequeños. El tiempo de arranque importa para herramientas pequeñas que se ejecutan miles de veces al día.",
				read: "Las barras más cortas son mejores en los cuatro gráficos. La memoria está en [[mib|MiB]], el tiempo en [[ms|milisegundos]]. Junto a cada nombre puedes ver si el lenguaje tiene recolector de basura.",
				charts: {
					"mem-trees-peak": {
						title: "Construir millones de árboles pequeños: mayor memoria retenida",
						unit: "[[peak-memory|Memoria máxima]] del programa, en [[mib|MiB]].",
						why: "C++ y Rust devuelven cada trozo de memoria en el momento en que ya no se necesita, así que retienen solo lo que está vivo. Los lenguajes con [[gc|recolector de basura]] dejan que la basura se acumule un rato antes de limpiar, así que su pico suele ser más alto. Go limpia con frecuencia y se mantiene cerca de C++ y Rust. Java reserva un espacio grande por adelantado a propósito: con mucho espacio, su recolector tiene que trabajar con menos frecuencia.",
						careful:
							"Más memoria no es simplemente peor. Un recolector que limpia poco puede hacer que el programa sea más rápido. Y la mayoría de los lenguajes permiten ajustar esto. Solo se midieron los valores predeterminados.",
					},
					"mem-trees-time": {
						title: "Construir millones de árboles pequeños: tiempo",
						unit: "Tiempo del programa completo, en [[ms|milisegundos]] ([[mean|promedio]] de 5 ejecuciones, ± [[stddev|desviación estándar]]).",
						why: "Una sorpresa: algunos lenguajes con [[gc|recolector de basura]] pueden superar a C++ y a Rust aquí. Pedir memoria les sale muy barato (simplemente toman el siguiente lugar libre), y desechar un árbol de vida corta casi no cuesta nada. C++ y Rust le piden al sistema cada trozo pequeño y devuelven cada uno. Algunos recolectores también trabajan en otros [[core|núcleos]] al mismo tiempo: mira el tiempo de CPU en la tabla, puede ser mayor que el tiempo del reloj.",
						careful:
							"Los programadores de C++ y Rust que necesitan velocidad aquí usan otras técnicas, como tomar un solo bloque grande de memoria de una vez. Esta prueba usa la forma simple y cotidiana en cada lenguaje.",
					},
					"mem-idle-time": {
						title: "Un programa que no hace nada: tiempo de arranque",
						unit: "[[startup|Tiempo de arranque]] en [[ms|milisegundos]]: el programa arranca y termina de inmediato.",
						why: "Un programa [[compiled|compilado]] está listo en el momento en que el sistema lo carga. Los demás primero tienen que poner en marcha su propia maquinaria: Python su intérprete, Bun su motor de JavaScript, Java y Elixir toda una [[vm|máquina virtual]].",
						careful:
							"Esto solo importa para programas que arrancan a menudo y viven poco. A un servidor que arranca una vez y funciona durante meses no le importa una fracción de segundo.",
					},
					"mem-idle-peak": {
						title: "Un programa que no hace nada: memoria",
						unit: "[[peak-memory|Memoria máxima]] en [[mib|MiB]] de un programa que arranca y termina de inmediato.",
						why: "Este es el tamaño de la mochila vacía. Un programa compilado casi no trae nada consigo. Una [[vm|máquina virtual]] o un intérprete trae sus propias herramientas: el traductor, el [[gc|recolector de basura]], la biblioteca estándar.",
						careful:
							"Unas pocas decenas de MiB no importan en un portátil. Importan cuando ejecutas miles de programas pequeños a la vez, o en un dispositivo diminuto.",
					},
				},
			},

			build: {
				title: "Compilación: esperar al traductor",
				lead: "Antes de que algunos lenguajes puedan ejecutar tu programa, un traductor tiene que convertirlo en otra cosa. ¿Cuánto esperas?",
				what: 'El tiempo para compilar el mismo programa pequeño (el de los planetas y los primos de la sección de CPU). "Desde cero" empieza sin restos de compilaciones anteriores. "Después de una edición" cambia una línea y compila otra vez, que es lo que un programador hace cientos de veces al día. Cada barra dice qué es realmente el paso, porque no todos los lenguajes hacen lo mismo aquí.',
				analogy:
					"Un libro en un idioma extranjero. Puedes pagarle a un traductor para que traduzca primero todo el libro y luego leerlo rápido ([[compiled|compilado]]). O puedes leer con un diccionario en la mano, traduciendo sobre la marcha: empiezas de inmediato, pero lees más despacio ([[interpreted|interpretado]]).",
				matters:
					"Un programador cambia algo, compila y mira el resultado, todo el día. Si cada compilación tarda un minuto, el día se va esperando. Por eso Go se diseñó para compilar rápido.",
				read: "Las barras más cortas son mejores. El número está en [[ms|milisegundos]]. Junto a cada nombre está lo que hace el paso: convertir el programa en instrucciones del procesador, en [[bytecode|bytecode]], o solo empaquetarlo en un archivo ([[bundle|bundle]]).",
				charts: {
					"build-cold": {
						title: "Compilar desde cero",
						unit: "Tiempo en [[ms|milisegundos]] ([[mean|promedio]] de 5 compilaciones, ± [[stddev|desviación estándar]]), con todo resultado anterior borrado antes.",
						why: "C++, Rust y Go hacen el trabajo duro ahora: convierten el programa en instrucciones del procesador y las hacen rápidas, para que ejecutar sea veloz después. C++ es lento incluso para un archivo pequeño porque vuelve a leer el texto de archivos grandes de bibliotecas en cada compilación. Go también tiene que preparar su propia biblioteca la primera vez, porque se vació su almacén de piezas ya hechas ([[cache|caché]]). Java y Elixir solo traducen a [[bytecode|bytecode]], una forma intermedia, y dejan el resto a su [[vm|máquina virtual]] en tiempo de ejecución. La mayor parte de su barra es el propio traductor arrancando. Bun solo empaqueta el archivo, sin revisar los tipos. Python casi no hace nada aquí: traduce mientras se ejecuta.",
						careful:
							"Este es el otro lado del gráfico de CPU: los tres lenguajes que hacen la traducción real aquí (C++, Rust, Go) fueron los más rápidos allá. El programa es un solo archivo pequeño. Un proyecto real tiene miles de archivos, y ahí las diferencias son mucho mayores y dependen tanto de las herramientas como del lenguaje.",
					},
					"build-warm": {
						title: "Compilar otra vez después de cambiar una línea",
						unit: "Tiempo en [[ms|milisegundos]] ([[mean|promedio]] de 5 compilaciones, ± [[stddev|desviación estándar]]), después de agregar una línea al programa.",
						why: "Go guarda en una [[cache|caché]] las piezas ya hechas que construyó y solo reconstruye lo que cambió, así que esta compilación es mucho más rápida que la primera. Rust también guarda las piezas ya hechas de su biblioteca, pero aun así reconstruye todo el archivo del programa. Para los demás nada cambia: con un solo archivo no hay nada que reutilizar, así que toda la traducción se ejecuta de nuevo.",
						careful:
							"Con un solo archivo hay poco que reutilizar, así que este gráfico muestra lo mínimo que puede ahorrar una compilación en caliente. Los proyectos grandes se dividen en muchas piezas precisamente para que una edición reconstruya solo una pieza.",
					},
				},
			},

			size: {
				title: "Tamaño: qué entra en la caja",
				lead: "Para entregarle tu programa a otra persona, ¿qué tienes que meter en la caja y cuánto pesa?",
				what: "Dos tamaños en disco para el mismo programa pequeño. El [[artifact|artefacto]] es lo que la compilación produce a partir de tu código. El [[runtime|runtime]] es todo lo demás que debe estar en el otro computador para que el artefacto se ejecute, sin contar el sistema operativo.",
				analogy:
					"Un videojuego. El cartucho es pequeño, pero no sirve sin la consola. Algunos lenguajes te dan solo el cartucho y esperan que la consola esté ahí. Otros construyen la consola dentro de cada cartucho.",
				matters:
					"Los programas pequeños son más rápidos de descargar, de iniciar y de copiar a muchas máquinas. Y un programa que no necesita nada instalado es mucho más fácil de entregar a alguien.",
				read: "Las barras más cortas son mejores. El primer gráfico es solo lo que entregas. El segundo suma lo que necesita para ejecutarse. Compara los dos: un lenguaje puede ser el más pequeño en el primero y uno de los más grandes en el segundo.",
				charts: {
					"size-artifact": {
						title: "Lo que entregas",
						unit: "Tamaño en disco del [[artifact|artefacto]]. 1 MiB son 1.024 KiB.",
						why: "Python y TypeScript entregan el texto del programa, y Java y Elixir entregan [[bytecode|bytecode]]: todos son diminutos, porque la maquinaria real vive en otro lugar. Go y Rust ponen su propia maquinaria dentro del programa (Go incluso su [[gc|recolector de basura]] y su administrador de tareas), así que el archivo es más grande. C++ es pequeño porque toma prestada su biblioteca del sistema.",
						careful:
							"Una barra pequeña aquí es la mitad de la historia: mira el siguiente gráfico antes de decidir quién es el más pequeño. Y nada se comprimió: los programas compilados todavía llevan información para encontrar errores, que se puede quitar.",
					},
					"size-total": {
						title: "Lo que entregas más lo que necesita para ejecutarse",
						unit: "Tamaño en disco del [[artifact|artefacto]] más su [[runtime|runtime]].",
						why: "Ahora sí se cuentan las consolas. Go no necesita nada más, así que su barra no cambia. Java necesita una máquina Java, Python su intérprete y su biblioteca, Bun su motor de JavaScript, Elixir la máquina de Erlang. Eso mide lo mismo si tu programa tiene diez líneas o un millón.",
						careful:
							"El runtime se paga una vez por computador, no una vez por programa: diez programas de Python comparten un solo Python. El sistema operativo y su biblioteca básica de C no se cuentan para nadie. Un programa más grande haría crecer el primer gráfico y dejaría igual el runtime.",
					},
				},
			},

			database: {
				title: "Base de datos: preguntarle al bibliotecario",
				lead: "La mayoría de los programas guardan sus datos en una [[database|base de datos]]. ¿Qué tan rápido puede hacerle preguntas cada lenguaje?",
				what: "Cada programa habla con la misma base de datos (PostgreSQL) y hace cuatro cosas: insertar 5.000 filas una por una, leer cada fila por su número, hacer una pregunta que necesita filtrar y sumar, y volver a leer por número con 8 workers a la vez que comparten un [[pool|pool]] de conexiones. Medimos las operaciones por segundo, la [[latency|espera]] de cada operación y el procesador y la [[memory|memoria]] que usó el programa.",
				analogy:
					"Una biblioteca donde solo el bibliotecario puede tocar los estantes. Caminas hasta el mostrador, pides un libro, esperas y vuelves. La mayor parte del tiempo se va en caminar y esperar, no en qué tan rápido hablas. Un pool es como tener ocho mostradores abiertos.",
				matters:
					"En un sitio web real, lo que suele tardar es la base de datos, no el lenguaje. Esta sección muestra que lenguajes que estaban a cien veces de distancia en el gráfico de CPU pueden quedar casi lado a lado aquí.",
				read: "Usa los botones para elegir el tipo de operación. En operaciones por segundo, más largo es mejor. En latencia, CPU y memoria, más corto es mejor. La CPU y la memoria pertenecen a toda la prueba, así que no cambian con los botones.",
				charts: {
					"db-ops": {
						title: "Operaciones por segundo",
						unit: "Operaciones por segundo ([[mean|promedio]] de 3 ejecuciones, ± [[stddev|desviación estándar]]). Cada operación es un [[round-trip|viaje de ida y vuelta]] a la base de datos.",
						why: "Cada operación es un viaje a la base de datos y de vuelta, y el programa espera la mayor parte del tiempo. Por eso las barras están mucho más cerca unas de otras que en la sección de CPU. Lo que todavía difiere es el [[driver|driver]], la biblioteca que habla con la base de datos: cuántos mensajes envía por una pregunta y si recuerda una pregunta que ya hizo. Con 8 workers a la vez, varios viajes ocurren al mismo tiempo, así que el total sube en la mayoría de los lenguajes. Python baja en cambio: sus 8 threads pasan el tiempo peleando por el [[gil|GIL]]. Y Rust, uno de los lenguajes más rápidos de esta página, está entre los más lentos con una sola conexión: su biblioteca hace más trabajo alrededor de cada pregunta.",
						careful:
							"Esto mide sobre todo el driver y el viaje, no el lenguaje. La base de datos corre en el mismo computador y guarda sus datos en memoria, así que el viaje es mucho más corto que en la vida real. Con una red real, las barras estarían todavía más cerca.",
					},
					"db-latency": {
						title: "Cuánto espera una operación",
						unit: "[[latency|Latencia]] en [[ms|milisegundos]]: [[p50|p50]] (típica), [[p95|p95]] y [[p99|p99]] (las de mala suerte).",
						why: "La espera típica es el tiempo de un viaje más el trabajo de la base de datos. Las esperas de mala suerte vienen de momentos en que otra cosa necesitó el procesador: otro programa en la máquina, o un [[gc|recolector de basura]] ordenando.",
						careful:
							"Son fracciones de milisegundo. Diferencias tan pequeñas se causan fácilmente por los otros programas que se estaban ejecutando en la máquina, así que no le des mucha importancia al orden.",
					},
					"db-cpu": {
						title: "Tiempo de procesador usado por el programa cliente",
						unit: "[[cpu-time|Tiempo de CPU]] en [[ms|milisegundos]] de toda la prueba (los cuatro tipos de operación juntos).",
						why: "Mientras espera a la base de datos, un programa debería usar casi nada de procesador. Lo que sí usa se va en preparar cada pregunta y leer cada respuesta. Un lenguaje [[interpreted|interpretado]] gasta más en eso, y una [[vm|máquina virtual]] además gasta tiempo arrancando y preparando su código. La biblioteca también cuenta: la de Rust usó mucho tiempo de procesador aquí aunque el lenguaje en sí es rápido.",
						careful:
							"Esto es solo el cliente. La base de datos hizo la parte pesada y no está en esta barra. Se incluye el arranque de cada lenguaje.",
					},
					"db-memory": {
						title: "Memoria usada por el programa cliente",
						unit: "[[peak-memory|Memoria máxima]] del programa cliente, en [[mib|MiB]].",
						why: "Los datos aquí son diminutos, así que esto es casi otra vez la mochila vacía de cada lenguaje (mira la sección de Memoria) más su biblioteca de base de datos y 9 conexiones abiertas.",
						careful:
							"Un programa que lee resultados grandes necesitaría mucha más. Esto solo muestra el precio inicial.",
					},
				},
			},
		},

		glossary: {
			title: "Glosario",
			lead: "Todas las palabras con una línea punteada de esta página, explicadas en un solo lugar.",
			terms: {
				benchmark: {
					term: "Benchmark",
					text: "Una prueba justa: todos reciben la misma tarea y medimos el resultado, como el tiempo o la memoria.",
				},
				core: {
					term: "Núcleo",
					text: "Uno de los trabajadores dentro del procesador. Un procesador con 8 núcleos puede hacer 8 cosas exactamente al mismo tiempo.",
				},
				memory: {
					term: "Memoria (RAM)",
					text: "El espacio de escritorio del computador. Es donde un programa guarda las cosas que está usando ahora mismo. Se vacía cuando el programa termina.",
				},
				ms: {
					term: "Milisegundo (ms)",
					text: "Una milésima de segundo. Un parpadeo dura entre 100 y 300 ms.",
				},
				mib: {
					term: "MiB (mebibyte)",
					text: "Una unidad de memoria: un poco más de un millón de bytes. Una foto de un teléfono ocupa unos 3 MiB.",
				},
				mean: {
					term: "Promedio",
					text: "El tipo habitual de promedio: se suman todos los resultados y se divide por cuántos hay.",
				},
				stddev: {
					term: "Desviación estándar (±)",
					text: "Un número que dice cuánto cambian los resultados de una ejecución a la siguiente. Pequeño significa que las ejecuciones fueron parecidas. Si dos barras difieren en menos que esto, trátalas como iguales.",
				},
				warmup: {
					term: "Calentamiento",
					text: "Una primera ejecución que se descarta, como estirarse antes de una carrera. Deja que el computador se prepare para que las ejecuciones reales sean justas.",
				},
				compiled: {
					term: "Compilado",
					text: "El programa se traduce a las instrucciones propias del procesador antes de ejecutarse. Traducir toma tiempo una sola vez, y luego el programa corre rápido.",
				},
				interpreted: {
					term: "Interpretado",
					text: "Otro programa lee tu código y lo ejecuta paso a paso mientras corre. Es fácil de cambiar, pero más lento para cálculos pesados.",
				},
				jit: {
					term: "JIT (just in time)",
					text: "Una mezcla de ambos: el programa empieza leyéndose paso a paso, y las partes más usadas se traducen a instrucciones rápidas mientras se ejecuta.",
				},
				vm: {
					term: "Máquina virtual",
					text: "Un programa que finge ser un computador y ejecuta tu programa dentro de él. Se encarga de la memoria y de las tareas por ti.",
				},
				gc: {
					term: "Recolector de basura",
					text: "Un ayudante dentro del lenguaje que encuentra la memoria que nadie usa más y la libera. El programador no necesita acordarse de limpiar.",
				},
				thread: {
					term: "Thread",
					text: "Una línea de trabajo dentro de un programa. Un programa con varios threads puede hacer varias cosas a la vez, cada una en un núcleo distinto.",
				},
				process: {
					term: "Proceso",
					text: "Un programa completo en ejecución, con su propia memoria. Dos procesos no pueden tocar la memoria del otro.",
				},
				worker: {
					term: "Worker",
					text: "Uno de los ayudantes que se reparten un trabajo, para que el trabajo termine antes. Puede ser un thread o un proceso completo.",
				},
				task: {
					term: "Tarea",
					text: "Un trabajo pequeño con un principio y un final. Muchas tareas pueden estar en curso a la vez, aunque la mayoría esté esperando.",
				},
				goroutine: {
					term: "Goroutine",
					text: "La tarea muy liviana de Go. El propio Go decide qué núcleo ejecuta cada goroutine, así que un programa puede tener cientos de miles.",
				},
				"virtual-thread": {
					term: "Thread virtual",
					text: "El thread muy liviano de Java. La máquina Java, no el sistema operativo, se encarga de él, así que cuesta poco.",
				},
				"beam-process": {
					term: "Proceso BEAM",
					text: "La tarea muy liviana de Elixir. No comparte nada con las demás y habla solo enviando mensajes.",
				},
				coroutine: {
					term: "Corrutina",
					text: "Una función que puede detenerse a la mitad, dejar que otra se ejecute y continuar después desde donde se detuvo.",
				},
				async: {
					term: "Tarea async",
					text: 'Una tarea que dice "llámame cuando esté listo" en lugar de quedarse quieta mientras espera. Mientras tanto, el thread hace otro trabajo.',
				},
				"event-loop": {
					term: "Event loop",
					text: "Un worker con una lista de pendientes. Toma el siguiente trabajo pequeño, lo hace y toma el siguiente. Es muy rápido mientras los trabajos son cortos, y todo espera cuando un trabajo es largo.",
				},
				gil: {
					term: "GIL",
					text: "Un candado de Python que deja que solo un thread ejecute código Python a la vez, incluso en un computador con muchos núcleos.",
				},
				speedup: {
					term: "Speed-up",
					text: "Cuántas veces más rápido se vuelve un trabajo con más workers. El doble de rápido con dos workers es un speed-up de 2.",
				},
				efficiency: {
					term: "Eficiencia",
					text: "Speed-up dividido por el número de workers. 100 % significa que cada worker hizo una parte completa. 50 % significa que la mitad de su tiempo se desperdició.",
				},
				"cpu-time": {
					term: "Tiempo de CPU",
					text: "El tiempo de trabajo de todos los núcleos sumado. Cuatro núcleos ocupados durante un segundo hacen cuatro segundos de tiempo de CPU.",
				},
				"wall-time": {
					term: "Tiempo de reloj",
					text: "El tiempo que leerías en un reloj de pared, desde el comienzo hasta el final.",
				},
				"peak-memory": {
					term: "Memoria máxima",
					text: "La mayor memoria que el programa usó en un solo momento, como lo más lleno que llegó a estar la mochila.",
				},
				startup: {
					term: "Tiempo de arranque",
					text: "El tiempo que un programa necesita para prepararse antes de hacer su primera cosa útil.",
				},
				server: {
					term: "Servidor",
					text: "Un programa que espera peticiones de otros programas y las responde. Los sitios web viven en servidores.",
				},
				request: {
					term: "Petición",
					text: 'Una pregunta enviada a un servidor, como "envíame esta página". El servidor devuelve una respuesta.',
				},
				json: {
					term: "JSON",
					text: "Una forma simple de escribir datos como texto, para que programas en lenguajes distintos puedan entenderse.",
				},
				rps: {
					term: "Peticiones por segundo",
					text: "Cuántas peticiones responde el servidor cada segundo. También se llama throughput. Más es mejor.",
				},
				latency: {
					term: "Latencia",
					text: "El tiempo entre enviar una petición y recibir la respuesta. Menos es mejor.",
				},
				p50: {
					term: "p50 (mediana)",
					text: "La mitad de las peticiones fueron más rápidas que esto y la otra mitad más lentas. Es la espera típica.",
				},
				p95: {
					term: "p95",
					text: "95 de cada 100 peticiones fueron más rápidas que esto. Solo las 5 más lentas esperaron más.",
				},
				p99: {
					term: "p99",
					text: "99 de cada 100 peticiones fueron más rápidas que esto. Es la espera de la petición con mala suerte entre cien.",
				},
				vu: {
					term: "Usuario virtual",
					text: "Un usuario de mentira creado por el programa de prueba. Envía una petición, espera la respuesta y envía la siguiente.",
				},
				"n-body": {
					term: "N-body",
					text: "Un cálculo de cómo varios cuerpos en el espacio, como el Sol y los planetas, se atraen entre sí y se mueven.",
				},
				prime: {
					term: "Número primo",
					text: "Un número mayor que 1 que solo se puede dividir por 1 y por sí mismo, como 2, 3, 5, 7 y 11.",
				},
				sieve: {
					term: "Criba",
					text: "Un método antiguo para encontrar primos: se escriben todos los números y luego se tachan los múltiplos de 2, de 3, de 5... Lo que queda es primo.",
				},
				database: {
					term: "Base de datos",
					text: 'Un programa cuyo trabajo es guardar datos de forma segura y responder preguntas sobre ellos, como "¿qué artículos cuestan menos de 10?".',
				},
				driver: {
					term: "Driver",
					text: "Una biblioteca que permite a un programa hablar con una base de datos. Convierte tu pregunta en los mensajes que la base de datos entiende.",
				},
				pool: {
					term: "Pool de conexiones",
					text: "Unas pocas conexiones a la base de datos que se mantienen abiertas y se comparten. Abrir una conexión es lento, así que los programas piden una prestada, la usan y la devuelven.",
				},
				query: {
					term: "Consulta",
					text: 'Una pregunta o una orden enviada a una base de datos, como "dame la fila 7" o "agrega esta fila".',
				},
				"round-trip": {
					term: "Viaje de ida y vuelta",
					text: "Enviar un mensaje y esperar a que vuelva la respuesta. Cada viaje toma tiempo aunque el trabajo sea mínimo.",
				},
				bytecode: {
					term: "Bytecode",
					text: "Una traducción intermedia de un programa: ya no es el texto que escribiste, todavía no son instrucciones para el procesador. Una máquina virtual lo ejecuta.",
				},
				bundle: {
					term: "Bundle",
					text: "Todos los archivos de un programa empaquetados en un solo archivo, para que sea fácil de enviar y rápido de cargar.",
				},
				artifact: {
					term: "Artefacto",
					text: "Lo que produce una compilación y que le entregas a otra persona: un archivo de programa, un paquete o un bundle.",
				},
				runtime: {
					term: "Runtime",
					text: "La maquinaria que un programa necesita a su alrededor para ejecutarse, como un intérprete, una máquina virtual o un recolector de basura.",
				},
				cache: {
					term: "Caché",
					text: "Un lugar donde se guardan resultados para no tener que hacer el mismo trabajo dos veces.",
				},
				"binary-tree": {
					term: "Árbol binario",
					text: "Una forma de organizar datos en la que cada pieza apunta a otras dos, como un árbol genealógico al revés.",
				},
			},
		},

		methodology: {
			title: "Metodología",
			lead: "Esta parte es para lectores que quieren comprobar el trabajo o repetirlo. La misma información está en benchmarks/README.md.",
			measuredAt: "Medido el:",
			databaseLabel: "Base de datos",
			blocks: [
				{
					title: "Cómo se produjeron los números",
					items: [
						"Cada programa se ejecuta en un contenedor Docker construido a partir de una imagen fija, sin red. Los programas se compilan dentro de la imagen, así que ninguna ejecución lee el programa a través de un bind mount.",
						"CPU, paralelismo, concurrencia y memoria usan el runner compartido del repositorio (tools/bench): hyperfine 2.0.0 ejecuta cada comando 5 veces después de 1 ejecución de calentamiento descartada, dentro del contenedor, y registra el tiempo de reloj, el tiempo de CPU (usuario más sistema) y la memoria residente máxima de todo el proceso. El programa también imprime el tiempo de su sección medida, sin el arranque.",
						"Los gráficos de tiempo muestran el proceso completo (promedio, con el rango de las 5 ejecuciones). Las tablas también muestran la sección medida.",
						"El speed-up usa la sección medida, porque el arranque de un runtime no es trabajo paralelo. El runner lee la sección una sola vez, así que un pequeño recolector adicional (scripts/collect-sections.ts) ejecuta cada caso 5 veces más. Speed-up = tiempo promedio de la sección con 1 worker / promedio con w workers. Eficiencia = speed-up / w.",
						"Memoria por tarea = (memoria máxima con n tareas − memoria máxima con 0 tareas) / n.",
						"HTTP: cada servidor corre solo, limitado a 4 CPU y 2 GiB, en una red interna de Docker sin puertos publicados. k6 2.3.0, también limitado a 4 CPU, ejecuta 32 usuarios virtuales durante 10 s, 3 veces, cada una después de una ejecución de calentamiento de 3 s. La CPU y la memoria del contenedor del servidor se muestrean cerca de una vez por segundo con docker stats mientras k6 envía carga. La primera y la última muestra de cada ejecución se descartan.",
						"Compilación: hyperfine ejecuta el comando de compilación 5 veces con --prepare. El modo en frío borra la salida y la caché del compilador antes de cada ejecución (para Go, toda la caché de compilación). El modo en caliente agrega una línea de comentario al código fuente antes de cada ejecución. El programa es el de cpu-single.",
						"Tamaño: tamaños exactos de stat y du dentro de las imágenes. Runtime significa lo que debe estar presente además del artefacto, sin contar el sistema operativo y glibc: libstdc++ y libgcc compartidas para C++, libgcc para Rust, nada para Go, un runtime de jlink con java.base para Java, el ejecutable de bun, el resto del release de mix para Elixir, la instalación de CPython para Python.",
						"Base de datos: PostgreSQL 18.6 con sus datos en tmpfs, en una red interna de Docker, 4 CPU para el servidor y 4 para el cliente. Cada cliente se ejecuta una vez como calentamiento y 3 veces medido: 5.000 inserciones de una fila, 5.000 lecturas por clave primaria, 200 agregados filtrados, y luego 5.000 lecturas por clave desde 8 workers en un pool de 8 conexiones. La latencia la mide el cliente alrededor de cada llamada. El tiempo de CPU y la memoria máxima son los del propio cliente, tomados del kernel.",
						"Antes de cualquier medición, las pruebas verifican que las siete implementaciones imprimen el mismo checksum para la misma entrada, y que los siete servidores pasan la misma suite de pruebas de protocolo.",
					],
				},
				{
					title: "Máquina",
					data: "machine",
					paragraphs: [
						"Todos los resultados vienen de esta única máquina. Docker corre dentro de una máquina virtual (WSL 2), que agrega su propia sobrecarga y ruido.",
					],
				},
				{
					title: "Versiones de runtime",
					data: "runtimes",
					paragraphs: [
						"Las etiquetas de imagen están fijadas, y también cada biblioteca (Cargo.lock, mix.lock, requirements.txt, URL de descarga fijas).",
					],
				},
				{
					title: "Comandos exactos",
					data: "commands",
					paragraphs: [
						"Un solo comando reproduce todo: ./setup-unix-benchmarks.sh o ./setup-windows-benchmarks.ps1. Los comandos de abajo son lo que se ejecutó dentro de cada contenedor.",
					],
				},
				{
					title: "Cómo leer cada gráfico",
					items: [
						"Barras de tiempo: más corta es mejor. El bigote es la ejecución más rápida y la más lenta de las 5, y ± es la desviación estándar. Las barras empiezan en cero y la escala es lineal, así que los lenguajes muy rápidos parecen una astilla junto a uno lento: lee el número.",
						"Speed-up: los dos ejes son logarítmicos en base 2. La diagonal punteada es el speed-up lineal. El host tiene 8 núcleos físicos con SMT (16 lógicos), así que el paso de 8 a 16 workers no puede duplicarse.",
						"Eficiencia: speed-up dividido por los workers, mostrada para 8 workers, el número de núcleos físicos.",
						"Peticiones por segundo: más largo es mejor. Revisa la columna de CPU de k6 en la tabla: cerca de 400 % el generador de carga estaba saturado y el servidor podría haber hecho más.",
						"Latencia: p50, p95 y p99 de la duración de la petición vista por k6, promedio de las 3 ejecuciones. El modelo de carga es cerrado (un usuario espera la respuesta), así que la latencia bajo sobrecarga se subestima (omisión coordinada).",
						"CPU del servidor: 100 % es un núcleo. El límite de cada servidor es 400 %.",
						"Memoria: tamaño máximo del conjunto residente del proceso (runner) o la mayor muestra de docker stats del contenedor (HTTP).",
					],
				},
				{
					title: "Límites de esta comparación",
					items: [
						"Ruido. Otros contenedores se estaban ejecutando en la misma máquina durante la medición. Las ejecuciones son pocas (5, o 3 en HTTP) y cortas. Trata una diferencia menor que la dispersión como ninguna diferencia, y no ordenes lenguajes cuyas barras estén cerca.",
						"Una máquina, un día, una versión de cada runtime, configuración predeterminada. Sin flags de JVM, sin ajuste de GOGC, sin cambio de asignador, sin optimización guiada por perfil.",
						"Programas pequeños escritos de la forma simple. Miden el runtime del lenguaje en una tarea estrecha, no aplicaciones reales, y no las bibliotecas que la gente usa para ir más rápido (NumPy, arenas, SIMD).",
						"Los tiempos del proceso completo incluyen el arranque del runtime, que domina las ejecuciones cortas de los lenguajes rápidos.",
						"HTTP compara pilas de servidor, no solo lenguajes: cpp-httplib, axum, net/http, el servidor del JDK, Bun.serve, Bandit y FastAPI sobre uvicorn. Python y Bun corren un proceso (su valor predeterminado) mientras los demás usan 4 núcleos. Cliente y servidor comparten la máquina.",
						"La concurrencia mide un arranque en frío. El resultado de la JVM está dominado por código que el JIT todavía no ha compilado. Los threads del SO en C++ se detienen en 10.000 porque 100.000 threads chocarían con el límite de threads de la máquina virtual de Docker, compartida con otros trabajos.",
						"El paralelismo en Python usa procesos iniciados con el método spawn, así que el tiempo incluye iniciar intérpretes.",
						"El tiempo de compilación usa un programa de un solo archivo, y Python, Bun, Java y Elixir no producen código de máquina por adelantado, así que sus barras miden otro paso. El tamaño del binario no cuenta nada del sistema operativo y nada pasa por strip.",
						"La base de datos mide sobre todo el driver y un viaje de ida y vuelta muy corto. Los drivers difieren en valores predeterminados que pesan más que el lenguaje, como preparar una sentencia una vez o en cada llamada. libpq no tiene pool, así que la fase de pool en C++ usa una conexión por thread.",
						"Velocidad, memoria y CPU son solo tres de las razones para elegir un lenguaje. La seguridad, la facilidad de escritura, las bibliotecas y la experiencia del equipo no están en ningún gráfico.",
					],
				},
			],
		},
	},
};
