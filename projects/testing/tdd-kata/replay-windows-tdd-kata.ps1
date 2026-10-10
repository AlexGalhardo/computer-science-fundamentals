# EN: Replays the kata. For every step commit it extracts the code exactly as it was in that
#     commit and runs the tests in a throw-away container, with no network. A "red" commit must
#     fail and a "green" or "refactor" commit must pass. The prefix check trusts the commit
#     messages. This script proves that the messages tell the truth.
#     It needs git and a full clone, besides Docker.
# PT: Reencena o kata. Para cada commit de passo, extrai o código exatamente como estava naquele
#     commit e roda os testes em um contêiner descartável, sem rede. Um commit "red" precisa
#     falhar e um commit "green" ou "refactor" precisa passar. A checagem de prefixos confia nas
#     mensagens de commit. Este script prova que as mensagens dizem a verdade.
#     Ele precisa de git e de um clone completo, além do Docker.
# ES: Reproduce el kata. Para cada commit de paso, extrae el código exactamente como estaba en ese
#     commit y ejecuta las pruebas en un contenedor desechable, sin red. Un commit "red" debe
#     fallar y un commit "green" o "refactor" debe pasar. La comprobación de prefijos confía en los
#     mensajes de commit. Este script prueba que los mensajes dicen la verdad.
#     Necesita git y un clon completo, además de Docker.
$ErrorActionPreference = "Continue"

Set-Location $PSScriptRoot

$image = "oven/bun:1.4.2"
$wrong = 0
$steps = 0

foreach ($line in (git log --reverse --format="%h %s" -- .)) {
	$sha, $subject = $line -split " ", 2
	if ($subject -like "test(tdd-kata): red - *") { $expected = "fail" }
	elseif ($subject -like "feat(tdd-kata): green - *" -or $subject -like "refactor(tdd-kata): *") { $expected = "pass" }
	else { continue }
	$steps++
	# EN: The archive is binary. A PowerShell 5.1 pipe would re-encode it as text and corrupt it,
	#     so the pipe is made by cmd.exe, which passes the bytes through untouched.
	# PT: O arquivo é binário. Um pipe do PowerShell 5.1 o recodificaria como texto e o
	#     corromperia, então o pipe é feito pelo cmd.exe, que repassa os bytes intactos.
	# ES: El archivo es binario. Un pipe de PowerShell 5.1 lo recodificaría como texto y lo
	#     corrompería, así que el pipe lo hace cmd.exe, que pasa los bytes intactos.
	cmd /c "git archive $sha ts | docker run --rm -i --network none $image sh -c `"mkdir /home/bun/kata && cd /home/bun/kata && tar -xf - && cd ts && bun test`" >NUL 2>&1"
	$actual = if ($LASTEXITCODE -eq 0) { "pass" } else { "fail" }
	if ($actual -eq $expected) {
		Write-Output "ok    $sha tests $actual  $subject"
	}
	else {
		Write-Output "WRONG $sha tests $actual, expected $expected  $subject"
		$wrong++
	}
}

Write-Output "$steps steps replayed, $wrong wrong"
if ($steps -eq 0 -or $wrong -ne 0) { exit 1 }
exit 0
