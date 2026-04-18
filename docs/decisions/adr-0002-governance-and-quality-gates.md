# ADR-0002: Governance and Quality Gates

## Status

Accepted

## Context

As the repository grows, technical quality cannot rely only on convention. The project needs enforceable guardrails for architecture boundaries, PR quality, and local developer workflows.

## Decision

1. Add Husky hooks:

- `pre-commit`: run `lint-staged` for fast staged-file quality.
- `pre-push`: run `pnpm lint` and `pnpm typecheck`.

2. Add repository governance templates:

- `CODEOWNERS` for review ownership.
- `PULL_REQUEST_TEMPLATE.md` for requirement-fit and validation evidence.

3. Add architecture and operations docs:

- `docs/architecture.md` for boundaries and layer rules.
- `docs/runbook.md` for local run, release checks, and incident triage.

4. Add ESLint boundary enforcement in web app:

- disallow relative imports in `apps/web/src` (use `@/` alias).
- disallow feature modules importing from `app/layout` layers.

## Consequences

### Positive

- More consistent architecture and import discipline.
- Faster feedback before CI.
- Standardized PR quality and ownership.

### Negative

- Slightly longer push cycle due to local checks.
- Developers must adapt to hook-enforced workflow.
