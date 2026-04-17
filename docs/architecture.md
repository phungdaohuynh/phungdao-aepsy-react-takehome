# Architecture

## Monorepo Boundaries
- `apps/web`: composition layer (routing, page shell, step orchestration).
- `packages/ui`: reusable presentational UI components, theme/provider, form primitives.
- `packages/localization`: i18n bootstrapping and translation hooks.
- `packages/api-client`: transport-only GraphQL client wrapper.
- `packages/config-eslint`, `packages/config-typescript`: shared tooling policies.

## Web App Layering
- `src/app/*`: Next.js entrypoints and route-level boundaries.
- `src/layout/*`: cross-feature shell/UI framing and page-level composition.
- `src/features/*`: isolated business modules (`recording`, `topics`, `psychologists`).
- `src/shared/*`: cross-feature primitives (state, providers, env, utilities).

## Dependency Rules
- `app` may depend on `layout`, `features`, `shared`.
- `layout` may depend on `features` and `shared`.
- `features` may depend on `shared`, and its own feature folder only.
- `shared` must not import from `features`, `layout`, or `app`.
- Enforced in ESLint:
  - No relative imports in `apps/web/src` (`@/` alias required).
  - Feature modules cannot import from `@/layout` or `@/app`.

## Data Flow (3-step assignment)
1. `recording` captures audio via `MediaRecorder` or file upload.
2. Audio blobs are stored in IndexedDB; lightweight metadata is persisted in Zustand/localStorage.
3. `topics` runs provided `useAudioTranscriber` helper and manages selected topics.
4. `psychologists` requests ranked providers from GraphQL and paginates with TanStack Query.

## State and Persistence
- Global app state: Zustand slices (`navigation`, `audio`, `topics`, `meta`).
- Persistence strategy:
  - localStorage: step progress and metadata.
  - IndexedDB: audio blob payload.
  - blob URL hydration on app startup.

## Reliability and Ops
- Route-level error boundary (`app/error.tsx`).
- Offline banner and draft resume UX.
- Query timeout, retry/backoff, and abort-aware fetching.
- CI gates:
  - `ci.yml`: lint, typecheck, unit, build, e2e.
  - `visual.yml`: manual visual regression.
  - `security.yml`: dependency review + audit.
