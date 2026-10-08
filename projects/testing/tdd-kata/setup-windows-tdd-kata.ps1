# EN: Builds and tests the tdd-kata mini-project. The only requirement is Docker.
#     Step 1 runs the type check and the tests of the finished kata. Step 2 checks the rhythm of
#     the real git history (red, green, refactor), when the history is available: it needs git
#     and a full clone. In a shallow clone step 2 is skipped and the rhythm is still checked by
#     a test, on the committed snapshot ts/HISTORY.txt.
# PT: Constrói e testa o mini-projeto tdd-kata. O único requisito é o Docker.
#     O passo 1 roda a checagem de tipos e os testes do kata pronto. O passo 2 confere o ritmo do
#     histórico real do git (red, green, refactor), quando o histórico está disponível: precisa
#     de git e de um clone completo. Em um clone raso o passo 2 é pulado e o ritmo ainda é
#     conferido por um teste, no retrato versionado ts/HISTORY.txt.
# "Continue": PowerShell 5.1 treats Docker stderr output as an error; exit codes are checked instead.
$ErrorActionPreference = "Continue"

Set-Location $PSScriptRoot

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
	Write-Error "Docker is required: https://docs.docker.com/get-docker/"
	exit 1
}

$code = 0
try {
	docker compose build
	if ($LASTEXITCODE -ne 0) { throw "build failed" }
	docker compose run --rm ts-test
	if ($LASTEXITCODE -ne 0) { throw "tests failed" }

	$shallow = "true"
	if (Get-Command git -ErrorAction SilentlyContinue) {
		$shallow = git rev-parse --is-shallow-repository 2>$null
	}
	if ($shallow -eq "false") {
		git log --reverse --format="%h %s" -- . | docker compose run --rm -T history
		if ($LASTEXITCODE -ne 0) { throw "the git history does not follow red/green/refactor" }
	}
	else {
		Write-Output "tdd-kata: no full git history here, so only the snapshot ts/HISTORY.txt was checked"
	}
	Write-Output "tdd-kata: all tests passed"
}
catch {
	Write-Output "tdd-kata: $_"
	$code = 1
}
finally {
	docker compose down -v --remove-orphans
}
exit $code
