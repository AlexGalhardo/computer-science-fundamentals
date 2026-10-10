# Blind review: continuous-integration

- Date: 2026-10-10
- Questions answered without the answer key: 100
- Agreements: 100
- Disagreements: 0

Every disagreement below must end with a resolution: `key kept`, `key fixed` or `question rewritten`, and the reason.

No disagreement.

<!-- quiz:compare keeps everything below this line -->

## How the review was run

One round, in English, by a fresh reviewer agent that received only the blind file (`bun run quiz:blind continuous-integration`) and never saw `quiz/content/` or the mini-projects.

| Round | Blind file | Result |
| --- | --- | --- |
| 1 | `quiz/.review/continuous-integration.blind.json` (English) | 100 answered, 0 disagreements, 11 questions flagged with a note |

The reviewer also checked facts against the official documentation. It could not confirm some matrix and `GITHUB_TOKEN` facts on the web, so those were checked again after the round, together with every question changed below.

Pages cited by the reviewer:

- <https://docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching>
- <https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax>

Pages checked after the round (2026-10-10):

- <https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax>: `jobs.<job_id>.strategy.matrix.include` and `exclude`, `strategy.fail-fast`, `jobs.<job_id>.outputs`, `on.schedule`, `jobs.<job_id>.environment`
- <https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/run-job-variations>: handling failures in a matrix
- <https://docs.github.com/en/actions/concepts/security/github_token>: lifetime of the token and the events it does not trigger
- <https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets>: secrets and forks
- <https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository>: fork pull request settings of private repositories
- <https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments>: deployment branches and tags
- <https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/troubleshooting-required-status-checks>: skipped workflow against skipped job
- <https://github.com/actions/upload-artifact> (README of v4): unique artifact names

The fixes below were made after the round. None changes a key or the position of a correct alternative. Every change was made in English, Portuguese and Spanish. `bun run quiz:validate continuous-integration` passes after them with no warning.

## Notes raised by the reviewer and their resolution

| Question | Note | Resolution |
| --- | --- | --- |
| `continuous-integration-caching-artifacts-06` | Correct but incomplete: a pull request run whose base branch is `feature/a` can also restore the cache | question rewritten: the statement now says "Leaving pull request runs aside", and the explanation of the correct alternative says why (a pull request run also restores caches of its base branch). Confirmed in the dependency caching page: "Workflow runs can restore caches created in either the current branch or the default branch", and pull requests also reach the base branch. Key kept |
| `continuous-integration-caching-artifacts-10` | The correct alternative is close to a sentence of the GitHub docs, and it is the only one that describes a real mechanism | question rewritten: the correct alternative is reworded in our own words (a workflow run for any pull request can restore the cache and its code can read the token). The distractor "every cache is published on the internet" became the confusion with artifacts (a download link on the page of the run), a mechanism that exists for another feature. Key kept |
| `continuous-integration-custom-actions-reusable-workflows-08` | "Stay safe from breaking changes" is a promise of SemVer discipline, not a guarantee, and a moving tag is the risk of `supply-chain-security-01` | question rewritten: the correct alternative no longer promises safety (users of `@v4` get the 4.x releases, without the breaking changes of `v5`), and its explanation says that this is a convention that depends on the author and that a moving tag is the risk removed by pinning a commit SHA. Key kept |
| `continuous-integration-quality-gates-07` | Overlaps with `workflows-events-jobs-steps-09`: the pair gives hints to each other | key kept: the leak came from the other question, whose distractor described the rule that is the answer here. That distractor was replaced (see `workflows-events-jobs-steps-09`). The distractor "stays pending for ever" stays here because it is the mistake this question is about, and it is wrong in this case. Both behaviours confirmed in the troubleshooting page: a skipped workflow leaves the check pending, a job skipped by a conditional reports success |
| `continuous-integration-runners-matrix-03` | The explanation should state that `include` cannot overwrite original matrix values | question rewritten (explanation and concept only): both now state the rule. Workflow syntax page: the pairs of an `include` object are added to each combination "if none of the key:value pairs overwrite any of the original matrix values", otherwise "a new matrix combination will be created", and "the original matrix values will not be overwritten, but added matrix values can be overwritten". "All `include` combinations are processed after `exclude`." Worked again: 4 combinations, minus 1 excluded, plus 1 new combination, 4 jobs. Key kept |
| `continuous-integration-runners-matrix-10` | The tail "so it cannot be relied on" makes the correct alternative the only hedged and longer one | question rewritten: the tail was removed from the alternative and moved to the explanation. Workflow syntax page, `jobs.<job_id>.outputs`: "Actions does not guarantee the order that matrix jobs will run in. Ensure that the output name is unique, otherwise the last matrix job that runs will override the output value." Key kept |
| `continuous-integration-secrets-environments-permissions-06` | Depends on an unstated convention: a private repository can send secrets and write tokens to fork pull requests | question rewritten: the statement now says "In a public repository with default settings", and the concept mentions the settings of private repositories, which are off by default. Key kept |
| `continuous-integration-secrets-environments-permissions-08` | The token expires when the job finishes or after its maximum lifetime (24 hours) | key kept, explanation corrected: the explanation said "24 hours at most". The current page says the token "expires when the job finishes or after its effective maximum lifetime": 6 hours on a GitHub-hosted runner, the maximum job time, and up to 24 hours on a self-hosted runner. The alternative did not change |
| `continuous-integration-secrets-environments-permissions-09` | The wording "events caused by the `GITHUB_TOKEN` do not start new runs" is too broad, because the rule has exceptions | question rewritten: the correct alternative now speaks of the push only ("a push made with the `GITHUB_TOKEN` does not start new runs"). The explanation and the concept list the exceptions of the current page: `workflow_dispatch` and `repository_dispatch` always create runs, and a pull request opened or updated with the token gets runs waiting for approval. The concept said that opened pull requests start no run, which is no longer exact, and was corrected. Key kept |
| `continuous-integration-workflows-events-jobs-steps-07` | `schedule` now accepts an optional `timezone`, and the explanation should say so | question rewritten (explanation and concept only): both now mention the optional `timezone` key with an IANA name. Docs: "By default, scheduled workflows run in UTC. You can optionally specify a timezone using an IANA timezone string". The statement already said "with the default settings". Key kept |
| `continuous-integration-workflows-events-jobs-steps-09` | Distractor 1 describes the behaviour that is the correct answer of `quality-gates-07` | question rewritten: distractor 1 is now "the check is reported as failed, since a required workflow that is filtered out counts as an error", a different misconception. The contrast with a skipped job moved to its explanation, which is shown only after the answer. Key kept |

