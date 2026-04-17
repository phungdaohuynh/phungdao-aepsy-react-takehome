# Architecture

## Monorepo
- `apps/web`: Next.js app (App Router) with feature-first structure.
- `packages/ui`: shared UI kit, MUI theme, layout, toast, form controls.
- `packages/localization`: i18next bootstrap and language utilities.
- `packages/api-client`: GraphQL client wrapper.
- `packages/config-eslint` and `packages/config-typescript`: shared tooling.

## Web App Structure
- `src/features/*`: feature modules (`recording`, `topics`, `psychologists`).
- `src/shared/*`: shared app-level infrastructure (state, providers, env, analytics).
- `src/layout/*`: app shell composition and cross-feature page framing.
- `src/app/*`: Next.js route entry points.

## Data Flow
1. `recording` captures or uploads audio and persists payload in Zustand store.
2. `topics` runs provided `useAudioTranscriber` and stores selected topics.
3. `psychologists` queries GraphQL using selected topics and paginates results.

State is persisted with `zustand/persist` in localStorage to preserve progress across refresh.

## API Layer
- `features/psychologists/api/queries.ts`: GraphQL contract documents.
- `dto.ts`: response/request DTO types.
- `mappers.ts`: normalization and mapping from DTO to view pages.
- `use-psychologists-query.ts`: TanStack Query hook (infinite pagination).

## Reliability & Ops
- Route-level error boundary in `app/error.tsx`.
- Offline and resume draft banners in layout layer.
- Dev-only analytics dashboard based on localStorage events.
- CI:
  - `ci.yml` for quality + e2e
  - `visual.yml` for manual visual regression
  - `security.yml` for dependency review and audit
