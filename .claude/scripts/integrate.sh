#!/usr/bin/env sh
# Merges a finished worktree branch into main and reruns the checks the main session owes
# before ticking PLAN.md. Usage, from the repository root:
#   sh .claude/scripts/integrate.sh <agent-id> <area-slug> [mini-project ...]
# It stops at the first failing check. Releasing is a separate step (release.py).
set -eu

agent="$1"
area="$2"
shift 2

if ! git merge -q --no-edit "worktree-agent-$agent"; then
	# The only expected conflict is in the generated status pages: regenerate them.
	git checkout --ours docs/en/README.md docs/pt/README.md
	bun run docs:index >/dev/null
	git add docs/en/README.md docs/pt/README.md
	if [ -n "$(git diff --name-only --diff-filter=U)" ]; then
		echo "unresolved conflicts:" >&2
		git diff --name-only --diff-filter=U >&2
		exit 1
	fi
	git commit -q --no-edit
fi

bun run quiz:validate --strict | grep -E "warning|questions,"
bunx biome check . | tail -n 1

for name in "$@"; do
	log="${TMPDIR:-${TEMP:-/tmp}}/setup-$name.log"
	if (cd "projects/$area/$name" && sh "./setup-unix-$name.sh" >"$log" 2>&1); then
		echo "$name: setup passed"
	else
		echo "$name: setup FAILED, see $log" >&2
		exit 1
	fi
done
