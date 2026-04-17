# Runbook

## Local Development
1. Install dependencies:
```bash
pnpm install
```
2. Configure env:
```bash
cp apps/web/.env.example apps/web/.env.local
```
3. Start app:
```bash
pnpm dev
```

## Required Quality Gates
Run before pushing:
```bash
pnpm lint
pnpm typecheck
pnpm test
```

For release readiness:
```bash
pnpm test:e2e
pnpm test:visual
```

## Vercel Deployment
- Root directory: `apps/web`
- Required env vars:
  - `NEXT_PUBLIC_AEPSY_GRAPHQL_ENDPOINT`

## Incident Quick Checks
1. GraphQL failures:
- Verify endpoint in `apps/web/.env.local`.
- Check browser network tab and API response payload.

2. Audio not restored after refresh:
- Verify IndexedDB availability and storage quota.
- Confirm `audioStorageKey` exists in persisted Zustand state.

3. UI regressions:
- Run visual tests:
```bash
pnpm test:visual
```

## Rollback
- Re-deploy previous successful Vercel deployment from dashboard.
- If needed, revert commit on `main` and redeploy.

## Ownership and Review
- CODEOWNERS controls default reviewers by folder.
- PRs must include requirement-fit evidence and test evidence.
