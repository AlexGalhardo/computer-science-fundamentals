# EN: Builds and tests the nginx-vs-caddy mini-project. The only requirement is Docker.
#     The experiments that write the tables are a separate command, documented in the README.
# PT: Constrói e testa o mini-projeto nginx-vs-caddy. O único requisito é o Docker.
#     Os experimentos que escrevem as tabelas são um comando separado, documentado no README.
# ES: Construye y prueba el mini-proyecto nginx-vs-caddy. El único requisito es Docker.
#     Los experimentos que escriben las tablas son un comando aparte, documentado en el README.
# "Continue": PowerShell 5.1 treats Docker stderr output as an error; exit codes are checked instead.
$ErrorActionPreference = "Continue"

Set-Location $PSScriptRoot

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
	Write-Error "Docker is required: https://docs.docker.com/get-docker/"
	exit 1
}

# EN: Each step runs only when the previous one passed. The last line of the list brings up
#     both stacks: three instances, NGINX on 127.0.0.1:18480 and Caddy on 127.0.0.1:18481.
# PT: Cada passo só roda quando o anterior passou. A última linha da lista sobe as duas pilhas:
#     três instâncias, NGINX em 127.0.0.1:18480 e Caddy em 127.0.0.1:18481.
# ES: Cada paso corre solo cuando el anterior pasó. La última línea de la lista levanta las dos
#     pilas: tres instancias, NGINX en 127.0.0.1:18480 y Caddy en 127.0.0.1:18481.
$steps = @(
	@("build"),
	@("run", "--rm", "ts-test"),
	@("run", "--rm", "caddy-config-test"),
	@("run", "--rm", "nginx-config-test"),
	@("up", "-d", "--wait", "nginx", "caddy"),
	@("run", "--rm", "lab-test"),
	@("run", "--rm", "refusal-test")
)

$code = 0
foreach ($step in $steps) {
	docker compose @step
	if ($LASTEXITCODE -ne 0) {
		$code = $LASTEXITCODE
		break
	}
}

# Stops and removes everything, whether the tests passed or not.
docker compose --profile lab down -v --remove-orphans

if ($code -ne 0) { exit $code }
Write-Output "nginx-vs-caddy: all tests passed"
