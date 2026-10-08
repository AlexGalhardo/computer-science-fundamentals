window.BENCH_RESULTS = {
	"project": "binary-size",
	"generatedAt": "2026-10-07T23:48:23.617Z",
	"machine": {
		"host CPU": "AMD Ryzen 7 5700X3D 8-Core Processor",
		"host logical cores": "16",
		"host memory": "31.9 GiB",
		"host OS": "win32 x64",
		"Docker engine": "29.8.1 on Docker Desktop (kernel 6.18.33.2-microsoft-standard-WSL2)",
		"Docker CPUs": "16",
		"Docker memory": "15.6 GiB"
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
	"runs": 1,
	"warmup": 0,
	"rows": [
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
	]
};
