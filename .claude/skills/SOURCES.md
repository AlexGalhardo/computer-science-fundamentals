# Skill sources

The skills in this folder are third-party work, copied here as Markdown only, one folder per skill (`<skill>/SKILL.md`, its supporting `.md` files, and the `LICENSE` of the repository it came from). No scripts, hooks, installers or binaries were copied. They keep the licence of their authors; this repository is MIT.

Claude Code loads each folder as a project skill. The rules of this repository always win over anything written inside a skill: see `.claude/rules/external-skills.md`.

| Source repository | Commit copied | Licence | Skills |
| --- | --- | --- | --- |
| [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) | `1401c8b` | see `LICENSE` in each folder | api-and-interface-design, browser-testing-with-devtools, ci-cd-and-automation, code-review-and-quality, code-simplification, constraint-driven-development, context-engineering, debugging-and-error-recovery, deprecation-and-migration, documentation-and-adrs, doubt-driven-development, frontend-ui-engineering, git-workflow-and-versioning, idea-refine, incremental-implementation, interview-me, observability-and-instrumentation, performance-optimization, planning-and-task-breakdown, security-and-hardening, shipping-and-launch, source-driven-development, spec-driven-development, test-driven-development, using-agent-skills |
| [obra/superpowers](https://github.com/obra/superpowers) | `8ca22db` | see `LICENSE` in each folder | brainstorming, diagnosing-superpowers, dispatching-parallel-agents, executing-plans, finishing-a-development-branch, receiving-code-review, requesting-code-review, subagent-driven-development, superpowers-test-driven-development, systematic-debugging, using-git-worktrees, using-superpowers, verification-before-completion, writing-plans, writing-skills |
| [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail) | `552acd5` | see `LICENSE` in each folder | ponytail, ponytail-audit, ponytail-debt, ponytail-gain, ponytail-help, ponytail-review |
| [multica-ai/andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills) | `2c60614` | MIT, as declared in the README of that repository, which ships no `LICENSE` file | karpathy-guidelines |

## Notes

- `superpowers-test-driven-development` is the `test-driven-development` skill of superpowers, renamed (folder and `name` field) because agent-skills has a skill with the same name.
- Some skills mention scripts or files of their original repository. Those were not copied: use only the text guidance.
- [Graphify-Labs/graphify](https://github.com/Graphify-Labs/graphify) was pinned here before as a submodule. It is a Python command-line tool, not a skill, so it was removed.

## Updating a skill

Copy the new `SKILL.md` and supporting Markdown files from the source repository over the folder, keep the `LICENSE`, and update the commit in the table above.
