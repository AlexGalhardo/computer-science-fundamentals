"""Tick PLAN sections, add CHANGELOG entries, commit, tag and release.

usage: python release.py items.json [extra-tick-code ...]
items.json: [{"tick": ["MP-OS-1"], "name": "cpu-scheduling", "text": "..."}]
Versions continue from the highest existing v0.N.0 tag.
"""
import io, json, re, subprocess, sys

def sh(*a):
    return subprocess.run(a, check=True, capture_output=True, text=True, encoding="utf8").stdout

items = json.load(io.open(sys.argv[1], encoding="utf8"))
tags = [int(m.group(1)) for t in sh("git", "tag").split() if (m := re.fullmatch(r"v0\.(\d+)\.0", t))]
minor = max(tags) + 1

plan = io.open("PLAN.md", encoding="utf8").read()
def tick(code):
    global plan
    a = plan.index(f"#### {code} ")
    ends = [i for i in (plan.find("\n#### ", a + 5), plan.find("\n---", a), plan.find("\n### ", a + 5)) if i != -1]
    b = min(ends) if ends else len(plan)
    plan = plan[:a] + plan[a:b].replace("- [ ] ", "- [x] ") + plan[b:]

rel = []
for it in items:
    for code in it.get("tick", []):
        tick(code) if code != "Part BD" else None
    for line in it.get("tickLines", []):
        assert f"- [ ] {line}" in plan, line
        plan = plan.replace(f"- [ ] {line}", f"- [x] {line}")
    rel.append((f"0.{minor}.0", it["name"], it["text"]))
    minor += 1
io.open("PLAN.md", "w", encoding="utf8", newline="\n").write(plan)

log = io.open("CHANGELOG.md", encoding="utf8").read()
block = "".join(f"## [{v}] - 2026-10-07\n\n### Added\n\n- {t}\n\n" for v, _, t in reversed(rel))
log = log.replace("## [Unreleased]\n\n", "## [Unreleased]\n\n" + block, 1)
io.open("CHANGELOG.md", "w", encoding="utf8", newline="\n").write(log)

subprocess.run("bun run docs:index", shell=True, check=True, capture_output=True)
sh("git", "add", "-A")
sh("git", "commit", "-q", "-m", "docs: record " + ", ".join(n for _, n, _ in rel) + " as complete")
for v, _, _ in rel:
    sh("git", "tag", f"v{v}")
sh("git", "push", "-q", "origin", "main", "--tags")
for v, n, t in rel:
    sh("gh", "release", "create", f"v{v}", "--title", f"v{v}: {n}", "--notes", t + " See CHANGELOG.md.")
    print("released", f"v{v}", n)
