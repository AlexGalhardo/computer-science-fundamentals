# EN: Builds and tests the l7-load-balancer mini-project. The only requirement is Docker.
#     The benchmark against NGINX is a separate command, documented in the README.
# PT: Constrói e testa o mini-projeto l7-load-balancer. O único requisito é o Docker.
#     O benchmark contra o NGINX é um comando separado, documentado no README.
# "Continue": PowerShell 5.1 treats Docker stderr output as an error; exit codes are checked instead.
$ErrorActionPreference = "Continue"

Set-Location $PSScriptRoot

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
	Write-Error "Docker is required: https://docs.docker.com/get-docker/"
	exit 1
}

# EN: Each step runs only when the previous one passed: build, Go tests with no network, 10
#     requests per back end through every proxy, and the refusal of a target that is not local.
# PT: Cada passo só roda quando o anterior passou: build, testes do Go sem rede, 10 requisições
#     por back end através de cada proxy, e a recusa de um alvo que não é local.
$steps = @(
	@("build"),
	@("run", "--rm", "go-test"),
	@("run", "--rm", "smoke-test"),
	@("run", "--rm", "k6-refusal-test")
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
docker compose --profile bench down -v --remove-orphans

if ($code -ne 0) { exit $code }
Write-Output "l7-load-balancer: all tests passed"
