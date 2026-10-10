# EN: PowerShell twin of demo-branches.sh. Creates the demonstration branches of this lesson: one
#     branch per quality gate, each with the prepared change of demo/<gate>/change/ on top of
#     `main`, so that the CI run of that branch fails exactly that gate.
#       ./demo-branches.ps1 [<gate> ...]          dry run (the default): nothing leaves the machine
#       ./demo-branches.ps1 -Push [<gate> ...]    pushes demo/ci-fails-<gate> and starts CI on it
#     Safety rules: it works in a temporary clone and only reads the working tree it is launched
#     from, it refuses to run when `origin` is not the repository of this project, without -Push
#     it never talks to the network, and with -Push it first checks that the local `main` is the
#     `main` already on GitHub. A push to a demo/ branch does not start the workflow, so the
#     script starts a manual run with the GitHub CLI (`gh`) and prints its URL.
# PT: Gêmeo em PowerShell do demo-branches.sh. Cria os branches de demonstração desta lição: um
#     branch por portão de qualidade, cada um com a mudança preparada de demo/<gate>/change/ em
#     cima da `main`, para que a execução do CI naquele branch falhe exatamente naquele portão.
#       ./demo-branches.ps1 [<gate> ...]          simulação (o padrão): nada sai da máquina
#       ./demo-branches.ps1 -Push [<gate> ...]    envia demo/ci-fails-<gate> e dispara o CI nele
#     Regras de segurança: trabalha em um clone temporário e só lê a árvore de trabalho de onde é
#     chamado, recusa-se a rodar quando `origin` não é o repositório deste projeto, sem -Push
#     nunca usa a rede, e com -Push antes confere se a `main` local é a `main` que já está no
#     GitHub. Um push para um branch demo/ não dispara o workflow, então o script dispara uma
#     execução manual com a CLI do GitHub (`gh`) e imprime a URL dela.
# ES: Gemelo en PowerShell de demo-branches.sh. Crea las ramas de demostración de esta lección:
#     una rama por puerta de calidad, cada una con el cambio preparado de demo/<gate>/change/
#     encima de `main`, para que la ejecución de CI en esa rama falle exactamente en esa puerta.
#       ./demo-branches.ps1 [<gate> ...]          simulación (por defecto): nada sale de la máquina
#       ./demo-branches.ps1 -Push [<gate> ...]    envía demo/ci-fails-<gate> y lanza CI en ella
#     Reglas de seguridad: trabaja en un clon temporal y solo lee el árbol de trabajo desde donde
#     se lanza, se niega a correr cuando `origin` no es el repositorio de este proyecto, sin
#     -Push nunca usa la red, y con -Push primero comprueba que la `main` local sea la `main` que
#     ya está en GitHub. Un push a una rama demo/ no lanza el workflow, así que el script lanza
#     una ejecución manual con la CLI de GitHub (`gh`) e imprime su URL.
param(
	[switch]$Push,
	[Parameter(ValueFromRemainingArguments = $true)]
	[string[]]$Gates
)

# "Continue": PowerShell 5.1 treats what git writes to stderr as an error; exit codes are checked instead.
$ErrorActionPreference = "Continue"

$repository = "AlexGalhardo/computer-science-fundamentals"
$allGates = @(
	"biome", "markdownlint", "typecheck", "unit-tests", "quiz-validate", "docs-index",
	"format-python", "format-go", "format-rust", "format-cpp", "format-elixir",
	"quiz-e2e", "dashboards", "mini-project"
)

function Stop-Script([string]$message) {
	Write-Output "demo-branches: $message"
	exit 1
}

if ($null -eq $Gates -or $Gates.Count -eq 0) { $Gates = $allGates }
foreach ($gate in $Gates) {
	if ($allGates -notcontains $gate) {
		Write-Output "usage: demo-branches.ps1 [-Push] [<gate> ...]"
		Write-Output "gates: $($allGates -join ' ')"
		Stop-Script "unknown gate: $gate"
	}
}

if (-not (Get-Command git -ErrorAction SilentlyContinue)) { Stop-Script "git is required" }
$root = git -C $PSScriptRoot rev-parse --show-toplevel
if ($LASTEXITCODE -ne 0) { Stop-Script "this folder is not inside a git repository" }

# EN: Rule 2. The address of `origin` must end in the name of this repository, whether it is
#     written as HTTPS or as SSH. A fork or any other remote stops the script here.
# PT: Regra 2. O endereço do `origin` precisa terminar no nome deste repositório, escrito como
#     HTTPS ou como SSH. Um fork ou qualquer outro remoto para o script aqui.
# ES: Regla 2. La dirección de `origin` debe terminar en el nombre de este repositorio, escrita
#     como HTTPS o como SSH. Un fork o cualquier otro remoto detiene el script aquí.
$origin = git -C $root remote get-url origin
if ($LASTEXITCODE -ne 0) { Stop-Script "this repository has no remote called origin" }
if ($origin -notmatch ("github\.com[:/]" + [regex]::Escape($repository) + "(\.git)?$")) {
	Stop-Script "origin is $origin, not github.com/$repository`: refusing to run"
}

$base = git -C $root rev-parse --verify --quiet refs/heads/main
if ($LASTEXITCODE -ne 0) { Stop-Script "there is no local branch called main" }

