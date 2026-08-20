# 0026 — Branch protection as an import-ready ruleset (enforcement deferred)

Status: accepted
Date: 2026-08-19

## Context

`main` should only move via PR with the `ci` check green, no force pushes, no deletion,
linear history. The repo is **private on GitHub Free**, where branch protection rules and
rulesets cannot be enforced — GitHub will not block a merge server-side today. The intent
still needs to be executable the moment the plan changes or the repo goes public, not
re-invented from memory.

## Decision

Commit the full policy as an import-ready ruleset at `.github/rulesets/main.json`
(target `~DEFAULT_BRANCH`; rules: `deletion`, `non_fast_forward`,
`required_linear_history`, `pull_request` with squash/rebase merges, and
`required_status_checks` requiring context `ci` with strict up-to-date policy). The JSON
matches the REST request body for creating a ruleset, so it applies either way:

- **UI:** repo → Settings → Rules → Rulesets → New branch ruleset → Import a ruleset →
  select `.github/rulesets/main.json`.
- **CLI:** `gh api repos/{owner}/{repo}/rulesets --method POST --input .github/rulesets/main.json`

Until then the `pre-push` hook running `npm run check` (0024) is the enforced gate.

## Alternatives considered

- **Classic branch protection settings, documented as prose** — same plan restriction on
  private Free repos, and prose steps rot; a committed JSON is testable and diffable, and
  rulesets are the current GitHub direction (classic protection is the legacy system).
- **Make the repo public now to unlock enforcement** — publishing an in-progress interview
  assignment is not the developer's call to make mid-round; the deliverable is a link the
  evaluators receive when it's ready.
- **Upgrade to GitHub Pro/Team for the take-home** — paying for a merge-blocker on a
  single-developer repo whose gates already run locally and in CI buys nothing.
- **Enforce via a merge-blocking workflow hack** (e.g. a workflow that fails unless the
  event is a PR) — CI cannot actually prevent an admin push; it only reports. Pretending
  otherwise is worse than documenting the honest gap.

## Consequences

- Server-side, `main` is currently unprotected: an accidental direct push is possible and
  only convention prevents it. The README trade-offs section states this explicitly.
- When enforcement becomes available, applying the committed ruleset is a one-command
  operation and the required check name (`ci`) already matches the workflow.
- The ruleset requires PRs with zero approvals — reviews are impossible on a solo repo;
  the value is the required green `ci` check, not the approval count.

## References

- About rulesets: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets
- Creating rulesets for a repository (import): https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/creating-rulesets-for-a-repository
- Repository rulesets REST API: https://docs.github.com/en/rest/repos/rules
