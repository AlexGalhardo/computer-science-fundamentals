# EN: Builds and tests the scaling-by-cores mini-project, then runs a short demo of the three
#     implementations. The only requirement is Docker.
# PT: Constrói e testa o mini-projeto scaling-by-cores e depois roda uma demonstração curta das
#     três implementações. O único requisito é o Docker.
$ErrorActionPreference = "Stop"

Set-Location $PSScriptRoot

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
	Write-Error "Docker is required: https://docs.docker.com/get-docker/"
	exit 1
}

docker compose build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
foreach ($service in "rust-test", "go-test", "cpp-test", "report-test") {
	docker compose run --rm $service
	if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Output "scaling-by-cores: all tests passed"

# EN: Demo: the same Mandelbrot image with 1 and with 8 workers. The checksum must not change,
#     and elapsedMs should drop.
# PT: Demonstração: a mesma imagem de Mandelbrot com 1 e com 8 trabalhadores. O checksum não
#     pode mudar, e o elapsedMs deve cair.
foreach ($workers in 1, 8) {
	Write-Output "mandelbrot-dynamic, 1,000,000 pixels, $workers worker(s):"
	docker compose run --rm rust-test target/release/scaling-by-cores mandelbrot-dynamic 1000000 $workers
	if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
	docker compose run --rm go-test ./scaling mandelbrot-dynamic 1000000 $workers
	if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
	docker compose run --rm cpp-test ./scaling mandelbrot-dynamic 1000000 $workers
	if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