if ($Push) {
	if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
		Stop-Script "the GitHub CLI (gh) is required with -Push: https://cli.github.com/"
	}
	# EN: Rule 4. A demonstration branch must differ from the published `main` by one change only.
	# PT: Regra 4. Um branch de demonstração precisa diferir da `main` publicada por uma mudança só.
	# ES: Regla 4. Una rama de demostración debe diferir de la `main` publicada por un solo cambio.
	$remoteMain = (git ls-remote $origin refs/heads/main) -split "\s+" | Select-Object -First 1
	if ($remoteMain -ne $base) {
		Stop-Script "local main ($base) is not the main on GitHub ($remoteMain): push or pull main first"
	}
}

# EN: Rule 1. Everything from here on happens in a clone inside a temporary folder, removed at
#     the end. Cloning reads the repository and writes nothing into it.
# PT: Regra 1. Tudo daqui em diante acontece em um clone dentro de uma pasta temporária, removida
#     no fim. Clonar lê o repositório e não escreve nada nele.
# ES: Regla 1. Todo de aquí en adelante ocurre en un clon dentro de una carpeta temporal,
#     eliminada al final. Clonar lee el repositorio y no escribe nada en él.
$temp = Join-Path ([System.IO.Path]::GetTempPath()) ("ci-demo-" + [guid]::NewGuid().ToString("N"))
$clone = Join-Path $temp "repository"
$code = 0
$table = @()
try {
	New-Item -ItemType Directory -Force $temp | Out-Null
	git clone --quiet --no-checkout $root $clone
	if ($LASTEXITCODE -ne 0) { throw "git clone failed" }
	git -C $clone remote set-url origin $origin
	foreach ($key in @("user.name", "user.email")) {
		$value = git -C $root config $key
		if ($value) { git -C $clone config $key $value }
	}

	foreach ($gate in $Gates) {
		$branch = "demo/ci-fails-$gate"
		$change = Join-Path $PSScriptRoot "demo\$gate\change"
		if (-not (Test-Path $change)) { throw "there is no prepared change in demo/$gate/change" }
		git -C $clone checkout --quiet --force -B $branch $base
		if ($LASTEXITCODE -ne 0) { throw "git checkout of $branch failed" }
		# EN: The stored files end in `.fixture` so the real linters do not see them. Here each
		#     one is copied to its real place, without the suffix.
		# PT: Os arquivos guardados terminam em `.fixture` para os linters reais não os
		#     enxergarem. Aqui cada um é copiado para o seu lugar de verdade, sem o sufixo.
		# ES: Los archivos guardados terminan en `.fixture` para que los linters reales no los
		#     vean. Aquí cada uno se copia a su lugar real, sin el sufijo.
		$changeRoot = (Resolve-Path $change).Path
		foreach ($file in Get-ChildItem -Recurse -File -Filter "*.fixture" $changeRoot) {
			$relative = $file.FullName.Substring($changeRoot.Length + 1)
			$relative = $relative.Substring(0, $relative.Length - ".fixture".Length).Replace("\", "/")
			$target = Join-Path $clone $relative
			New-Item -ItemType Directory -Force (Split-Path $target) | Out-Null
			Copy-Item -Force $file.FullName $target
			git -C $clone add -- $relative
			if ($LASTEXITCODE -ne 0) { throw "git add of $relative failed" }
		}
		git -C $clone commit --quiet -m "test(ci): fail the $gate gate on purpose" -m "Demonstration branch of projects/continuous-integration/ci-pipeline. Never merge it."
		if ($LASTEXITCODE -ne 0) { throw "git commit on $branch failed" }
		$sha = git -C $clone rev-parse HEAD
		Write-Output ""
		Write-Output "=== $branch"
		git -C $clone show --stat --format="%h %s" HEAD

		if (-not $Push) {
			Write-Output "dry run: would push $branch to $origin and start the CI workflow on it"
			continue
		}

		git -C $clone push --quiet --force origin $branch
		if ($LASTEXITCODE -ne 0) { throw "git push of $branch failed" }
		gh workflow run CI --repo $repository --ref $branch
		if ($LASTEXITCODE -ne 0) { throw "gh workflow run failed for $branch" }
		# EN: GitHub takes a few seconds to create the run, so the script asks until it appears.
		# PT: O GitHub leva alguns segundos para criar a execução, então o script pergunta até ela aparecer.
		# ES: GitHub tarda unos segundos en crear la ejecución, así que el script pregunta hasta que aparece.
		$url = ""
		for ($try = 0; $try -lt 30 -and -not $url; $try++) {
			Start-Sleep -Seconds 2
			$runs = gh run list --repo $repository --workflow CI --branch $branch --event workflow_dispatch --limit 5 --json url,headSha | ConvertFrom-Json
			$url = ($runs | Where-Object { $_.headSha -eq $sha } | Select-Object -First 1).url
		}
		if (-not $url) { $url = "(run not found yet: gh run list --repo $repository --branch $branch)" }
		Write-Output "run: $url"
		$table += "| ``$gate`` | ``$branch`` | $url |"
	}

	Write-Output ""
	if ($Push) {
		Write-Output "Rows for the `"failed run`" column of the READMEs:"
		$table | ForEach-Object { Write-Output $_ }
	}
	else {
		Write-Output "dry run finished: nothing was pushed. Run again with -Push to publish the branches."
	}
}
catch {
	Write-Output "demo-branches: $_"
	$code = 1
}
finally {
	if (Test-Path $temp) { Remove-Item -Recurse -Force $temp }
}
exit $code
