# Aepsy React FE Take-home

## Project Overview
This repository contains a monorepo implementation of the Aepsy Frontend take-home assignment with a 3-step flow:
1. Record or upload voice note
2. Generate and select topic suggestions
3. Search and paginate psychologists from GraphQL

## Tech Stack
- `pnpm` workspaces + `turbo`
- Next.js (App Router) + React + TypeScript
- Zustand (state + localStorage persistence)
- TanStack Query + graphql-request
- MUI (shared UI package)
- i18next (en + de-CH, JSON files in `public/locales`)
- ESLint + Prettier
- Vitest (unit)
- Playwright (e2e)

## Monorepo Structure
- `apps/web`: main web app
- `packages/ui`: shared UI components, theme, form kit, toast/layout providers
- `packages/localization`: i18n setup
- `packages/api-client`: GraphQL client wrapper
- `packages/config-eslint`: shared ESLint configs
- `packages/config-typescript`: shared TS configs
- `docs`: architecture notes and ADRs

## Approach and Key Decisions
- Separated domain flow into 3 UI steps and persisted progress in Zustand so users can refresh or navigate without losing state.
- Built recording logic as a state machine (`useAudioRecorderMachine`) to isolate side effects from UI.
- Added upload-audio fallback for users who already have recorded files.
- Used provided `useAudioTranscriber` helper as required to simulate audio analysis in Step 2.
- Implemented Step 3 with provided `SEARCH_PROVIDERS` GraphQL query and TanStack Query infinite pagination (`Load More`).
- Centralized reusable primitives in `packages/ui` (form controls, modal/dialog, toast, loading/empty state, app shell).
- Added route-step guards to prevent invalid navigation states (e.g. Step 2 without audio, Step 3 without topics).
- Added production-oriented polish: draft resume banner, offline banner, and lightweight client-side analytics events.
- Improved UX with clearer step completion, skeleton loading states, and mobile sticky action buttons.
- Added dev-only analytics dashboard to inspect local event stream and clear events quickly.
- Standardized user-facing app copy through i18n keys (`public/locales/en|de-CH`) for consistent localization.
- Refactored web app to feature-first structure with explicit `shared` boundaries and psychologist API DTO/mappers.
- Added environment schema validation (`zod`) for public runtime config.
- Split Zustand store into dedicated slices (`navigation`, `topics`, `audio`, `meta`) for maintainability.

## Trade-offs and Assumptions
- Audio content is persisted as `data URL` in localStorage to satisfy refresh persistence quickly; this is simple but not optimal for large files.
- Step 3 assumes endpoint `https://api-dev.aepsy.com/graphql` unless `NEXT_PUBLIC_AEPSY_GRAPHQL_ENDPOINT` is provided.
- Current provider rendering is intentionally concise and based on available fields from the sample query.
- Authentication and production-grade API error mapping were not added because assignment materials focus on frontend flow.

## What I Would Improve With More Time
- Move audio persistence from localStorage to IndexedDB for larger recordings and better storage limits.
- Add stricter runtime validation for GraphQL responses (e.g., zod schemas).
- Expand test coverage: recorder interruptions/permissions, language switching, and richer e2e edge cases.
- Add accessibility pass (keyboard/focus flow, ARIA audit) and visual regression snapshots.
- Add query retry/backoff and user-friendly API error states.

## Scripts
- `pnpm install`
- `pnpm dev`
- `pnpm build`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm test:visual:update` (generate/update visual snapshots)
- `pnpm test:visual` (run visual regression snapshots)

## CI Workflows
- `.github/workflows/ci.yml`: lint, typecheck, unit tests, build, e2e
- `.github/workflows/visual.yml`: manual visual regression run (`workflow_dispatch`)
- `.github/workflows/security.yml`: dependency review + scheduled `pnpm audit`
