# Test Cases Matrix

This file lists the core test cases for the Aepsy take-home flow and maps each case to automated coverage.

## Step 1 - Voice Recording

| ID | Test case | Expected outcome | Coverage |
| --- | --- | --- | --- |
| REC-01 | Start/stop recording after consent | Recorder starts and can be stopped cleanly | `apps/web/src/features/recording/hooks/use-audio-recorder-machine.test.tsx` |
| REC-02 | No consent | Start/upload actions are disabled | `apps/web/tests/e2e/flow-regression.spec.ts` |
| REC-03 | Upload valid audio | Audio player becomes visible and state is saved | `apps/web/tests/e2e/smoke.spec.ts` |
| REC-04 | Upload non-audio file | User sees validation error and audio is not accepted | `apps/web/tests/e2e/flow-regression.spec.ts` |
| REC-05 | Re-record flow | Previous audio is cleared and can be replaced | `apps/web/tests/e2e/smoke.spec.ts` (indirect), `step-recording.tsx` flow |
| REC-06 | Refresh while recording | Interruption warning is shown, app remains stable | `apps/web/tests/e2e/smoke.spec.ts` |
| REC-07 | IndexedDB unavailable | User sees storage error, app does not crash | `apps/web/tests/e2e/smoke.spec.ts` |

## Step 2 - Topic Suggestions

| ID | Test case | Expected outcome | Coverage |
| --- | --- | --- | --- |
| TOP-01 | Auto analyze after audio is available | Topic suggestions are loaded | `apps/web/tests/e2e/smoke.spec.ts` |
| TOP-02 | Select/deselect topics | Topic chip toggles selection | `apps/web/tests/e2e/smoke.spec.ts` |
| TOP-03 | Continue disabled when no topic selected | Cannot proceed to Step 3 | `apps/web/tests/e2e/flow-regression.spec.ts` |
| TOP-04 | Quick pick top 3 | Three topics selected quickly | `apps/web/tests/e2e/flow-regression.spec.ts` |
| TOP-05 | Undo/redo topic selection | Selection history is restored correctly | `apps/web/tests/e2e/flow-regression.spec.ts` |
| TOP-06 | Enter Step 2 without audio | Guard redirects to Step 1 | `apps/web/tests/e2e/flow-regression.spec.ts` |

## Step 3 - Psychologist Search (GraphQL)

| ID | Test case | Expected outcome | Coverage |
| --- | --- | --- | --- |
| PSY-01 | Happy path query + rendering | Provider list appears with ranked cards | `apps/web/tests/e2e/smoke.spec.ts` |
| PSY-02 | Load more pagination | Additional providers are appended | `apps/web/tests/e2e/smoke.spec.ts` |
| PSY-03 | No next page | Load More button is hidden | `apps/web/tests/e2e/flow-regression.spec.ts` |
| PSY-04 | Empty API response | Empty state is displayed | `apps/web/tests/e2e/flow-regression.spec.ts` |
| PSY-05 | GraphQL/API failure | Error state is displayed | `apps/web/tests/e2e/flow-regression.spec.ts` |
| PSY-06 | Enter Step 3 with no topics | Guard sends user back to Step 2 | `apps/web/tests/e2e/flow-regression.spec.ts` |

## Cross-Step Persistence and Navigation

| ID | Test case | Expected outcome | Coverage |
| --- | --- | --- | --- |
| NAV-01 | Refresh in Step 3 | Current progress remains on Step 3 | `apps/web/tests/e2e/smoke.spec.ts` |
| NAV-02 | Draft restore banner after refresh | Draft banner appears and state is restored | `apps/web/tests/e2e/smoke.spec.ts` |
| NAV-03 | Invalid persisted step without required data | Guard resolves to valid step (record/topics) | `apps/web/tests/e2e/flow-regression.spec.ts` |

## Visual Regression

| ID | Test case | Expected outcome | Coverage |
| --- | --- | --- | --- |
| VIS-01 | Step 1 snapshot | Layout is visually stable | `apps/web/tests/e2e/home.visual.spec.ts` |
| VIS-02 | Step 3 snapshot | Result list page is visually stable | `apps/web/tests/e2e/home.visual.spec.ts` |
