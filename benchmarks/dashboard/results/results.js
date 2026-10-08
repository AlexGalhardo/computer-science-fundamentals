window.BENCH_DATA = {
	"generatedAt": "2026-10-08T00:28:13.513Z",
	"languages": [
		"cpp",
		"rust",
		"go",
		"java",
		"ts",
		"elixir",
		"python"
	],
	"machine": {
		"host CPU": "AMD Ryzen 7 5700X3D 8-Core Processor",
		"host logical cores": "16",
		"host memory": "31.9 GiB",
		"host OS": "win32 x64",
		"Docker engine": "29.8.1 on Docker Desktop (kernel 6.18.33.2-microsoft-standard-WSL2)",
		"Docker CPUs": "16",
		"Docker memory": "15.6 GiB"
	},
	"measuredAt": {
		"cpu-single": "2026-10-07T22:31:41.566Z",
		"parallelism": "2026-10-07T22:46:24.830Z",
		"concurrency": "2026-10-07T22:54:36.249Z",
		"http": "2026-10-07T23:45:49.877Z",
		"memory": "2026-10-07T22:59:41.150Z"
	},
	"runs": {
		"runner": 5,
		"warmup": 1,
		"http": 3
	},
	"runtimes": {
		"cpp": "g++ (GCC) 16.2.0 (sef-bench-cpu-single-cpp:local)",
		"rust": "rustc 1.99.0 (b940084d7 2026-09-28) (sef-bench-cpu-single-rust:local)",
		"go": "go version go1.27.1 linux/amd64 (sef-bench-cpu-single-go:local)",
		"java": "openjdk 25.0.4.1 2026-08-18 LTS (sef-bench-cpu-single-java:local)",
		"ts": "1.4.2 (sef-bench-cpu-single-ts:local)",
		"elixir": "1.20.4 (sef-bench-cpu-single-elixir:local)",
		"python": "Python 3.14.8 (sef-bench-cpu-single-python:local)"
	},
	"httpRuntimes": {
		"cpp": "16.2.0, cpp-httplib 0.60.0 + nlohmann/json 3.12.0 (sef-bd-http-cpp:local)",
		"rust": "rustc 1.99.0 (b940084d7 2026-09-28), axum 0.8.9 + tokio 1.53.2 (sef-bd-http-rust:local)",
		"go": "go version go1.27.1 linux/amd64, net/http (standard library) (sef-bd-http-go:local)",
		"java": "openjdk 25.0.4.1 2026-08-18 LTS, JDK HttpServer + virtual threads + Jackson 3.2.3 (sef-bd-http-java:local)",
		"ts": "1.4.2, Bun.serve (built in) (sef-bd-http-ts:local)",
		"elixir": "1.20.4, Bandit 1.12.5 + Plug 1.20.3 (sef-bd-http-elixir:local)",
		"python": "Python 3.14.8, FastAPI 0.142.4 + uvicorn 0.54.0 (1 worker) (sef-bd-http-python:local)"
	},
	"httpSettings": {
		"vus": 32,
		"durationSeconds": 10,
		"warmupSeconds": 3,
		"primesLimit": 5000,
		"serverCpus": 4,
		"loadGeneratorCpus": 4
	},
	"commands": {
		"cpu-single": {
			"cpp": [
				"/opt/bench/main nbody 100000",
				"/opt/bench/main nbody 1000000",
				"/opt/bench/main sieve 100000",
				"/opt/bench/main sieve 1000000",
				"/opt/bench/main sieve 10000000"
			],
			"elixir": [
				"elixir -pa /opt/bench -e \"Main.main(System.argv())\" nbody 100000",
				"elixir -pa /opt/bench -e \"Main.main(System.argv())\" nbody 1000000",
				"elixir -pa /opt/bench -e \"Main.main(System.argv())\" sieve 100000",
				"elixir -pa /opt/bench -e \"Main.main(System.argv())\" sieve 1000000",
				"elixir -pa /opt/bench -e \"Main.main(System.argv())\" sieve 10000000"
			],
			"go": [
				"/opt/bench/main nbody 100000",
				"/opt/bench/main nbody 1000000",
				"/opt/bench/main sieve 100000",
				"/opt/bench/main sieve 1000000",
				"/opt/bench/main sieve 10000000"
			],
			"java": [
				"java -cp /opt/bench Main nbody 100000",
				"java -cp /opt/bench Main nbody 1000000",
				"java -cp /opt/bench Main sieve 100000",
				"java -cp /opt/bench Main sieve 1000000",
				"java -cp /opt/bench Main sieve 10000000"
			],
			"python": [
				"python /opt/bench/main.py nbody 100000",
				"python /opt/bench/main.py nbody 1000000",
				"python /opt/bench/main.py sieve 100000",
				"python /opt/bench/main.py sieve 1000000",
				"python /opt/bench/main.py sieve 10000000"
			],
			"rust": [
				"/opt/bench/main nbody 100000",
				"/opt/bench/main nbody 1000000",
				"/opt/bench/main sieve 100000",
				"/opt/bench/main sieve 1000000",
				"/opt/bench/main sieve 10000000"
			],
			"ts": [
				"bun /opt/bench/main.ts nbody 100000",
				"bun /opt/bench/main.ts nbody 1000000",
				"bun /opt/bench/main.ts sieve 100000",
				"bun /opt/bench/main.ts sieve 1000000",
				"bun /opt/bench/main.ts sieve 10000000"
			]
		},
		"parallelism": {
			"cpp": [
				"/opt/bench/main primes 2000000 1",
				"/opt/bench/main primes 2000000 16",
				"/opt/bench/main primes 2000000 2",
				"/opt/bench/main primes 2000000 4",
				"/opt/bench/main primes 2000000 8"
			],
			"elixir": [
				"elixir -pa /opt/bench -e \"Main.main(System.argv())\" primes 2000000 1",
				"elixir -pa /opt/bench -e \"Main.main(System.argv())\" primes 2000000 16",
				"elixir -pa /opt/bench -e \"Main.main(System.argv())\" primes 2000000 2",
				"elixir -pa /opt/bench -e \"Main.main(System.argv())\" primes 2000000 4",
				"elixir -pa /opt/bench -e \"Main.main(System.argv())\" primes 2000000 8"
			],
			"go": [
				"/opt/bench/main primes 2000000 1",
				"/opt/bench/main primes 2000000 16",
				"/opt/bench/main primes 2000000 2",
				"/opt/bench/main primes 2000000 4",
				"/opt/bench/main primes 2000000 8"
			],
			"java": [
				"java -cp /opt/bench Main primes 2000000 1",
				"java -cp /opt/bench Main primes 2000000 16",
				"java -cp /opt/bench Main primes 2000000 2",
				"java -cp /opt/bench Main primes 2000000 4",
				"java -cp /opt/bench Main primes 2000000 8"
			],
			"python": [
				"python /opt/bench/main.py primes 2000000 1",
				"python /opt/bench/main.py primes 2000000 16",
				"python /opt/bench/main.py primes 2000000 2",
				"python /opt/bench/main.py primes 2000000 4",
				"python /opt/bench/main.py primes 2000000 8"
			],
			"rust": [
				"/opt/bench/main primes 2000000 1",
				"/opt/bench/main primes 2000000 16",
				"/opt/bench/main primes 2000000 2",
				"/opt/bench/main primes 2000000 4",
				"/opt/bench/main primes 2000000 8"
			],
			"ts": [
				"bun /opt/bench/main.ts primes 2000000 1",
				"bun /opt/bench/main.ts primes 2000000 16",
				"bun /opt/bench/main.ts primes 2000000 2",
				"bun /opt/bench/main.ts primes 2000000 4",
				"bun /opt/bench/main.ts primes 2000000 8"
			]
		},
		"concurrency": {
			"python": [
				"python /opt/bench/main.py asyncio-tasks 0",
				"python /opt/bench/main.py asyncio-tasks 10000",
				"python /opt/bench/main.py asyncio-tasks 100000"
			],
			"cpp": [
				"/opt/bench/main coroutines 0",
				"/opt/bench/main coroutines 10000",
				"/opt/bench/main coroutines 100000",
				"/opt/bench/main os-threads 0",
				"/opt/bench/main os-threads 10000"
			],
			"go": [
				"/opt/bench/main goroutines 0",
				"/opt/bench/main goroutines 10000",
				"/opt/bench/main goroutines 100000"
			],
			"elixir": [
				"elixir -pa /opt/bench -e \"Main.main(System.argv())\" processes 0",
				"elixir -pa /opt/bench -e \"Main.main(System.argv())\" processes 10000",
				"elixir -pa /opt/bench -e \"Main.main(System.argv())\" processes 100000"
			],
			"ts": [
				"bun /opt/bench/main.ts promises 0",
				"bun /opt/bench/main.ts promises 10000",
				"bun /opt/bench/main.ts promises 100000"
			],
			"rust": [
				"/opt/bench/main tokio-tasks 0",
				"/opt/bench/main tokio-tasks 10000",
				"/opt/bench/main tokio-tasks 100000"
			],
			"java": [
				"java -cp /opt/bench Main virtual-threads 0",
				"java -cp /opt/bench Main virtual-threads 10000",
				"java -cp /opt/bench Main virtual-threads 100000"
			]
		},
		"memory": {
			"cpp": [
				"/opt/bench/main binary-trees 10",
				"/opt/bench/main binary-trees 18",
				"/opt/bench/main idle 10"
			],
			"elixir": [
				"elixir -pa /opt/bench -e \"Main.main(System.argv())\" binary-trees 10",
				"elixir -pa /opt/bench -e \"Main.main(System.argv())\" binary-trees 18",
				"elixir -pa /opt/bench -e \"Main.main(System.argv())\" idle 10"
			],
			"go": [
				"/opt/bench/main binary-trees 10",
				"/opt/bench/main binary-trees 18",
				"/opt/bench/main idle 10"
			],
			"java": [
				"java -cp /opt/bench Main binary-trees 10",
				"java -cp /opt/bench Main binary-trees 18",
				"java -cp /opt/bench Main idle 10"
			],
			"python": [
				"python /opt/bench/main.py binary-trees 10",
				"python /opt/bench/main.py binary-trees 18",
				"python /opt/bench/main.py idle 10"
			],
			"rust": [
				"/opt/bench/main binary-trees 10",
				"/opt/bench/main binary-trees 18",
				"/opt/bench/main idle 10"
			],
			"ts": [
				"bun /opt/bench/main.ts binary-trees 10",
				"bun /opt/bench/main.ts binary-trees 18",
				"bun /opt/bench/main.ts idle 10"
			]
		},
		"http": {
			"cpp": [
				"docker compose --profile tools run --rm -T --name sef-bd-http-k6-load -e TARGET=http://server-cpp:8080 -e ENDPOINT=echo -e VUS=32 -e DURATION=10s -e LIMIT=5000 k6 run --quiet /scripts/load.js",
				"docker compose --profile tools run --rm -T --name sef-bd-http-k6-load -e TARGET=http://server-cpp:8080 -e ENDPOINT=primes -e VUS=32 -e DURATION=10s -e LIMIT=5000 k6 run --quiet /scripts/load.js"
			],
			"elixir": [
				"docker compose --profile tools run --rm -T --name sef-bd-http-k6-load -e TARGET=http://server-elixir:8080 -e ENDPOINT=echo -e VUS=32 -e DURATION=10s -e LIMIT=5000 k6 run --quiet /scripts/load.js",
				"docker compose --profile tools run --rm -T --name sef-bd-http-k6-load -e TARGET=http://server-elixir:8080 -e ENDPOINT=primes -e VUS=32 -e DURATION=10s -e LIMIT=5000 k6 run --quiet /scripts/load.js"
			],
			"go": [
				"docker compose --profile tools run --rm -T --name sef-bd-http-k6-load -e TARGET=http://server-go:8080 -e ENDPOINT=echo -e VUS=32 -e DURATION=10s -e LIMIT=5000 k6 run --quiet /scripts/load.js",
				"docker compose --profile tools run --rm -T --name sef-bd-http-k6-load -e TARGET=http://server-go:8080 -e ENDPOINT=primes -e VUS=32 -e DURATION=10s -e LIMIT=5000 k6 run --quiet /scripts/load.js"
			],
			"java": [
				"docker compose --profile tools run --rm -T --name sef-bd-http-k6-load -e TARGET=http://server-java:8080 -e ENDPOINT=echo -e VUS=32 -e DURATION=10s -e LIMIT=5000 k6 run --quiet /scripts/load.js",
				"docker compose --profile tools run --rm -T --name sef-bd-http-k6-load -e TARGET=http://server-java:8080 -e ENDPOINT=primes -e VUS=32 -e DURATION=10s -e LIMIT=5000 k6 run --quiet /scripts/load.js"
			],
			"python": [
				"docker compose --profile tools run --rm -T --name sef-bd-http-k6-load -e TARGET=http://server-python:8080 -e ENDPOINT=echo -e VUS=32 -e DURATION=10s -e LIMIT=5000 k6 run --quiet /scripts/load.js",
				"docker compose --profile tools run --rm -T --name sef-bd-http-k6-load -e TARGET=http://server-python:8080 -e ENDPOINT=primes -e VUS=32 -e DURATION=10s -e LIMIT=5000 k6 run --quiet /scripts/load.js"
			],
			"rust": [
				"docker compose --profile tools run --rm -T --name sef-bd-http-k6-load -e TARGET=http://server-rust:8080 -e ENDPOINT=echo -e VUS=32 -e DURATION=10s -e LIMIT=5000 k6 run --quiet /scripts/load.js",
				"docker compose --profile tools run --rm -T --name sef-bd-http-k6-load -e TARGET=http://server-rust:8080 -e ENDPOINT=primes -e VUS=32 -e DURATION=10s -e LIMIT=5000 k6 run --quiet /scripts/load.js"
			],
			"ts": [
				"docker compose --profile tools run --rm -T --name sef-bd-http-k6-load -e TARGET=http://server-ts:8080 -e ENDPOINT=echo -e VUS=32 -e DURATION=10s -e LIMIT=5000 k6 run --quiet /scripts/load.js",
				"docker compose --profile tools run --rm -T --name sef-bd-http-k6-load -e TARGET=http://server-ts:8080 -e ENDPOINT=primes -e VUS=32 -e DURATION=10s -e LIMIT=5000 k6 run --quiet /scripts/load.js"
			]
		},
		"build-time": {
			"cpp": [
				"g++ -std=c++23 -O2 -ffp-contract=off -pthread main.cpp -o main"
			],
			"rust": [
				"cargo build --release --locked --offline --quiet"
			],
			"go": [
				"go build -o main ."
			],
			"java": [
				"javac -d out Main.java"
			],
			"ts": [
				"bun build main.ts --target bun --outfile out/main.js"
			],
			"elixir": [
				"elixirc --ignore-module-conflict -o out main.ex"
			],
			"python": [
				"python -m py_compile main.py"
			]
		},
		"binary-size": {
			"cpp": [
				"echo artifact=$(stat -c %s /opt/bench/main); echo runtime=$(ldd /opt/bench/main 2>/dev/null | awk '$3 ~ /^\\// {print $3}' | grep -Ev '/(libc|libm|libdl|libpthread|librt)\\.so' | xargs -r -n1 readlink -f | xargs -r stat -c %s | awk '{s+=$1} END {print s+0}')"
			],
			"rust": [
				"echo artifact=$(stat -c %s /opt/bench/main); echo runtime=$(ldd /opt/bench/main 2>/dev/null | awk '$3 ~ /^\\// {print $3}' | grep -Ev '/(libc|libm|libdl|libpthread|librt)\\.so' | xargs -r -n1 readlink -f | xargs -r stat -c %s | awk '{s+=$1} END {print s+0}')"
			],
			"go": [
				"echo artifact=$(stat -c %s /opt/bench/main); echo runtime=0"
			],
			"java": [
				"jar --create --file /tmp/app.jar --main-class Main -C /opt/bench . && jlink --add-modules java.base --strip-debug --no-header-files --no-man-pages --compress zip-6 --output /tmp/jre && echo artifact=$(stat -c %s /tmp/app.jar) && echo runtime=$(du -sb /tmp/jre | cut -f1)"
			],
			"ts": [
				"bun build /opt/bench/main.ts --target bun --minify --outfile /tmp/out/main.js >/dev/null && echo artifact=$(stat -c %s /tmp/out/main.js) && echo runtime=$(stat -c %s $(readlink -f $(which bun)))"
			],
			"elixir": [
				"cd /tmp && mix new app >/dev/null && cp /src/main.ex app/lib/main.ex && cd app && MIX_ENV=prod mix release --quiet >/dev/null 2>&1 && total=$(du -sb _build/prod/rel/app | cut -f1) && own=$(du -sb _build/prod/rel/app/lib/app-0.1.0 | cut -f1) && echo artifact=$own && echo runtime=$((total - own))"
			],
			"python": [
				"echo artifact=$(stat -c %s /opt/bench/main.py); echo runtime=$(du -sbc /usr/local/lib/python3.14 /usr/local/lib/libpython3.14.so.1.0 $(readlink -f /usr/local/bin/python3) | tail -1 | cut -f1)"
			]
		},
		"database": {
			"cpp": [
				"docker compose --profile clients run --rm -T client-cpp 5000 8"
			],
			"rust": [
				"docker compose --profile clients run --rm -T client-rust 5000 8"
			],
			"go": [
				"docker compose --profile clients run --rm -T client-go 5000 8"
			],
			"java": [
				"docker compose --profile clients run --rm -T client-java 5000 8"
			],
			"ts": [
				"docker compose --profile clients run --rm -T client-ts 5000 8"
			],
			"elixir": [
				"docker compose --profile clients run --rm -T client-elixir 5000 8"
			],
			"python": [
				"docker compose --profile clients run --rm -T client-python 5000 8"
			]
		}
	},
	"cpu": {
		"nbody": [
			{
				"language": "cpp",
				"n": 1000000,
				"processMs": 101.5469018,
				"stddevMs": 14.085984588316776,
				"minMs": 83.510998,
				"maxMs": 118.60646100000001,
				"cpuMs": 101.32239999999999,
				"sectionMs": 95.626,
				"peakMemoryKb": 3764
			},
			{
				"language": "rust",
				"n": 1000000,
				"processMs": 48.7481674,
				"stddevMs": 3.2877688204602076,
				"minMs": 44.405552,
				"maxMs": 53.376416000000006,
				"cpuMs": 48.6348,
				"sectionMs": 49.199,
				"peakMemoryKb": 2084
			},
			{
				"language": "go",
				"n": 1000000,
				"processMs": 98.2087102,
				"stddevMs": 10.987571888579804,
				"minMs": 82.643607,
				"maxMs": 112.40546900000001,
				"cpuMs": 99.60239999999999,
				"sectionMs": 100.447,
				"peakMemoryKb": 2140
			},
			{
				"language": "java",
				"n": 1000000,
				"processMs": 151.15445440000002,
				"stddevMs": 8.844625983091982,
				"minMs": 139.68799900000002,
				"maxMs": 162.99552500000001,
				"cpuMs": 199.39319999999998,
				"sectionMs": 122.638,
				"peakMemoryKb": 45228
			},
			{
				"language": "ts",
				"n": 1000000,
				"processMs": 220.2297666,
				"stddevMs": 23.819671952223366,
				"minMs": 181.041227,
				"maxMs": 243.57622600000002,
				"cpuMs": 227.95839999999998,
				"sectionMs": 234.420431,
				"peakMemoryKb": 31276
			},
			{
				"language": "elixir",
				"n": 1000000,
				"processMs": 3660.0111408000002,
				"stddevMs": 802.7399017879659,
				"minMs": 2863.831448,
				"maxMs": 4741.520001999999,
				"cpuMs": 4594.940599999999,
				"sectionMs": 2899.915,
				"peakMemoryKb": 86280
			},
			{
				"language": "python",
				"n": 1000000,
				"processMs": 9158.7525824,
				"stddevMs": 861.2752710106784,
				"minMs": 8397.88051,
				"maxMs": 10338.335815,
				"cpuMs": 9157.018800000002,
				"sectionMs": 9178.321,
				"peakMemoryKb": 15292
			}
		],
		"sieve": [
			{
				"language": "cpp",
				"n": 10000000,
				"processMs": 42.379499200000005,
				"stddevMs": 5.084927458744492,
				"minMs": 37.76634,
				"maxMs": 48.689620000000005,
				"cpuMs": 42.2374,
				"sectionMs": 29.199,
				"peakMemoryKb": 13164
			},
			{
				"language": "rust",
				"n": 10000000,
				"processMs": 35.903586600000004,
				"stddevMs": 5.316470333508153,
				"minMs": 29.122050000000005,
				"maxMs": 41.122711,
				"cpuMs": 35.789,
				"sectionMs": 25.473,
				"peakMemoryKb": 11892
			},
			{
				"language": "go",
				"n": 10000000,
				"processMs": 45.752463,
				"stddevMs": 5.565098472802572,
				"minMs": 40.34563,
				"maxMs": 54.33794300000001,
				"cpuMs": 47.3052,
				"sectionMs": 36.642,
				"peakMemoryKb": 12252
			},
			{
				"language": "java",
				"n": 10000000,
				"processMs": 119.11494500000002,
				"stddevMs": 12.882760332855344,
				"minMs": 100.900532,
				"maxMs": 135.55287700000002,
				"cpuMs": 158.32920000000001,
				"sectionMs": 51.938,
				"peakMemoryKb": 55052
			},
			{
				"language": "ts",
				"n": 10000000,
				"processMs": 56.0892712,
				"stddevMs": 4.876226645989879,
				"minMs": 48.446705,
				"maxMs": 61.187231000000004,
				"cpuMs": 60.599199999999996,
				"sectionMs": 37.282156,
				"peakMemoryKb": 39620
			},
			{
				"language": "elixir",
				"n": 10000000,
				"processMs": 1585.6768134,
				"stddevMs": 141.486621075645,
				"minMs": 1417.225902,
				"maxMs": 1770.4381190000001,
				"cpuMs": 2644.5276,
				"sectionMs": 1203.109,
				"peakMemoryKb": 164332
			},
			{
				"language": "python",
				"n": 10000000,
				"processMs": 1930.5888742000002,
				"stddevMs": 191.49493221600997,
				"minMs": 1791.842936,
				"maxMs": 2243.152959,
				"cpuMs": 1929.8521999999998,
				"sectionMs": 1700.607,
				"peakMemoryKb": 25040
			}
		]
	},
	"parallelism": [
		{
			"language": "cpp",
			"n": 2000000,
			"points": [
				{
					"workers": 1,
					"sectionMs": 212.2902,
					"sectionStddevMs": 21.523634758097902,
					"speedup": 1,
					"speedupLow": 0.7825702654924666,
					"speedupHigh": 1.277840526397596,
					"efficiency": 1,
					"processMs": 232.18980620000002,
					"cpuMs": 227.94759999999997,
					"peakMemoryKb": 3952
				},
				{
					"workers": 2,
					"sectionMs": 109.7404,
					"sectionStddevMs": 6.30931428920766,
					"speedup": 1.9344762730954144,
					"speedupLow": 1.6801448505793153,
					"speedupHigh": 2.479177346883387,
					"efficiency": 0.9672381365477072,
					"processMs": 94.15972060000001,
					"cpuMs": 181.26,
					"peakMemoryKb": 3876
				},
				{
					"workers": 4,
					"sectionMs": 67.5548,
					"sectionStddevMs": 6.550185546990256,
					"speedup": 3.1424887646769735,
					"speedupLow": 2.564371695054872,
					"speedupHigh": 4.016415066686209,
					"efficiency": 0.7856221911692434,
					"processMs": 50.6305962,
					"cpuMs": 189.05939999999995,
					"peakMemoryKb": 3812
				},
				{
					"workers": 8,
					"sectionMs": 49.3024,
					"sectionStddevMs": 9.796921215361486,
					"speedup": 4.305879632634517,
					"speedupLow": 3.2743527974756557,
					"speedupHigh": 6.501542111506524,
					"efficiency": 0.5382349540793147,
					"processMs": 32.839009600000004,
					"cpuMs": 231.97359999999998,
					"peakMemoryKb": 3988
				},
				{
					"workers": 16,
					"sectionMs": 46.288599999999995,
					"sectionStddevMs": 8.349666119073266,
					"speedup": 4.586230734997386,
					"speedupLow": 3.54934809393332,
					"speedupHigh": 7.304270568027009,
					"efficiency": 0.28663942093733663,
					"processMs": 24.944528599999998,
					"cpuMs": 280.24279999999993,
					"peakMemoryKb": 4008
				}
			]
		},
		{
			"language": "rust",
			"n": 2000000,
			"points": [
				{
					"workers": 1,
					"sectionMs": 216.6642,
					"sectionStddevMs": 31.443165842516567,
					"speedup": 1,
					"speedupLow": 0.7147934978212048,
					"speedupHigh": 1.3990054512920813,
					"efficiency": 1,
					"processMs": 193.2704774,
					"cpuMs": 193.1244,
					"peakMemoryKb": 2436
				},
				{
					"workers": 2,
					"sectionMs": 82.6424,
					"sectionStddevMs": 6.664573302170214,
					"speedup": 2.6217075012342335,
					"speedupLow": 2.1274843964410604,
					"speedupHigh": 3.5527786217190864,
					"efficiency": 1.3108537506171167,
					"processMs": 95.2161306,
					"cpuMs": 188.3202,
					"peakMemoryKb": 2388
				},
				{
					"workers": 4,
					"sectionMs": 52.849199999999996,
					"sectionStddevMs": 7.604134250524512,
					"speedup": 4.099668490724552,
					"speedupLow": 3.1859732856053826,
					"speedupHigh": 6.053204897371264,
					"efficiency": 1.024917122681138,
					"processMs": 73.16951800000001,
					"cpuMs": 267.0833999999999,
					"peakMemoryKb": 2388
				},
				{
					"workers": 8,
					"sectionMs": 36.32800000000001,
					"sectionStddevMs": 5.307772838017844,
					"speedup": 5.964110328121557,
					"speedupLow": 4.296332715042349,
					"speedupHigh": 8.551860095389507,
					"efficiency": 0.7455137910151947,
					"processMs": 41.2371604,
					"cpuMs": 284.1648,
					"peakMemoryKb": 2460
				},
				{
					"workers": 16,
					"sectionMs": 28.7108,
					"sectionStddevMs": 2.361953577020514,
					"speedup": 7.546435487691043,
					"speedupLow": 6.076298239514523,
					"speedupHigh": 10.502811621368323,
					"efficiency": 0.4716522179806902,
					"processMs": 29.362645600000004,
					"cpuMs": 309.7152,
					"peakMemoryKb": 2440
				}
			]
		},
		{
			"language": "go",
			"n": 2000000,
			"points": [
				{
					"workers": 1,
					"sectionMs": 177.8218,
					"sectionStddevMs": 8.657531617037261,
					"speedup": 1,
					"speedupLow": 0.9012343727774178,
					"speedupHigh": 1.109589281330013,
					"efficiency": 1,
					"processMs": 184.0907792,
					"cpuMs": 185.28320000000002,
					"peakMemoryKb": 2268
				},
				{
					"workers": 2,
					"sectionMs": 91.04080000000002,
					"sectionStddevMs": 6.4141862071505225,
					"speedup": 1.953209989367404,
					"speedupLow": 1.7373809185269444,
					"speedupHigh": 2.2507559318416277,
					"efficiency": 0.976604994683702,
					"processMs": 105.81434739999999,
					"cpuMs": 212.74,
					"peakMemoryKb": 2268
				},
				{
					"workers": 4,
					"sectionMs": 61.200599999999994,
					"sectionStddevMs": 5.567211043242389,
					"speedup": 2.905556481472404,
					"speedupLow": 2.5480137629027215,
					"speedupHigh": 3.5731523662512705,
					"efficiency": 0.726389120368101,
					"processMs": 50.88420760000001,
					"cpuMs": 195.4128,
					"peakMemoryKb": 2268
				},
				{
					"workers": 8,
					"sectionMs": 35.4676,
					"sectionStddevMs": 3.9018342225163787,
					"speedup": 5.013640618479965,
					"speedupLow": 4.148160721646985,
					"speedupHigh": 5.907288684177766,
					"efficiency": 0.6267050773099956,
					"processMs": 34.2378364,
					"cpuMs": 243.1888,
					"peakMemoryKb": 2268
				},
				{
					"workers": 16,
					"sectionMs": 34.1906,
					"sectionStddevMs": 4.541141959903918,
					"speedup": 5.200897322655934,
					"speedupLow": 4.225208091486156,
					"speedupHigh": 6.378124999999999,
					"efficiency": 0.3250560826659959,
					"processMs": 29.455641999999997,
					"cpuMs": 298.2326,
					"peakMemoryKb": 2268
				}
			]
		},
		{
			"language": "java",
			"n": 2000000,
			"points": [
				{
					"workers": 1,
					"sectionMs": 270.521,
					"sectionStddevMs": 23.59235563694308,
					"speedup": 1,
					"speedupLow": 0.8144569154858045,
					"speedupHigh": 1.2278120315345638,
					"efficiency": 1,
					"processMs": 280.45656379999997,
					"cpuMs": 321.9768,
					"peakMemoryKb": 45480
				},
				{
					"workers": 2,
					"sectionMs": 177.83520000000001,
					"sectionStddevMs": 34.28658326080334,
					"speedup": 1.5211892808622813,
					"speedupLow": 1.0464795671414742,
					"speedupHigh": 2.1143919836714953,
					"efficiency": 0.7605946404311407,
					"processMs": 193.405267,
					"cpuMs": 326.0299999999999,
					"peakMemoryKb": 45680
				},
				{
					"workers": 4,
					"sectionMs": 135.8846,
					"sectionStddevMs": 48.78465683286088,
					"speedup": 1.9908142644567524,
					"speedupLow": 1.1500197094401094,
					"speedupHigh": 3.0205016712214645,
					"efficiency": 0.4977035661141881,
					"processMs": 142.9176322,
					"cpuMs": 362.61779999999993,
					"peakMemoryKb": 45848
				},
				{
					"workers": 8,
					"sectionMs": 114.854,
					"sectionStddevMs": 30.114525448693364,
					"speedup": 2.355346788096192,
					"speedupLow": 1.5080745109518143,
					"speedupHigh": 3.6767248308868083,
					"efficiency": 0.294418348512024,
					"processMs": 126.11025240000001,
					"cpuMs": 457.42339999999996,
					"peakMemoryKb": 46224
				},
				{
					"workers": 16,
					"sectionMs": 150.002,
					"sectionStddevMs": 57.937237019899385,
					"speedup": 1.8034492873428354,
					"speedupLow": 1.0189142106946292,
					"speedupHigh": 3.073490189592077,
					"efficiency": 0.11271558045892721,
					"processMs": 125.86435460000001,
					"cpuMs": 617.1787999999999,
					"peakMemoryKb": 46924
				}
			]
		},
		{
			"language": "ts",
			"n": 2000000,
			"points": [
				{
					"workers": 1,
					"sectionMs": 345.3557488,
					"sectionStddevMs": 67.92582459824911,
					"speedup": 1,
					"speedupLow": 0.6060550330080096,
					"speedupHigh": 1.6500151727752157,
					"efficiency": 1,
					"processMs": 214.40813700000004,
					"cpuMs": 233.6684,
					"peakMemoryKb": 36484
				},
				{
					"workers": 2,
					"sectionMs": 244.4196634,
					"sectionStddevMs": 44.7745050158203,
					"speedup": 1.4129622142340288,
					"speedupLow": 0.8103250150046071,
					"speedupHigh": 2.1053898262506587,
					"efficiency": 0.7064811071170144,
					"processMs": 128.837021,
					"cpuMs": 272.9678,
					"peakMemoryKb": 38652
				},
				{
					"workers": 4,
					"sectionMs": 146.2083128,
					"sectionStddevMs": 65.1149854707262,
					"speedup": 2.362080118333737,
					"speedupLow": 0.9902834968641383,
					"speedupHigh": 3.976481474942404,
					"efficiency": 0.5905200295834343,
					"processMs": 102.1694772,
					"cpuMs": 387.5552,
					"peakMemoryKb": 41380
				},
				{
					"workers": 8,
					"sectionMs": 125.2357368,
					"sectionStddevMs": 46.151609687114195,
					"speedup": 2.7576453624537627,
					"speedupLow": 1.4075065800948323,
					"speedupHigh": 4.906081626747441,
					"efficiency": 0.34470567030672034,
					"processMs": 96.486346,
					"cpuMs": 537.7662,
					"peakMemoryKb": 47352
				},
				{
					"workers": 16,
					"sectionMs": 190.3193528,
					"sectionStddevMs": 32.97177882535364,
					"speedup": 1.814611828587513,
					"speedupLow": 1.1938128085344248,
					"speedupHigh": 3.142935096705778,
					"efficiency": 0.11341323928671956,
					"processMs": 129.8035752,
					"cpuMs": 696.5819999999999,
					"peakMemoryKb": 59784
				}
			]
		},
		{
			"language": "elixir",
			"n": 2000000,
			"points": [
				{
					"workers": 1,
					"sectionMs": 685.0540000000001,
					"sectionStddevMs": 112.75549947341814,
					"speedup": 1,
					"speedupLow": 0.7077142746416443,
					"speedupHigh": 1.41299961839311,
					"efficiency": 1,
					"processMs": 1562.0372675999997,
					"cpuMs": 2427.8954,
					"peakMemoryKb": 87944
				},
				{
					"workers": 2,
					"sectionMs": 566.3604,
					"sectionStddevMs": 96.58011238500397,
					"speedup": 1.2095725619234678,
					"speedupLow": 0.8570701530013611,
					"speedupHigh": 1.7917706439139134,
					"efficiency": 0.6047862809617339,
					"processMs": 1331.8781246,
					"cpuMs": 2630.7191999999995,
					"peakMemoryKb": 88000
				},
				{
					"workers": 4,
					"sectionMs": 387.4762,
					"sectionStddevMs": 95.42976124459288,
					"speedup": 1.7679898791203177,
					"speedupLow": 1.22949115812285,
					"speedupHigh": 2.9316679329958033,
					"efficiency": 0.4419974697800794,
					"processMs": 693.4655962,
					"cpuMs": 2373.7490000000003,
					"peakMemoryKb": 88208
				},
				{
					"workers": 8,
					"sectionMs": 217.94719999999998,
					"sectionStddevMs": 30.2341938738244,
					"speedup": 3.1432108327154475,
					"speedupLow": 2.2706629312589124,
					"speedupHigh": 4.589912061279169,
					"efficiency": 0.39290135408943094,
					"processMs": 706.4644468000001,
					"cpuMs": 2494.5701999999997,
					"peakMemoryKb": 87936
				},
				{
					"workers": 16,
					"sectionMs": 257.8284,
					"sectionStddevMs": 55.68024834984125,
					"speedup": 2.6570152861360508,
					"speedupLow": 1.7357795058545367,
					"speedupHigh": 4.148972198354914,
					"efficiency": 0.16606345538350317,
					"processMs": 809.7181742,
					"cpuMs": 2780.0389999999998,
					"peakMemoryKb": 89232
				}
			]
		},
		{
			"language": "python",
			"n": 2000000,
			"points": [
				{
					"workers": 1,
					"sectionMs": 10502.025999999998,
					"sectionStddevMs": 1356.1781023040448,
					"speedup": 1,
					"speedupLow": 0.7480465181678108,
					"speedupHigh": 1.3368152590955154,
					"efficiency": 1,
					"processMs": 9646.3838938,
					"cpuMs": 9838.793200000002,
					"peakMemoryKb": 23572
				},
				{
					"workers": 2,
					"sectionMs": 5646.5688,
					"sectionStddevMs": 652.8177843772337,
					"speedup": 1.8598951632361227,
					"speedupLow": 1.4096115939134672,
					"speedupHigh": 2.4755832890181884,
					"efficiency": 0.9299475816180613,
					"processMs": 6465.5691598,
					"cpuMs": 12242.685800000001,
					"peakMemoryKb": 23228
				},
				{
					"workers": 4,
					"sectionMs": 3793.5664000000006,
					"sectionStddevMs": 607.1176462208952,
					"speedup": 2.768378062395322,
					"speedupLow": 1.9366211384139778,
					"speedupHigh": 3.749474130291196,
					"efficiency": 0.6920945155988305,
					"processMs": 3661.6273416,
					"cpuMs": 12799.872,
					"peakMemoryKb": 23588
				},
				{
					"workers": 8,
					"sectionMs": 2417.4002,
					"sectionStddevMs": 279.6079892469099,
					"speedup": 4.344347286808365,
					"speedupLow": 3.134422947812123,
					"speedupHigh": 5.546109537558412,
					"efficiency": 0.5430434108510456,
					"processMs": 3993.6756684,
					"cpuMs": 19229.5412,
					"peakMemoryKb": 23400
				},
				{
					"workers": 16,
					"sectionMs": 2544.598,
					"sectionStddevMs": 159.7006437181766,
					"speedup": 4.127184726231805,
					"speedupLow": 3.2469486797355653,
					"speedupHigh": 5.129418812887821,
					"efficiency": 0.2579490453894878,
					"processMs": 4622.0782788,
					"cpuMs": 26852.8284,
					"peakMemoryKb": 23420
				}
			]
		}
	],
	"concurrency": [
		{
			"language": "cpp",
			"model": "coroutines",
			"n": 100000,
			"processMs": 63.372518,
			"stddevMs": 13.746573286668628,
			"minMs": 41.220528,
			"maxMs": 77.562532,
			"sectionMs": 17.666,
			"cpuMs": 57.5276,
			"peakMemoryKb": 14332,
			"baselineMemoryKb": 3772,
			"bytesPerTask": 108.1344
		},
		{
			"language": "cpp",
			"model": "os-threads",
			"n": 10000,
			"processMs": 1693.5664308,
			"stddevMs": 290.27023778659657,
			"minMs": 1490.47171,
			"maxMs": 2197.154612,
			"sectionMs": 1803.307,
			"cpuMs": 2704.6661999999997,
			"peakMemoryKb": 87620,
			"baselineMemoryKb": 3772,
			"bytesPerTask": 8586.0352
		},
		{
			"language": "rust",
			"model": "tokio-tasks",
			"n": 100000,
			"processMs": 191.5373428,
			"stddevMs": 29.28383548527743,
			"minMs": 167.71269500000002,
			"maxMs": 234.15052900000003,
			"sectionMs": 151.812,
			"cpuMs": 387.6031999999999,
			"peakMemoryKb": 53248,
			"baselineMemoryKb": 3072,
			"bytesPerTask": 513.80224
		},
		{
			"language": "go",
			"model": "goroutines",
			"n": 100000,
			"processMs": 459.95470320000004,
			"stddevMs": 33.817343693290624,
			"minMs": 427.18560400000007,
			"maxMs": 513.439988,
			"sectionMs": 315.756,
			"cpuMs": 1125.273,
			"peakMemoryKb": 271832,
			"baselineMemoryKb": 2136,
			"bytesPerTask": 2761.68704
		},
		{
			"language": "java",
			"model": "virtual-threads",
			"n": 100000,
			"processMs": 4476.0040756,
			"stddevMs": 708.0341538025784,
			"minMs": 3352.579393,
			"maxMs": 5070.59329,
			"sectionMs": 4513.284,
			"cpuMs": 11761.371000000001,
			"peakMemoryKb": 265660,
			"baselineMemoryKb": 44564,
			"bytesPerTask": 2264.02304
		},
		{
			"language": "ts",
			"model": "promises",
			"n": 100000,
			"processMs": 250.01928819999998,
			"stddevMs": 42.50370476069869,
			"minMs": 189.229957,
			"maxMs": 299.650411,
			"sectionMs": 194.70863300000002,
			"cpuMs": 605.132,
			"peakMemoryKb": 71828,
			"baselineMemoryKb": 18876,
			"bytesPerTask": 542.22848
		},
		{
			"language": "elixir",
			"model": "processes",
			"n": 100000,
			"processMs": 1270.0275156,
			"stddevMs": 521.1754663171675,
			"minMs": 976.193558,
			"maxMs": 2199.194656,
			"sectionMs": 490.349,
			"cpuMs": 3904.267,
			"peakMemoryKb": 380564,
			"baselineMemoryKb": 86700,
			"bytesPerTask": 3009.16736
		},
		{
			"language": "python",
			"model": "asyncio-tasks",
			"n": 100000,
			"processMs": 2094.7991184,
			"stddevMs": 333.8827133335383,
			"minMs": 1755.379907,
			"maxMs": 2506.5013030000005,
			"sectionMs": 1632.26,
			"cpuMs": 2090.6348,
			"peakMemoryKb": 151336,
			"baselineMemoryKb": 25272,
			"bytesPerTask": 1290.89536
		}
	],
	"http": {
		"echo": [
			{
				"language": "cpp",
				"implementation": "echo",
				"variant": "32-vus",
				"n": 143503,
				"rps": 14346.218153361815,
				"rpsStddev": 2294.6417017836593,
				"rpsMin": 11815.380216936206,
				"rpsMax": 16290.993467115257,
				"p50Ms": 1.3534844999999998,
				"p95Ms": 6.514750766666662,
				"p99Ms": 12.690134479999974,
				"meanMs": 2.1043609077294896,
				"failedRate": 0,
				"cpuPercent": 188.2252205882353,
				"peakMemoryKb": 6767.616,
				"loadGeneratorCpuPercent": 377.80751225490195,
				"samples": 49,
				"command": "docker compose --profile tools run --rm -T --name sef-bd-http-k6-load -e TARGET=http://server-cpp:8080 -e ENDPOINT=echo -e VUS=32 -e DURATION=10s -e LIMIT=5000 k6 run --quiet /scripts/load.js"
			},
			{
				"language": "rust",
				"implementation": "echo",
				"variant": "32-vus",
				"n": 126966,
				"rps": 12694.403673835011,
				"rpsStddev": 3143.4436604539155,
				"rpsMin": 9390.859042099102,
				"rpsMax": 15648.551778807076,
				"p50Ms": 1.577007,
				"p95Ms": 7.531083266666665,
				"p99Ms": 14.249386179999968,
				"meanMs": 2.4480377244664973,
				"failedRate": 0,
				"cpuPercent": 106.82645833333332,
				"peakMemoryKb": 5583.872,
				"loadGeneratorCpuPercent": 279.55687500000005,
				"samples": 48,
				"command": "docker compose --profile tools run --rm -T --name sef-bd-http-k6-load -e TARGET=http://server-rust:8080 -e ENDPOINT=echo -e VUS=32 -e DURATION=10s -e LIMIT=5000 k6 run --quiet /scripts/load.js"
			},
			{
				"language": "go",
				"implementation": "echo",
				"variant": "32-vus",
				"n": 161185,
				"rps": 16118.813163235702,
				"rpsStddev": 1116.241583911549,
				"rpsMin": 14839.350154077656,
				"rpsMax": 16893.548667016756,
				"p50Ms": 1.2471035,
				"p95Ms": 5.545344433333334,
				"p99Ms": 10.052216549999999,
				"meanMs": 1.8621814360997542,
				"failedRate": 0,
				"cpuPercent": 213.7484722222222,
				"peakMemoryKb": 12462.08,
				"loadGeneratorCpuPercent": 338.4157407407408,
				"samples": 49,
				"command": "docker compose --profile tools run --rm -T --name sef-bd-http-k6-load -e TARGET=http://server-go:8080 -e ENDPOINT=echo -e VUS=32 -e DURATION=10s -e LIMIT=5000 k6 run --quiet /scripts/load.js"
			},
			{
				"language": "java",
				"implementation": "echo",
				"variant": "32-vus",
				"n": 129392,
				"rps": 12938.520280243923,
				"rpsStddev": 1922.8222898207098,
				"rpsMin": 11308.200426079437,
				"rpsMax": 15058.972679559563,
				"p50Ms": 1.5436598333333331,
				"p95Ms": 7.063059549999994,
				"p99Ms": 13.606357816666673,
				"meanMs": 2.347933978234572,
				"failedRate": 0,
				"cpuPercent": 167.77867102396513,
				"peakMemoryKb": 177049.6,
				"loadGeneratorCpuPercent": 282.733311546841,
				"samples": 52,
				"command": "docker compose --profile tools run --rm -T --name sef-bd-http-k6-load -e TARGET=http://server-java:8080 -e ENDPOINT=echo -e VUS=32 -e DURATION=10s -e LIMIT=5000 k6 run --quiet /scripts/load.js"
			},
			{
				"language": "ts",
				"implementation": "echo",
				"variant": "32-vus",
				"n": 187194,
				"rps": 18718.638209815723,
				"rpsStddev": 5605.201004540922,
				"rpsMin": 14562.236664659433,
				"rpsMax": 25093.526421325558,
				"p50Ms": 1.3234773333333332,
				"p95Ms": 4.2675695,
				"p99Ms": 7.634998300000002,
				"meanMs": 1.7095909547985846,
				"failedRate": 0,
				"cpuPercent": 95.96504901960783,
				"peakMemoryKb": 18176,
				"loadGeneratorCpuPercent": 305.85715686274506,
				"samples": 49,
				"command": "docker compose --profile tools run --rm -T --name sef-bd-http-k6-load -e TARGET=http://server-ts:8080 -e ENDPOINT=echo -e VUS=32 -e DURATION=10s -e LIMIT=5000 k6 run --quiet /scripts/load.js"
			},
			{
				"language": "elixir",
				"implementation": "echo",
				"variant": "32-vus",
				"n": 164727,
				"rps": 16470.2316453977,
				"rpsStddev": 3265.3310778172836,
				"rpsMin": 14418.355442216276,
				"rpsMax": 20235.647814590473,
				"p50Ms": 1.4173231666666666,
				"p95Ms": 4.914174383333331,
				"p99Ms": 8.655341766666693,
				"meanMs": 1.8769062457226415,
				"failedRate": 0,
				"cpuPercent": 328.99769444444445,
				"peakMemoryKb": 150630.4,
				"loadGeneratorCpuPercent": 340.3082777777778,
				"samples": 47,
				"command": "docker compose --profile tools run --rm -T --name sef-bd-http-k6-load -e TARGET=http://server-elixir:8080 -e ENDPOINT=echo -e VUS=32 -e DURATION=10s -e LIMIT=5000 k6 run --quiet /scripts/load.js"
			},
			{
				"language": "python",
				"implementation": "echo",
				"variant": "32-vus",
				"n": 21739,
				"rps": 2170.4483018423116,
				"rpsStddev": 259.8324657231173,
				"rpsMin": 1873.2897166728392,
				"rpsMax": 2354.8813486072313,
				"p50Ms": 13.345149833333332,
				"p95Ms": 26.66941856666666,
				"p99Ms": 38.63253102333332,
				"meanMs": 14.743867305440284,
				"failedRate": 0,
				"cpuPercent": 101.47596638655462,
				"peakMemoryKb": 46714.88,
				"loadGeneratorCpuPercent": 109.78193277310925,
				"samples": 48,
				"command": "docker compose --profile tools run --rm -T --name sef-bd-http-k6-load -e TARGET=http://server-python:8080 -e ENDPOINT=echo -e VUS=32 -e DURATION=10s -e LIMIT=5000 k6 run --quiet /scripts/load.js"
			}
		],
		"primes": [
			{
				"language": "cpp",
				"implementation": "primes",
				"variant": "32-vus",
				"n": 138882,
				"rps": 13884.341647807605,
				"rpsStddev": 2446.740999708185,
				"rpsMin": 11243.749304417683,
				"rpsMax": 16074.692746892726,
				"p50Ms": 1.3505846666666665,
				"p95Ms": 6.880328583333334,
				"p99Ms": 13.79878788000002,
				"meanMs": 2.1898398384801285,
				"failedRate": 0,
				"cpuPercent": 238.90166666666664,
				"peakMemoryKb": 6572.032,
				"loadGeneratorCpuPercent": 320.50034722222216,
				"samples": 47,
				"command": "docker compose --profile tools run --rm -T --name sef-bd-http-k6-load -e TARGET=http://server-cpp:8080 -e ENDPOINT=primes -e VUS=32 -e DURATION=10s -e LIMIT=5000 k6 run --quiet /scripts/load.js"
			},
			{
				"language": "rust",
				"implementation": "primes",
				"variant": "32-vus",
				"n": 176234,
				"rps": 17625.001269900116,
				"rpsStddev": 1974.3795433361558,
				"rpsMin": 15420.738078629545,
				"rpsMax": 19231.208672187087,
				"p50Ms": 1.2031795,
				"p95Ms": 4.7837563666666645,
				"p99Ms": 9.224137856666637,
				"meanMs": 1.7195553372802452,
				"failedRate": 0,
				"cpuPercent": 236.08633333333327,
				"peakMemoryKb": 6584.32,
				"loadGeneratorCpuPercent": 341.5547222222222,
				"samples": 46,
				"command": "docker compose --profile tools run --rm -T --name sef-bd-http-k6-load -e TARGET=http://server-rust:8080 -e ENDPOINT=primes -e VUS=32 -e DURATION=10s -e LIMIT=5000 k6 run --quiet /scripts/load.js"
			},
			{
				"language": "go",
				"implementation": "primes",
				"variant": "32-vus",
				"n": 210823,
				"rps": 21079.923930205656,
				"rpsStddev": 3670.4591335562077,
				"rpsMin": 17835.919878769753,
				"rpsMax": 25064.043340137774,
				"p50Ms": 0.9873271666666668,
				"p95Ms": 4.237452199999997,
				"p99Ms": 8.20376216333334,
				"meanMs": 1.4555040941489288,
				"failedRate": 0,
				"cpuPercent": 312.3922440087146,
				"peakMemoryKb": 12953.6,
				"loadGeneratorCpuPercent": 354.0146949891068,
				"samples": 52,
				"command": "docker compose --profile tools run --rm -T --name sef-bd-http-k6-load -e TARGET=http://server-go:8080 -e ENDPOINT=primes -e VUS=32 -e DURATION=10s -e LIMIT=5000 k6 run --quiet /scripts/load.js"
			},
			{
				"language": "java",
				"implementation": "primes",
				"variant": "32-vus",
				"n": 95971,
				"rps": 9594.21999600914,
				"rpsStddev": 1588.1418553651579,
				"rpsMin": 7940.939262237677,
				"rpsMax": 11108.022399293679,
				"p50Ms": 2.1104724999999998,
				"p95Ms": 9.741815366666662,
				"p99Ms": 17.596333700000006,
				"meanMs": 3.233950105924117,
				"failedRate": 0,
				"cpuPercent": 220.95175000000003,
				"peakMemoryKb": 180531.2,
				"loadGeneratorCpuPercent": 269.8790032679738,
				"samples": 48,
				"command": "docker compose --profile tools run --rm -T --name sef-bd-http-k6-load -e TARGET=http://server-java:8080 -e ENDPOINT=primes -e VUS=32 -e DURATION=10s -e LIMIT=5000 k6 run --quiet /scripts/load.js"
			},
			{
				"language": "ts",
				"implementation": "primes",
				"variant": "32-vus",
				"n": 76509,
				"rps": 7644.532864580521,
				"rpsStddev": 756.5659515664563,
				"rpsMin": 6886.455378656928,
				"rpsMax": 8399.578167420574,
				"p50Ms": 3.603328833333333,
				"p95Ms": 8.000128916666666,
				"p99Ms": 12.984425190000044,
				"meanMs": 4.106829391023804,
				"failedRate": 0,
				"cpuPercent": 98.27406862745097,
				"peakMemoryKb": 19855.36,
				"loadGeneratorCpuPercent": 174.56299019607843,
				"samples": 49,
				"command": "docker compose --profile tools run --rm -T --name sef-bd-http-k6-load -e TARGET=http://server-ts:8080 -e ENDPOINT=primes -e VUS=32 -e DURATION=10s -e LIMIT=5000 k6 run --quiet /scripts/load.js"
			},
			{
				"language": "elixir",
				"implementation": "primes",
				"variant": "32-vus",
				"n": 69302,
				"rps": 6926.91257295572,
				"rpsStddev": 859.5581049486811,
				"rpsMin": 5963.111387955068,
				"rpsMax": 7614.131436991904,
				"p50Ms": 3.794850333333334,
				"p95Ms": 10.110816749999998,
				"p99Ms": 16.163153743333336,
				"meanMs": 4.542171421885586,
				"failedRate": 0,
				"cpuPercent": 369.2558333333334,
				"peakMemoryKb": 150016,
				"loadGeneratorCpuPercent": 193,
				"samples": 48,
				"command": "docker compose --profile tools run --rm -T --name sef-bd-http-k6-load -e TARGET=http://server-elixir:8080 -e ENDPOINT=primes -e VUS=32 -e DURATION=10s -e LIMIT=5000 k6 run --quiet /scripts/load.js"
			},
			{
				"language": "python",
				"implementation": "primes",
				"variant": "32-vus",
				"n": 3464,
				"rps": 344.6720709415934,
				"rpsStddev": 16.024136765343293,
				"rpsMin": 332.17313216479045,
				"rpsMax": 362.737011381321,
				"p50Ms": 90.87089266666668,
				"p95Ms": 126.69535608333331,
				"p99Ms": 150.04927629333335,
				"meanMs": 92.57347665236318,
				"failedRate": 0,
				"cpuPercent": 106.22324754901962,
				"peakMemoryKb": 49059.84,
				"loadGeneratorCpuPercent": 15.525208333333333,
				"samples": 49,
				"command": "docker compose --profile tools run --rm -T --name sef-bd-http-k6-load -e TARGET=http://server-python:8080 -e ENDPOINT=primes -e VUS=32 -e DURATION=10s -e LIMIT=5000 k6 run --quiet /scripts/load.js"
			}
		]
	},
	"memory": {
		"trees": [
			{
				"language": "cpp",
				"n": 18,
				"processMs": 2493.714311,
				"stddevMs": 268.6224429314869,
				"minMs": 2019.914654,
				"maxMs": 2674.36647,
				"cpuMs": 2491.7014000000004,
				"sectionMs": 2215.234,
				"peakMemoryKb": 36432,
				"garbageCollected": false
			},
			{
				"language": "rust",
				"n": 18,
				"processMs": 2406.0555432,
				"stddevMs": 361.3202955992564,
				"minMs": 2005.6655440000002,
				"maxMs": 2885.831305,
				"cpuMs": 2388.4382000000005,
				"sectionMs": 3518.654,
				"peakMemoryKb": 34880,
				"garbageCollected": false
			},
			{
				"language": "go",
				"n": 18,
				"processMs": 2723.3579974,
				"stddevMs": 358.87160908123695,
				"minMs": 2188.717528,
				"maxMs": 3156.423549,
				"cpuMs": 5483.9952,
				"sectionMs": 2667.053,
				"peakMemoryKb": 39396,
				"garbageCollected": true
			},
			{
				"language": "java",
				"n": 18,
				"processMs": 1029.1335081999998,
				"stddevMs": 177.1465504330441,
				"minMs": 851.171915,
				"maxMs": 1259.984564,
				"cpuMs": 1177.2346,
				"sectionMs": 962.611,
				"peakMemoryKb": 470172,
				"garbageCollected": true
			},
			{
				"language": "ts",
				"n": 18,
				"processMs": 1808.8370262000003,
				"stddevMs": 365.98587949805426,
				"minMs": 1271.066683,
				"maxMs": 2174.548822,
				"cpuMs": 3203.5942,
				"sectionMs": 1596.6419660000001,
				"peakMemoryKb": 174944,
				"garbageCollected": true
			},
			{
				"language": "elixir",
				"n": 18,
				"processMs": 1999.9483364,
				"stddevMs": 198.99069143098623,
				"minMs": 1736.140236,
				"maxMs": 2252.368985,
				"cpuMs": 3172.6542,
				"sectionMs": 1321.858,
				"peakMemoryKb": 200940,
				"garbageCollected": true
			},
			{
				"language": "python",
				"n": 18,
				"processMs": 12935.623623000001,
				"stddevMs": 1348.5644669288374,
				"minMs": 11381.491661,
				"maxMs": 14657.749423000001,
				"cpuMs": 12913.1202,
				"sectionMs": 12791.495,
				"peakMemoryKb": 47204,
				"garbageCollected": true
			}
		],
		"idle": [
			{
				"language": "cpp",
				"n": 10,
				"processMs": 1.8559148,
				"stddevMs": 0.23362287937550133,
				"minMs": 1.625445,
				"maxMs": 2.2396620000000005,
				"cpuMs": 1.7469999999999999,
				"sectionMs": 0,
				"peakMemoryKb": 3872,
				"garbageCollected": false
			},
			{
				"language": "rust",
				"n": 10,
				"processMs": 1.3339758000000002,
				"stddevMs": 0.10251639289742888,
				"minMs": 1.1811180000000001,
				"maxMs": 1.4293810000000002,
				"cpuMs": 1.2184000000000001,
				"sectionMs": 0.001,
				"peakMemoryKb": 2196,
				"garbageCollected": false
			},
			{
				"language": "go",
				"n": 10,
				"processMs": 2.4103212000000003,
				"stddevMs": 0.4448750564992377,
				"minMs": 2.1056440000000003,
				"maxMs": 3.190389,
				"cpuMs": 2.6962,
				"sectionMs": 0,
				"peakMemoryKb": 2136,
				"garbageCollected": true
			},
			{
				"language": "java",
				"n": 10,
				"processMs": 169.76875520000004,
				"stddevMs": 26.54287521117256,
				"minMs": 145.624885,
				"maxMs": 203.78896000000003,
				"cpuMs": 164.40119999999996,
				"sectionMs": 0.007,
				"peakMemoryKb": 44612,
				"garbageCollected": true
			},
			{
				"language": "ts",
				"n": 10,
				"processMs": 21.551381400000004,
				"stddevMs": 4.088955043771489,
				"minMs": 16.544979,
				"maxMs": 27.725826,
				"cpuMs": 15.520999999999999,
				"sectionMs": 0.003970999999999947,
				"peakMemoryKb": 18000,
				"garbageCollected": true
			},
			{
				"language": "elixir",
				"n": 10,
				"processMs": 452.81266980000004,
				"stddevMs": 50.7302165125995,
				"minMs": 408.73429600000003,
				"maxMs": 508.399449,
				"cpuMs": 1315.2595999999999,
				"sectionMs": 0.001,
				"peakMemoryKb": 87628,
				"garbageCollected": true
			},
			{
				"language": "python",
				"n": 10,
				"processMs": 156.946699,
				"stddevMs": 14.023214480416787,
				"minMs": 145.843658,
				"maxMs": 181.15360200000003,
				"cpuMs": 156.77079999999998,
				"sectionMs": 0.001,
				"peakMemoryKb": 15044,
				"garbageCollected": true
			}
		]
	},
	"build": [
		{
			"language": "cpp",
			"step": "compile-and-link",
			"command": "g++ -std=c++23 -O2 -ffp-contract=off -pthread main.cpp -o main",
			"coldMs": 4511.6635986,
			"coldStddevMs": 2676.4351231929804,
			"coldMinMs": 1717.3208419999999,
			"coldMaxMs": 8561.69983,
			"warmMs": 4697.6653472,
			"warmStddevMs": 1679.7935534068413,
			"warmMinMs": 2695.772675,
			"warmMaxMs": 6095.364842
		},
		{
			"language": "rust",
			"step": "compile-and-link",
			"command": "cargo build --release --locked --offline --quiet",
			"coldMs": 416.73663300000004,
			"coldStddevMs": 54.81761127816573,
			"coldMinMs": 361.317586,
			"coldMaxMs": 481.12551900000005,
			"warmMs": 551.3503944,
			"warmStddevMs": 265.42922982613356,
			"warmMinMs": 368.63890200000003,
			"warmMaxMs": 1007.4608890000001
		},
		{
			"language": "go",
			"step": "compile-and-link",
			"command": "go build -o main .",
			"coldMs": 7438.8209844,
			"coldStddevMs": 3567.9632097984545,
			"coldMinMs": 4202.240915,
			"coldMaxMs": 12814.440291,
			"warmMs": 335.1722106,
			"warmStddevMs": 131.6309802042864,
			"warmMinMs": 183.12175800000003,
			"warmMaxMs": 534.790482
		},
		{
			"language": "java",
			"step": "compile-to-bytecode",
			"command": "javac -d out Main.java",
			"coldMs": 767.5495930000001,
			"coldStddevMs": 113.50004740614305,
			"coldMinMs": 672.0223950000001,
			"coldMaxMs": 951.3847740000001,
			"warmMs": 767.7574476,
			"warmStddevMs": 126.61887198298594,
			"warmMinMs": 631.720806,
			"warmMaxMs": 944.810376
		},
		{
			"language": "ts",
			"step": "bundle-no-typecheck",
			"command": "bun build main.ts --target bun --outfile out/main.js",
			"coldMs": 8.485667999999999,
			"coldStddevMs": 1.7167938369478148,
			"coldMinMs": 5.964501,
			"coldMaxMs": 10.727185,
			"warmMs": 11.346126800000002,
			"warmStddevMs": 7.070913182409166,
			"warmMinMs": 5.351667,
			"warmMaxMs": 21.993542
		},
		{
			"language": "elixir",
			"step": "compile-to-bytecode",
			"command": "elixirc --ignore-module-conflict -o out main.ex",
			"coldMs": 765.0387712000002,
			"coldStddevMs": 84.28334115987744,
			"coldMinMs": 694.9237850000001,
			"coldMaxMs": 909.7239170000001,
			"warmMs": 1019.7208276,
			"warmStddevMs": 148.1263024192223,
			"warmMinMs": 844.3008080000001,
			"warmMaxMs": 1253.037242
		},
		{
			"language": "python",
			"step": "bytecode-automatic",
			"command": "python -m py_compile main.py",
			"coldMs": 75.9052934,
			"coldStddevMs": 6.7151951126037135,
			"coldMinMs": 64.185005,
			"coldMaxMs": 81.148274,
			"warmMs": 74.3913142,
			"warmStddevMs": 15.929520152598485,
			"warmMinMs": 48.964608,
			"warmMaxMs": 91.281564
		}
	],
	"size": [
		{
			"language": "cpp",
			"implementation": "cpu-single",
			"variant": "default",
			"n": 1,
			"artifactBytes": 21112,
			"runtimeBytes": 3712760,
			"artifact": "executable, g++ -O2, dynamically linked, not stripped",
			"runtime": "libstdc++ and libgcc_s shared libraries",
			"notes": "Linking statically (-static-libstdc++ -static-libgcc) moves the runtime into the executable.",
			"command": "echo artifact=$(stat -c %s /opt/bench/main); echo runtime=$(ldd /opt/bench/main 2>/dev/null | awk '$3 ~ /^\\// {print $3}' | grep -Ev '/(libc|libm|libdl|libpthread|librt)\\.so' | xargs -r -n1 readlink -f | xargs -r stat -c %s | awk '{s+=$1} END {print s+0}')"
		},
		{
			"language": "rust",
			"implementation": "cpu-single",
			"variant": "default",
			"n": 1,
			"artifactBytes": 495088,
			"runtimeBytes": 182856,
			"artifact": "executable, cargo build --release, standard library linked in, not stripped",
			"runtime": "libgcc_s shared library",
			"notes": "The Rust standard library is inside the executable. Only the unwinding helper of GCC is shared.",
			"command": "echo artifact=$(stat -c %s /opt/bench/main); echo runtime=$(ldd /opt/bench/main 2>/dev/null | awk '$3 ~ /^\\// {print $3}' | grep -Ev '/(libc|libm|libdl|libpthread|librt)\\.so' | xargs -r -n1 readlink -f | xargs -r stat -c %s | awk '{s+=$1} END {print s+0}')"
		},
		{
			"language": "go",
			"implementation": "cpu-single",
			"variant": "default",
			"n": 1,
			"artifactBytes": 2383699,
			"runtimeBytes": 0,
			"artifact": "executable, CGO_ENABLED=0 go build, statically linked, not stripped",
			"runtime": "nothing",
			"notes": "The Go runtime (scheduler and garbage collector) is inside the executable, which needs no shared library at all.",
			"command": "echo artifact=$(stat -c %s /opt/bench/main); echo runtime=0"
		},
		{
			"language": "java",
			"implementation": "cpu-single",
			"variant": "default",
			"n": 1,
			"artifactBytes": 3942,
			"runtimeBytes": 43923752,
			"artifact": "jar with the compiled classes",
			"runtime": "smallest Java runtime made by jlink (module java.base only, compressed)",
			"notes": "The full JDK image is much larger. jlink builds a runtime with only the modules the program needs.",
			"command": "jar --create --file /tmp/app.jar --main-class Main -C /opt/bench . && jlink --add-modules java.base --strip-debug --no-header-files --no-man-pages --compress zip-6 --output /tmp/jre && echo artifact=$(stat -c %s /tmp/app.jar) && echo runtime=$(du -sb /tmp/jre | cut -f1)"
		},
		{
			"language": "ts",
			"implementation": "cpu-single",
			"variant": "default",
			"n": 1,
			"artifactBytes": 2076,
			"runtimeBytes": 79500640,
			"artifact": "one JavaScript file made by bun build --minify",
			"runtime": "the bun executable",
			"notes": "`bun build --compile` glues both into one executable of about the sum of the two.",
			"command": "bun build /opt/bench/main.ts --target bun --minify --outfile /tmp/out/main.js >/dev/null && echo artifact=$(stat -c %s /tmp/out/main.js) && echo runtime=$(stat -c %s $(readlink -f $(which bun)))"
		},
		{
			"language": "elixir",
			"implementation": "cpu-single",
			"variant": "default",
			"n": 1,
			"artifactBytes": 7695,
			"runtimeBytes": 67474352,
			"artifact": "the application's compiled modules inside a mix release",
			"runtime": "the rest of the release: the Erlang runtime (ERTS) and the Erlang and Elixir libraries",
			"notes": "A mix release is self-contained: the target machine needs neither Erlang nor Elixir installed.",
			"command": "cd /tmp && mix new app >/dev/null && cp /src/main.ex app/lib/main.ex && cd app && MIX_ENV=prod mix release --quiet >/dev/null 2>&1 && total=$(du -sb _build/prod/rel/app | cut -f1) && own=$(du -sb _build/prod/rel/app/lib/app-0.1.0 | cut -f1) && echo artifact=$own && echo runtime=$((total - own))"
		},
		{
			"language": "python",
			"implementation": "cpu-single",
			"variant": "default",
			"n": 1,
			"artifactBytes": 5598,
			"runtimeBytes": 31768271,
			"artifact": "the source file (Python ships source, bytecode is made on the first run)",
			"runtime": "the CPython interpreter, its shared library and the standard library",
			"notes": "Tools such as PyInstaller pack the interpreter with the program, giving one file of about the size of the runtime.",
			"command": "echo artifact=$(stat -c %s /opt/bench/main.py); echo runtime=$(du -sbc /usr/local/lib/python3.14 /usr/local/lib/libpython3.14.so.1.0 $(readlink -f /usr/local/bin/python3) | tail -1 | cut -f1)"
		}
	],
	"database": {
		"insert": [
			{
				"language": "cpp",
				"implementation": "insert",
				"variant": "1-connection",
				"n": 5000,
				"opsPerSecond": 4816.652698943303,
				"opsStddev": 271.59812693775973,
				"opsMin": 4510.380188966888,
				"opsMax": 5028.213304853533,
				"p50Ms": 0.19386666666666666,
				"p95Ms": 0.27913333333333334,
				"p99Ms": 0.43979999999999997,
				"clientCpuMs": 1133.9333333333334,
				"clientPeakMemoryKb": 11808,
				"checksum": "55045000",
				"command": "docker compose --profile clients run --rm -T client-cpp 5000 8"
			},
			{
				"language": "rust",
				"implementation": "insert",
				"variant": "1-connection",
				"n": 5000,
				"opsPerSecond": 1463.41793754058,
				"opsStddev": 96.27926305040916,
				"opsMin": 1359.6895556806471,
				"opsMax": 1549.9233407915644,
				"p50Ms": 0.6244000000000001,
				"p95Ms": 0.9476666666666667,
				"p99Ms": 2.1854333333333336,
				"clientCpuMs": 5233.333333333333,
				"clientPeakMemoryKb": 5900,
				"checksum": "55045000",
				"command": "docker compose --profile clients run --rm -T client-rust 5000 8"
			},
			{
				"language": "go",
				"implementation": "insert",
				"variant": "1-connection",
				"n": 5000,
				"opsPerSecond": 4414.989942234536,
				"opsStddev": 284.94352837353324,
				"opsMin": 4086.4262812785278,
				"opsMax": 4594.346748213258,
				"p50Ms": 0.21783333333333332,
				"p95Ms": 0.27686666666666665,
				"p99Ms": 0.3432666666666666,
				"clientCpuMs": 2042.4666666666665,
				"clientPeakMemoryKb": 14220,
				"checksum": "55045000",
				"command": "docker compose --profile clients run --rm -T client-go 5000 8"
			},
			{
				"language": "java",
				"implementation": "insert",
				"variant": "1-connection",
				"n": 5000,
				"opsPerSecond": 5712.836908323708,
				"opsStddev": 282.22784126201606,
				"opsMin": 5505.225560101649,
				"opsMax": 6034.187291518829,
				"p50Ms": 0.15866666666666668,
				"p95Ms": 0.24283333333333335,
				"p99Ms": 0.3414333333333333,
				"clientCpuMs": 3876.6666666666665,
				"clientPeakMemoryKb": 130904,
				"checksum": "55045000",
				"command": "docker compose --profile clients run --rm -T client-java 5000 8"
			},
			{
				"language": "ts",
				"implementation": "insert",
				"variant": "1-connection",
				"n": 5000,
				"opsPerSecond": 4188.837001868566,
				"opsStddev": 204.47143608047207,
				"opsMin": 3969.582672636985,
				"opsMax": 4374.320758206617,
				"p50Ms": 0.22660999999993692,
				"p95Ms": 0.3161926666666754,
				"p99Ms": 0.4564703333333,
				"clientCpuMs": 2654.0766666666664,
				"clientPeakMemoryKb": 54284,
				"checksum": "55045000",
				"command": "docker compose --profile clients run --rm -T client-ts 5000 8"
			},
			{
				"language": "elixir",
				"implementation": "insert",
				"variant": "1-connection",
				"n": 5000,
				"opsPerSecond": 2698.5060810578416,
				"opsStddev": 173.8270022045941,
				"opsMin": 2498.2240861947344,
				"opsMax": 2810.099964399799,
				"p50Ms": 0.35210333333333327,
				"p95Ms": 0.47445899999999996,
				"p99Ms": 0.6752166666666667,
				"clientCpuMs": 4285.666666666667,
				"clientPeakMemoryKb": 115132,
				"checksum": "55045000",
				"command": "docker compose --profile clients run --rm -T client-elixir 5000 8"
			},
			{
				"language": "python",
				"implementation": "insert",
				"variant": "1-connection",
				"n": 5000,
				"opsPerSecond": 4239.312044279152,
				"opsStddev": 693.7519206260034,
				"opsMin": 3547.3531669112294,
				"opsMax": 4934.84321217649,
				"p50Ms": 0.22837599984389576,
				"p95Ms": 0.3223893330262702,
				"p99Ms": 0.4528329997507778,
				"clientCpuMs": 5663.201666666667,
				"clientPeakMemoryKb": 42536,
				"checksum": "55045000",
				"command": "docker compose --profile clients run --rm -T client-python 5000 8"
			}
		],
		"read": [
			{
				"language": "cpp",
				"implementation": "read",
				"variant": "1-connection",
				"n": 5000,
				"opsPerSecond": 4964.8364741127225,
				"opsStddev": 344.2287359659442,
				"opsMin": 4668.6125443751625,
				"opsMax": 5342.47395009702,
				"p50Ms": 0.1948,
				"p95Ms": 0.2657333333333333,
				"p99Ms": 0.39220000000000005,
				"clientCpuMs": 1133.9333333333334,
				"clientPeakMemoryKb": 11808,
				"checksum": "55045000",
				"command": "docker compose --profile clients run --rm -T client-cpp 5000 8"
			},
			{
				"language": "rust",
				"implementation": "read",
				"variant": "1-connection",
				"n": 5000,
				"opsPerSecond": 1593.5694362942806,
				"opsStddev": 99.5791490416051,
				"opsMin": 1494.652581459313,
				"opsMax": 1693.797921777702,
				"p50Ms": 0.5914,
				"p95Ms": 0.8128000000000001,
				"p99Ms": 1.2219,
				"clientCpuMs": 5233.333333333333,
				"clientPeakMemoryKb": 5900,
				"checksum": "55045000",
				"command": "docker compose --profile clients run --rm -T client-rust 5000 8"
			},
			{
				"language": "go",
				"implementation": "read",
				"variant": "1-connection",
				"n": 5000,
				"opsPerSecond": 4852.395962401731,
				"opsStddev": 128.66479832704144,
				"opsMin": 4709.752106907606,
				"opsMax": 4959.69257841522,
				"p50Ms": 0.20076666666666668,
				"p95Ms": 0.2396666666666667,
				"p99Ms": 0.27853333333333335,
				"clientCpuMs": 2042.4666666666665,
				"clientPeakMemoryKb": 14220,
				"checksum": "55045000",
				"command": "docker compose --profile clients run --rm -T client-go 5000 8"
			},
			{
				"language": "java",
				"implementation": "read",
				"variant": "1-connection",
				"n": 5000,
				"opsPerSecond": 6451.9118465834,
				"opsStddev": 520.2135716796873,
				"opsMin": 5895.190585616442,
				"opsMax": 6925.639409658496,
				"p50Ms": 0.14283333333333334,
				"p95Ms": 0.19740000000000002,
				"p99Ms": 0.3077666666666667,
				"clientCpuMs": 3876.6666666666665,
				"clientPeakMemoryKb": 130904,
				"checksum": "55045000",
				"command": "docker compose --profile clients run --rm -T client-java 5000 8"
			},
			{
				"language": "ts",
				"implementation": "read",
				"variant": "1-connection",
				"n": 5000,
				"opsPerSecond": 4173.181290587673,
				"opsStddev": 299.7130650353964,
				"opsMin": 3867.4106134260624,
				"opsMax": 4466.445192681606,
				"p50Ms": 0.2219876666666399,
				"p95Ms": 0.3168340000000474,
				"p99Ms": 0.5997379999998884,
				"clientCpuMs": 2654.0766666666664,
				"clientPeakMemoryKb": 54284,
				"checksum": "55045000",
				"command": "docker compose --profile clients run --rm -T client-ts 5000 8"
			},
			{
				"language": "elixir",
				"implementation": "read",
				"variant": "1-connection",
				"n": 5000,
				"opsPerSecond": 2761.110705281746,
				"opsStddev": 124.09712598835165,
				"opsMin": 2649.948537071928,
				"opsMax": 2895.0009583755923,
				"p50Ms": 0.34931533333333337,
				"p95Ms": 0.454764,
				"p99Ms": 0.5539503333333334,
				"clientCpuMs": 4285.666666666667,
				"clientPeakMemoryKb": 115132,
				"checksum": "55045000",
				"command": "docker compose --profile clients run --rm -T client-elixir 5000 8"
			},
			{
				"language": "python",
				"implementation": "read",
				"variant": "1-connection",
				"n": 5000,
				"opsPerSecond": 4239.092396787013,
				"opsStddev": 492.43138601789417,
				"opsMin": 3682.7764357261603,
				"opsMax": 4619.098713274436,
				"p50Ms": 0.22259066615030557,
				"p95Ms": 0.3131966665629686,
				"p99Ms": 0.5840096667573865,
				"clientCpuMs": 5663.201666666667,
				"clientPeakMemoryKb": 42536,
				"checksum": "55045000",
				"command": "docker compose --profile clients run --rm -T client-python 5000 8"
			}
		],
		"query": [
			{
				"language": "cpp",
				"implementation": "query",
				"variant": "1-connection",
				"n": 200,
				"opsPerSecond": 1919.0999370467762,
				"opsStddev": 314.9364552598017,
				"opsMin": 1673.1921159187498,
				"opsMax": 2274.0710419793513,
				"p50Ms": 0.5060666666666668,
				"p95Ms": 0.8222999999999999,
				"p99Ms": 1.0048666666666666,
				"clientCpuMs": 1133.9333333333334,
				"clientPeakMemoryKb": 11808,
				"checksum": "55045000",
				"command": "docker compose --profile clients run --rm -T client-cpp 5000 8"
			},
			{
				"language": "rust",
				"implementation": "query",
				"variant": "1-connection",
				"n": 200,
				"opsPerSecond": 1131.140391887689,
				"opsStddev": 92.61305202860156,
				"opsMin": 1045.9594586113842,
				"opsMax": 1229.7249105375126,
				"p50Ms": 0.8463333333333333,
				"p95Ms": 1.1166333333333334,
				"p99Ms": 1.6339666666666668,
				"clientCpuMs": 5233.333333333333,
				"clientPeakMemoryKb": 5900,
				"checksum": "55045000",
				"command": "docker compose --profile clients run --rm -T client-rust 5000 8"
			},
			{
				"language": "go",
				"implementation": "query",
				"variant": "1-connection",
				"n": 200,
				"opsPerSecond": 2186.8643726047817,
				"opsStddev": 204.0736020959722,
				"opsMin": 1955.6459498572378,
				"opsMax": 2341.8381087315433,
				"p50Ms": 0.4288,
				"p95Ms": 0.5809333333333333,
				"p99Ms": 0.8174333333333333,
				"clientCpuMs": 2042.4666666666665,
				"clientPeakMemoryKb": 14220,
				"checksum": "55045000",
				"command": "docker compose --profile clients run --rm -T client-go 5000 8"
			},
			{
				"language": "java",
				"implementation": "query",
				"variant": "1-connection",
				"n": 200,
				"opsPerSecond": 2544.508176750364,
				"opsStddev": 29.48016134288593,
				"opsMin": 2517.7184435464583,
				"opsMax": 2576.091296675554,
				"p50Ms": 0.3678333333333333,
				"p95Ms": 0.4811666666666667,
				"p99Ms": 0.6396000000000001,
				"clientCpuMs": 3876.6666666666665,
				"clientPeakMemoryKb": 130904,
				"checksum": "55045000",
				"command": "docker compose --profile clients run --rm -T client-java 5000 8"
			},
			{
				"language": "ts",
				"implementation": "query",
				"variant": "1-connection",
				"n": 200,
				"opsPerSecond": 2020.213973621839,
				"opsStddev": 129.79715168397405,
				"opsMin": 1896.4831417488645,
				"opsMax": 2155.32767635255,
				"p50Ms": 0.45864333333323276,
				"p95Ms": 0.6596793333333153,
				"p99Ms": 1.1659143333333002,
				"clientCpuMs": 2654.0766666666664,
				"clientPeakMemoryKb": 54284,
				"checksum": "55045000",
				"command": "docker compose --profile clients run --rm -T client-ts 5000 8"
			},
			{
				"language": "elixir",
				"implementation": "query",
				"variant": "1-connection",
				"n": 200,
				"opsPerSecond": 1392.1610630548141,
				"opsStddev": 246.9335340303416,
				"opsMin": 1107.069654929599,
				"opsMax": 1538.98893813226,
				"p50Ms": 0.6882043333333333,
				"p95Ms": 1.053669,
				"p99Ms": 1.755759,
				"clientCpuMs": 4285.666666666667,
				"clientPeakMemoryKb": 115132,
				"checksum": "55045000",
				"command": "docker compose --profile clients run --rm -T client-elixir 5000 8"
			},
			{
				"language": "python",
				"implementation": "query",
				"variant": "1-connection",
				"n": 200,
				"opsPerSecond": 2081.370152511146,
				"opsStddev": 57.051566568589934,
				"opsMin": 2036.6780668685321,
				"opsMax": 2145.6309225606624,
				"p50Ms": 0.451788666396169,
				"p95Ms": 0.6686713334905411,
				"p99Ms": 0.8002589999402213,
				"clientCpuMs": 5663.201666666667,
				"clientPeakMemoryKb": 42536,
				"checksum": "55045000",
				"command": "docker compose --profile clients run --rm -T client-python 5000 8"
			}
		],
		"pool": [
			{
				"language": "cpp",
				"implementation": "pool",
				"variant": "8-workers",
				"n": 5000,
				"opsPerSecond": 23545.96196523732,
				"opsStddev": 3997.9496155275383,
				"opsMin": 21200.184865612027,
				"opsMax": 28162.191694406425,
				"p50Ms": 0.22856666666666667,
				"p95Ms": 0.5965333333333334,
				"p99Ms": 1.7831333333333335,
				"clientCpuMs": 1133.9333333333334,
				"clientPeakMemoryKb": 11808,
				"checksum": "55045000",
				"command": "docker compose --profile clients run --rm -T client-cpp 5000 8"
			},
			{
				"language": "rust",
				"implementation": "pool",
				"variant": "8-workers",
				"n": 5000,
				"opsPerSecond": 13455.874554991193,
				"opsStddev": 3505.296840207127,
				"opsMin": 9668.187794879728,
				"opsMax": 16585.5082463147,
				"p50Ms": 0.5495,
				"p95Ms": 1.0293666666666668,
				"p99Ms": 1.7767,
				"clientCpuMs": 5233.333333333333,
				"clientPeakMemoryKb": 5900,
				"checksum": "55045000",
				"command": "docker compose --profile clients run --rm -T client-rust 5000 8"
			},
			{
				"language": "go",
				"implementation": "pool",
				"variant": "8-workers",
				"n": 5000,
				"opsPerSecond": 32673.73638522902,
				"opsStddev": 1643.790027311337,
				"opsMin": 31593.58018450651,
				"opsMax": 34565.477383808146,
				"p50Ms": 0.21896666666666667,
				"p95Ms": 0.3217666666666667,
				"p99Ms": 0.41133333333333333,
				"clientCpuMs": 2042.4666666666665,
				"clientPeakMemoryKb": 14220,
				"checksum": "55045000",
				"command": "docker compose --profile clients run --rm -T client-go 5000 8"
			},
			{
				"language": "java",
				"implementation": "pool",
				"variant": "8-workers",
				"n": 5000,
				"opsPerSecond": 14681.477942225523,
				"opsStddev": 644.3359494772451,
				"opsMin": 14277.963391301864,
				"opsMax": 15424.576903855526,
				"p50Ms": 0.2302,
				"p95Ms": 0.6018,
				"p99Ms": 6.7533,
				"clientCpuMs": 3876.6666666666665,
				"clientPeakMemoryKb": 130904,
				"checksum": "55045000",
				"command": "docker compose --profile clients run --rm -T client-java 5000 8"
			},
			{
				"language": "ts",
				"implementation": "pool",
				"variant": "8-workers",
				"n": 5000,
				"opsPerSecond": 9226.177499153606,
				"opsStddev": 1626.205694880814,
				"opsMin": 7506.704853654598,
				"opsMax": 10739.4467805963,
				"p50Ms": 0.6371380000000499,
				"p95Ms": 1.6855753333334178,
				"p99Ms": 2.714253000000099,
				"clientCpuMs": 2654.0766666666664,
				"clientPeakMemoryKb": 54284,
				"checksum": "55045000",
				"command": "docker compose --profile clients run --rm -T client-ts 5000 8"
			},
			{
				"language": "elixir",
				"implementation": "pool",
				"variant": "8-workers",
				"n": 5000,
				"opsPerSecond": 12186.796567429714,
				"opsStddev": 4556.992153881132,
				"opsMin": 6945.241169714462,
				"opsMax": 15208.51098204905,
				"p50Ms": 0.597876,
				"p95Ms": 1.3944783333333335,
				"p99Ms": 2.293696333333333,
				"clientCpuMs": 4285.666666666667,
				"clientPeakMemoryKb": 115132,
				"checksum": "55045000",
				"command": "docker compose --profile clients run --rm -T client-elixir 5000 8"
			},
			{
				"language": "python",
				"implementation": "pool",
				"variant": "8-workers",
				"n": 5000,
				"opsPerSecond": 2258.6467635709196,
				"opsStddev": 249.7185879867204,
				"opsMin": 2032.5282363650783,
				"opsMax": 2526.6646730338803,
				"p50Ms": 3.44004433312269,
				"p95Ms": 5.866354000014932,
				"p99Ms": 7.928630333481124,
				"clientCpuMs": 5663.201666666667,
				"clientPeakMemoryKb": 42536,
				"checksum": "55045000",
				"command": "docker compose --profile clients run --rm -T client-python 5000 8"
			}
		]
	},
	"databaseRuntimes": {
		"cpp": "libpq (official C client, from Debian trixie) 17.11-0+deb13u1 (sef-bd-database-cpp:local)",
		"rust": "sqlx 0.9.0 on tokio 1.53.2 (sef-bd-database-rust:local)",
		"go": "pgx 5.11.0 (pgxpool) (sef-bd-database-go:local)",
		"java": "PostgreSQL JDBC 42.7.14 + HikariCP 7.1.0 (sef-bd-database-java:local)",
		"ts": "Bun.sql (built into Bun 1.4.2) (sef-bd-database-ts:local)",
		"elixir": "Postgrex 0.22.4 (sef-bd-database-elixir:local)",
		"python": "psycopg 3.3.6 + psycopg-pool 3.3.3 (sef-bd-database-python:local)"
	},
	"databaseSettings": {
		"rows": 5000,
		"workers": 8,
		"queryOps": 200,
		"clientCpus": 4,
		"databaseCpus": 4,
		"database": "postgres:18.6, data on tmpfs"
	},
	"buildRuntimes": {
		"cpp": "16.2.0 (gcc:16.2.0-trixie)",
		"rust": "rustc 1.99.0 (b940084d7 2026-09-28) (rust:1.99.0-slim-trixie)",
		"go": "go version go1.27.1 linux/amd64 (golang:1.27.1-bookworm)",
		"java": "javac 25.0.4.1 (eclipse-temurin:25.0.4.1_1-jdk-noble)",
		"ts": "1.4.2 (oven/bun:1.4.2)",
		"elixir": "1.20.4 (elixir:1.20.4-otp-28-slim)",
		"python": "Python 3.14.8 (python:3.14.8-slim-trixie)"
	}
};
