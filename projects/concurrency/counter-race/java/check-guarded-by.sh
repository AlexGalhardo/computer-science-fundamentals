#!/usr/bin/env sh
# EN: The JDK has no dynamic race detector like `go test -race`. The usual Java tooling is
#     static: the field declares its lock with @GuardedBy, and the Error Prone compiler plugin
#     reports every access made without that lock. This script runs the check twice: it must
#     flag BuggyCounter and stay silent on the fixed counters.
# PT: O JDK não tem um detector dinâmico de corrida como o `go test -race`. A ferramenta usual
#     em Java é estática: o campo declara sua trava com @GuardedBy, e o plugin de compilador
#     Error Prone aponta todo acesso feito sem essa trava. Este script roda a verificação duas
#     vezes: ela precisa acusar o BuggyCounter e ficar calada nos contadores corrigidos.
# ES: El JDK no tiene un detector dinámico de carreras como `go test -race`. La herramienta
#     habitual en Java es estática: el campo declara su lock con @GuardedBy, y el plugin de
#     compilador Error Prone señala todo acceso hecho sin ese lock. Este script ejecuta la
#     verificación dos veces: debe acusar a BuggyCounter y callar en los contadores corregidos.
set -eu

cd "$(dirname "$0")"
src=src/main/java/counterrace
jars=$(find build/errorprone -name '*.jar' | tr '\n' ':')
out=$(mktemp -d)

# EN: Error Prone runs inside javac and needs access to compiler internals (JDK 16 and later).
# PT: O Error Prone roda dentro do javac e precisa de acesso a partes internas do compilador
#     (JDK 16 em diante).
# ES: Error Prone se ejecuta dentro de javac y necesita acceso a partes internas del compilador
#     (JDK 16 en adelante).
check() {
	javac \
		-J--add-exports=jdk.compiler/com.sun.tools.javac.api=ALL-UNNAMED \
		-J--add-exports=jdk.compiler/com.sun.tools.javac.file=ALL-UNNAMED \
		-J--add-exports=jdk.compiler/com.sun.tools.javac.main=ALL-UNNAMED \
		-J--add-exports=jdk.compiler/com.sun.tools.javac.model=ALL-UNNAMED \
		-J--add-exports=jdk.compiler/com.sun.tools.javac.parser=ALL-UNNAMED \
		-J--add-exports=jdk.compiler/com.sun.tools.javac.processing=ALL-UNNAMED \
		-J--add-exports=jdk.compiler/com.sun.tools.javac.tree=ALL-UNNAMED \
		-J--add-exports=jdk.compiler/com.sun.tools.javac.util=ALL-UNNAMED \
		-J--add-opens=jdk.compiler/com.sun.tools.javac.code=ALL-UNNAMED \
		-J--add-opens=jdk.compiler/com.sun.tools.javac.comp=ALL-UNNAMED \
		-XDcompilePolicy=simple --should-stop=ifError=FLOW \
		-processorpath "$jars" -classpath "$jars" \
		'-Xplugin:ErrorProne -XepDisableAllChecks -Xep:GuardedBy:ERROR' \
		-d "$out" "$@" 2>&1
}

echo "== Error Prone GuardedBy on the BUGGY counter (must be flagged) =="
if buggy=$(check "$src/Counter.java" "$src/BuggyCounter.java"); then
	echo "FAIL: Error Prone did not flag BuggyCounter"
	exit 1
fi
echo "$buggy"
echo "$buggy" | grep -q '\[GuardedBy\]' || { echo "FAIL: no GuardedBy finding in the output"; exit 1; }

echo "== Error Prone GuardedBy on the FIXED counters (must be silent) =="
if ! fixed=$(check "$src/Counter.java" "$src/MutexCounter.java" \
	"$src/AtomicCounter.java" "$src/QueueCounter.java"); then
	echo "$fixed"
	echo "FAIL: Error Prone flagged a fixed counter"
	exit 1
fi
if [ -n "$fixed" ]; then
	echo "$fixed"
	echo "FAIL: expected no output for the fixed counters"
	exit 1
fi
echo "(no findings)"
echo "race check passed: buggy flagged, fixes silent"
