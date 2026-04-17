# Aepsy React FE Take-home

A monorepo implementation of Aepsy's React FE assignment, focused on:
1. Stable voice capture flow
2. Topic suggestion and selection
3. Ranked psychologist search with pagination

## Demo Flow
1. Record or upload an audio file
2. Analyze audio with provided `useAudioTranscriber` helper
3. Select one or more topics
4. Fetch psychologists from GraphQL and load more
5. Refresh or navigate back/forward without losing progress

## Tech Stack
- Monorepo: `pnpm` workspaces + `turbo`
- App: Next.js (App Router) + React + TypeScript
- UI: MUI + shared UI kit in `packages/ui`
- State: Zustand (sliced store)
- Data fetching: TanStack Query + `graphql-request`
- Forms: React Hook Form (+ UI form layer in `packages/ui`)
- i18n: i18next (`en`, `de-CH`), translation JSON in `apps/web/public/locales`
- Quality: ESLint + Prettier + TypeScript strict mode
- Tests: Vitest (unit) + Playwright (e2e + visual)

## Repository Structure
- `apps/web`: Next.js web application
- `packages/ui`: shared UI components, form controls, layout primitives, theme/provider
- `packages/localization`: localization setup and hooks
- `packages/api-client`: GraphQL client wrapper
- `packages/config-eslint`: shared ESLint config
- `packages/config-typescript`: shared TS configs
- `docs`: architecture notes and ADR

## Architecture and Key Decisions
- Feature-first app structure in `apps/web/src/features/*` and shared cross-cutting modules in `apps/web/src/shared/*`.
- Recorder logic isolated from UI using a small state machine hook: `useAudioRecorderMachine`.
- Audio persistence optimized for reliability/performance:
  - Metadata persisted in Zustand + localStorage
  - Audio blob persisted in IndexedDB (`audioStorageKey`)
  - Preview URL hydrated on app load
- Step guard logic prevents invalid transitions:
  - No Step 2 without audio
  - No Step 3 without at least one topic
- Step 2 uses provided helper (`useAudioTranscriber`) as required.
- Step 3 uses GraphQL query contract and `useInfiniteQuery` for `Load More` pagination.
- Query reliability polish:
  - Timeout wrapper
  - Abort-aware behavior
  - Retry + exponential backoff
- UX polish:
  - Sticky CTA on mobile
  - Draft restore banner
  - Offline banner
  - Loading/empty states and visual snapshots
- All user-facing copy is i18n-key based (no hardcoded text in UI flow).

## Requirement Fit Checklist
- Step 1 recording: start/stop/playback/re-record/upload ✅
- Handles permission denied and interruptions without crash ✅
- Clear separation of UI and recording side effects ✅
- Step 2 topic suggestions via provided transcriber helper ✅
- Multi-select / deselect topics ✅
- Step 3 GraphQL search with ranking and pagination (`Load More`) ✅
- Navigate between steps without losing progress ✅
- Refresh page without losing progress ✅
- Responsive desktop/mobile experience ✅

## Environment Variables
Create `apps/web/.env.local`:

```bash
NEXT_PUBLIC_AEPSY_GRAPHQL_ENDPOINT=https://api-dev.aepsy.com/graphql
```

## Run Locally
```bash
pnpm install
pnpm dev
```

## Quality Checks
```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm test:visual
```

## Build and Analyze
```bash
pnpm build
pnpm analyze
```

## Deploy (Vercel)
1. Import repo to Vercel
2. Set root directory to `apps/web`
3. Add env var `NEXT_PUBLIC_AEPSY_GRAPHQL_ENDPOINT`
4. Deploy

## Trade-offs and Assumptions
- GraphQL endpoint is public and does not require auth for this assignment flow.
- Provider card rendering prioritizes clarity over heavy UI complexity.
- Recorder is browser API based; very old browsers may hit `unsupported` path.

## What I Would Improve With More Time
- Add stronger runtime validation for GraphQL response payloads.
- Add richer recorder tests (permission denial, interrupted recording, rehydration edge cases).
- Add accessibility audit pass (focus order, keyboard interactions, ARIA labels).
- Add optional server proxy/BFF for stricter network control and observability.

## CI
- `.github/workflows/ci.yml`: lint, typecheck, tests, build, e2e
- `.github/workflows/visual.yml`: manual visual regression
- `.github/workflows/security.yml`: dependency review + scheduled audit
