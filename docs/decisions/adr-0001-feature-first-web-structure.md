# ADR-0001: Feature-first structure in `apps/web`

## Status

Accepted

## Context

The assignment flow is domain-driven and expected to evolve (audio handling, analysis strategies, search ranking UX). A flat `components + lib` structure increases cross-module coupling over time.

## Decision

Use a feature-first structure:

- `features/recording`
- `features/topics`
- `features/psychologists`

and keep app-wide concerns in `shared` and `layout`.

## Consequences

### Positive

- Clear ownership boundaries and less import coupling.
- Easier test placement near feature code.
- Better scalability for adding steps or replacing implementations.

### Negative

- Slightly deeper import paths.
- Requires discipline to avoid leaking feature internals across boundaries.
