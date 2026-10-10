# EN: Reproduces the whole language benchmark suite: builds every image, checks that the
#     implementations agree, runs the eight workloads, regenerates the results and the
#     dashboard data, and tests the dashboard. Requirements: Docker and Bun. It takes about
#     an hour, and the numbers only mean something on an otherwise idle machine.
#     Usage: .\setup-windows-benchmarks.ps1            everything
#            .\setup-windows-benchmarks.ps1 -Quick     skip the measurements, only build and test
# PT: Reproduz a suíte inteira de benchmark das linguagens: constrói todas as imagens, confere
#     que as implementações concordam, roda as oito cargas, regenera os resultados e os dados
#     do dashboard, e testa o dashboard. Requisitos: Docker e Bun. Leva cerca de uma hora, e os
#     números só significam algo em uma máquina sem outras cargas.
#     Uso: .\setup-windows-benchmarks.ps1            tudo
#          .\setup-windows-benchmarks.ps1 -Quick     pula as medições, só constrói e testa
# ES: Reproduce la suite completa de benchmark de los lenguajes: construye todas las imágenes,
#     comprueba que las implementaciones coinciden, ejecuta las ocho cargas, regenera los
#     resultados y los datos del dashboard, y prueba el dashboard. Requisitos: Docker y Bun.
#     Tarda cerca de una hora, y los números solo significan algo en una máquina sin otras cargas.
#     Uso: .\setup-windows-benchmarks.ps1            todo
#          .\setup-windows-benchmarks.ps1 -Quick     omite las mediciones, solo construye y prueba
param([switch]$Quick)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

foreach ($tool in "docker", "bun") {
	if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
		Write-Error "$tool is required. Docker: https://docs.docker.com/get-docker/  Bun: https://bun.sh"
		exit 1
	}
}

# EN: Runs one step and stops the script if it fails. Success is decided by the exit code only.
#     Windows PowerShell 5.1 turns every line a native program writes to stderr into an error
#     record, and with "Stop" that would abort the script on a harmless progress message, so
#     the preference is relaxed while the program runs and its output is passed on as text.
# PT: Roda uma etapa e para o script se ela falhar. O sucesso é decidido só pelo código de saída.
#     O Windows PowerShell 5.1 transforma cada linha que um programa nativo escreve no stderr em
#     um registro de erro, e com "Stop" isso abortaria o script em uma mensagem de progresso
#     inofensiva, então a preferência é afrouxada enquanto o programa roda e a saída dele é
#     repassada como texto.
# ES: Ejecuta un paso y detiene el script si falla. El éxito lo decide solo el código de salida.
#     Windows PowerShell 5.1 convierte cada línea que un programa nativo escribe en stderr en un
#     registro de error, y con "Stop" eso abortaría el script por un mensaje de progreso
#     inofensivo, así que la preferencia se relaja mientras el programa corre y su salida se
#     pasa como texto.
function Invoke-Step {
	param([string]$Title, [scriptblock]$Step)
	Write-Output "== $Title"
	$previous = $ErrorActionPreference
	$ErrorActionPreference = "Continue"
	try {
		& $Step 2>&1 | ForEach-Object { "$_" }
	}
	finally {
		$ErrorActionPreference = $previous
	}
	if ($LASTEXITCODE -ne 0) {
		throw "step failed: $Title (exit code $LASTEXITCODE)"
	}
}

try {
	Push-Location ..
	try { Invoke-Step "install" { bun install --frozen-lockfile } } finally { Pop-Location }

	Invoke-Step "images" { bun run images }
	Invoke-Step "agreement tests" { bun run test }
	Invoke-Step "http tests" { bun run test:http }
	Invoke-Step "database tests" { bun run test:database }

	if (-not $Quick) {
		Invoke-Step "measurements" { bun run all cpu-single parallelism sections concurrency memory http build-time binary-size database }
	}

	Invoke-Step "dashboard data" { bun run data }
	Invoke-Step "dashboard css" { bun run build:css }
	Invoke-Step "dashboard tests" { bun run test:dashboard }

	Write-Output "benchmarks: done. Open dashboard\index.html in a browser."
}
finally {
	# EN: Whatever happens, leave no container, network or volume of the two compose stacks behind.
	# PT: Aconteça o que acontecer, não deixa contêiner, rede ou volume das duas pilhas compose para trás.
	# ES: Pase lo que pase, no deja contenedor, red ni volumen de las dos pilas compose atrás.
	foreach ($stack in @(@("http", "tools"), @("database", "clients"))) {
		Push-Location $stack[0]
		try { docker compose --profile $stack[1] down -v --remove-orphans 2>$null | Out-Null } catch { } finally { Pop-Location }
	}
}
