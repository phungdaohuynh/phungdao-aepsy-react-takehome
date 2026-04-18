# Step 1 Recording Requirement Checklist

## Functional Requirements
- [x] Start recording
- [x] Stop recording
- [x] Playback recorded audio
- [x] Re-record and replace previous audio
- [x] Upload audio as an alternative input path

## Behavior Expectations
- [x] Microphone permission denied: clear fallback message and continue path (upload)
- [x] Recording interrupted (tab hidden/refresh): machine marks `interrupted`, avoids crash, and shows warning
- [x] Navigate away and come back: state persists in local storage and can be resumed
- [x] Refresh while recording: interruption is detected on next load via session flag
- [x] IndexedDB unavailable/storage failures: surfaced as user-friendly errors

## Architecture Expectations
- [x] UI and recording side effects are separated
  - `step-recording.tsx`: presentation + flow actions
  - `use-audio-recorder-machine.ts`: recording lifecycle/state transitions
  - `audio-storage.ts`: audio persistence abstraction
- [x] Recording implementation is replaceable
  - Hook encapsulates MediaRecorder usage so adapter can be swapped later
- [x] Lifecycle/side effects are predictable
  - Centralized cleanup for stream tracks/chunks/blob lifecycle
  - Session-based interruption handoff on refresh

## Verification
- [x] Unit: provider matching/tests and recorder machine tests
- [x] E2E:
  - happy path: Step 1 -> Step 2 -> Step 3
  - refresh keeps progress
  - upload flow
  - refresh during recording interruption
  - storage unavailable path

## Known Trade-offs
- `beforeunload` behavior depends on browser constraints; we store interruption intent in `sessionStorage` as a best-effort strategy.
- Very large file handling is worker-based simulation without backend chunk upload yet.