## Facts the reviewer could not confirm

| Question | Fact | What the documentation says |
| --- | --- | --- |
| `runners-matrix-03` | `include` adds a job when it would overwrite an original value | Confirmed, see the row above |
| `runners-matrix-04` | `fail-fast` is `true` by default and cancels the other matrix jobs | Confirmed: with `fail-fast: true`, GitHub "will cancel all in-progress and queued jobs in the matrix if any job in the matrix fails. This property defaults to `true`". Key kept |
| `runners-matrix-07` | `continue-on-error: ${{ matrix.experimental }}` lets the run pass | Confirmed: the documentation has the same example, and `continue-on-error` is described as "Set to `true` to allow a workflow run to pass when this job fails". Key kept |
| `runners-matrix-10` | The last matrix job to run sets the output | Confirmed, see the row above |
| `secrets-environments-permissions-08` | Lifetime of the `GITHUB_TOKEN` | Confirmed, and the explanation was corrected, see the row above |
| `secrets-environments-permissions-09` | A push made with the `GITHUB_TOKEN` starts no run | Confirmed, see the row above |
| `secrets-environments-permissions-11` | A job from a branch that is not allowed cannot deploy to the environment | Confirmed in part: "Only branches and tags that match your specified name patterns can deploy to the environment", and "All deployment protection rules must pass before a job referencing the environment is sent to a runner". The pages do not say in words that the job is marked as failed, which is what GitHub shows in practice. They also say that administrators can bypass protection rules unless the environment forbids it, and do not say whether that covers the branch rule. Key kept, no change |
| `caching-artifacts-09` | Two uploads with the same artifact name conflict in v4 | Confirmed in the README: "Artifact names must be unique since each created artifact is idempotent so multiple jobs cannot modify the same artifact", and in a matrix "you will encounter conflict errors". The README also has an `overwrite` input, so the explanation of the distractor "each upload replaces the previous one" now says that this happens only with `overwrite: true`. Key kept |

## Source citations

The chapter numbers of Humble and Farley's Continuous Delivery cited in `quality-gates.json` and `deployment-strategies.json` (2, 5, 7, 9, 10 and 12) were checked against the table of contents of the publisher (<https://www.informit.com/store/continuous-delivery-reliable-software-releases-through-build-9780321601919>). They carry no section number: the text in brackets is the subject inside the chapter. One citation was made clearer:

- `continuous-integration-deployment-strategies-10`: "ch. 9 (capacity)" is now "ch. 9 (Testing Nonfunctional Requirements: capacity)", the title of the chapter.

## Questions changed after the round

The reviewer did not see these in their new form.

- What is asked or what an alternative says changed: `caching-artifacts-10`, `workflows-events-jobs-steps-09`.
- A convention was added to the statement, or the correct alternative was reworded without a new claim: `caching-artifacts-06`, `custom-actions-reusable-workflows-08`, `runners-matrix-10`, `secrets-environments-permissions-06`, `secrets-environments-permissions-09`.
- Only the explanation or the concept changed: `caching-artifacts-09`, `runners-matrix-03`, `secrets-environments-permissions-08`, `workflows-events-jobs-steps-07`.

## Second round (rewritten questions only)

The questions rewritten after the first round were exported again (`bun run quiz:blind continuous-integration`) and the 7 of them went to a fresh reviewer agent that received only those questions, with no answer key and no access to `quiz/content/`. Its answers replaced the first-round answers of the same ids in `quiz/.review/continuous-integration.answers.json`, and `bun run quiz:compare` was run again: 100 questions, 0 disagreements.

| Question | Note of the second reviewer | Resolution |
| --- | --- | --- |
| `continuous-integration-caching-artifacts-10` | The correct alternative said that a run for any pull request can restore the cache, which is broader than the documented scope: a pull request run restores caches of its own branch, of its base branch and of the default branch | question rewritten: the alternative now says a pull request aimed at the branch of the cache, even from a fork, can restore it. Wording only, key kept, same three languages. Source: <https://docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching> |
