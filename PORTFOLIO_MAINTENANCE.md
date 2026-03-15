# Portfolio Maintenance

This document is the operational runbook for keeping `austontatious.dev` current.

## Scope

- Repo: `/mnt/data/austontatious-dev`
- Deployment target: Cloudflare Workers + custom domains
- Canonical URL: `https://www.austontatious.dev/`

## Source of Truth

Primary editable files:

- `scripts/generate_projects_catalog.cjs`
- `src/data/family_tree.json`
- `src/pages/index.astro`
- `src/pages/projects/[slug].astro`
- `src/components/FamilyTreeNode.astro`
- `src/styles/global.css`
- `src/components/BaseHead.astro`
- `src/consts.ts`
- `wrangler.json`

Generated files (do not edit manually):

- `src/data/repos.raw.json`
- `src/data/repos.localmap.json`
- `src/data/projects.generated.json`

## Regenerate Project Catalog

Run from repo root:

```bash
npm run projects:gen
```

Validation-only mode (fails if generated files are stale):

```bash
npm run projects:check
```

Generation pipeline:

1. Pull repo inventory from GitHub org/user `Austontatious`.
2. Exclude `Gauntlet-010` and `Gauntlet-005`.
3. Map repos to local clones first.
4. Clone missing public repos to cache: `/mnt/data/_repo_cache/Austontatious`.
5. Build `projects.generated.json` and enforce schema checks.

## Build + Verify

```bash
npm run projects:check
npm run build
```

Optional local smoke test:

```bash
npm run dev
```

## Deploy

Use local `.env` (ignored by git):

```bash
env -u CF_API_TOKEN npx wrangler deploy --env-file .env
```

Equivalent npm script:

```bash
npm run deploy
```

## Post-Deploy Checks

```bash
curl -I https://www.austontatious.dev
curl -I https://austontatious.dev
curl -s https://www.austontatious.dev | head
```

Expected:

- Canonical host responds.
- Redirect behavior is consistent with Cloudflare rules.
- Homepage HTML renders current snapshot + project index.

## Secret Hygiene

- Keep `.env` local-only.
- Never commit API tokens.
- `.env` must remain in `.gitignore`.
