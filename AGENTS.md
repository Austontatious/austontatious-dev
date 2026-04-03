# AGENTS.md

This repo follows:
- `/home/unix/codex-standards/BASELINE.md`
Repo-specific overrides and invariants below.

## Muninn Memory Integration (Required)
Use Muninn as durable memory for decisions, constraints, runbooks, interfaces, and validated lessons.

On task start (before substantial edits):
- Call `muninn.spaces.resolve` with current `cwd`.
- Preferred: call `muninn.rehydrate.bundle` with:
  - `lens`: `{space:"auto", cwd:"<abs-path>", scope:"soft", kinds:["decision","constraint","runbook","interface"], limit:12}`
  - `query`: short task summary.
- Compatibility sequence (when bundle is unavailable):
  - `muninn.cards.recent` with `scope:"strict"` and the same kinds.
  - `muninn.cards.search` with `scope:"soft"` and short task query.
- Use retrieved memory to inform plan and edits before implementing.

On meaningful completion:
- Write durable outcomes via `muninn.cards.upsert` (target `1-3` cards per task).
- Use `muninn.cards.supersede` or `muninn.cards.merge` when refining existing memory, not duplicate cards.
- Include concise `summary`, durable `body`, and evidence refs when available (file path, test, commit, log).

Memory hygiene:
- Do not persist transient reasoning, scratch notes, or speculative output.
- Prefer `strict` scope by default; use `soft` only when cross-project recall is intentional.

## Mission
- Maintain and ship the `austontatious.dev` site as a clean, readable portfolio and project surface.
- Prefer small, reversible edits that preserve the existing visual language unless a page-specific redesign is explicitly requested.

## Repo-Specific Invariants
- Treat this repo as the live website source of truth; changes should be production-safe and easy to verify locally with `npm run build`.
- Preserve existing site-wide theming and navigation patterns unless the task is intentionally page-specific.
- Keep copy sharp and credible. Do not introduce startup fluff, inflated claims, or vague marketing language.
- Favor maintainable Astro/CSS changes over one-off hacks or duplicated styling patterns.

## Definition of Done
- `npm run build` passes.
- If standards scaffold files change, run `python3 -m pytest -q tests/test_codex_standards.py --noconftest` and `python3 evals/runner.py --check`.
- If `AGENTS.md` or `AGENT.md` changes, run `bash /mnt/data/.codex_ssot/v1/tools/agents_lint.sh`.
- For user-facing page updates, verify the relevant live route after deploy.

## Architecture and Operations Source of Truth
- Architecture truth: `ARCHITECTURE_CHECKPOINT.md` (if present)
- Operational procedures: `RUNBOOK.md` (if present)

## Overrides
- `GIT_POLICY: conservative`
- rationale: default non-destructive posture.
