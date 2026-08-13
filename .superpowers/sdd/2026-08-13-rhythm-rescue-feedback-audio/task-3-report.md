# Task 3 Report: Mission scene event wiring and accessible visual feedback

## Status

Completed the Task 3 code edits in the requested files only:

- `src/scenes/mission-scene.ts`
- `tests/e2e/rhythm-rescue.spec.ts`

## Implementation

- Created the feedback bus and typed feedback effects from `this.progress.settings`.
- Disposed feedback effects and cleared the bus on Phaser scene shutdown.
- Added `emitFeedback(event: FeedbackEvent)` with a guarded bus emit so feedback failures cannot affect input judgment or navigation.
- Emitted `input-wrong` before recovery and `recovery-used` after `useRunRecovery`.
- Emitted `input-correct` for accepted inputs.
- Emitted `point-complete` before starting the next preview.
- Emitted `mission-complete` immediately before starting `ResultScene`.
- Added `aria-live="polite"` to the mission message element while preserving the existing message text.
- Corrected the new recovery-feedback E2E test to use the exact UTF-8 Korean labels and recovery message from the project brief/canonical UI.

## Verification

- Tests were intentionally not executed, per request.
- Only source inspection and `git diff`/status inspection were performed.
- No changes were made to `src/styles.css`.
- An unrelated untracked `.pnpm-store/` directory was left untouched.

## Commit

Commit message: `feat: wire rescue feedback into missions`

## Fix round 2

- Restored `tests/e2e/rhythm-rescue.spec.ts` to the canonical `15e5676` version first, then reapplied only the intended recovery-feedback test changes.
- Preserved all pre-existing test labels and assertions outside that single test.
- Kept the current production live-region behavior in `src/scenes/mission-scene.ts` and `src/scenes/result-scene.ts`: the generic mission message has no live region, recovery status uses a separate polite live region only when a message exists, and result copy is polite live.
- Verification status:
  - `git diff 15e5676 -- tests/e2e/rhythm-rescue.spec.ts` shows only the intended recovery-feedback test delta.
  - Quick TypeScript check passed using bundled Node:
    - `C:\Users\User\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe D:\Codex\action-puzzle-game\node_modules\.pnpm\typescript@5.9.3\node_modules\typescript\lib\tsc.js -b --pretty false`
  - No Playwright run performed in this round, per request to avoid a long E2E command.
  - `.pnpm-store/` and Task 1/2 files were left untouched.

## Fix round 3

- Replaced the recovery feedback assertion in `tests/e2e/rhythm-rescue.spec.ts` with the existing `recoveryStatus` locator so the test targets the live status region instead of matching duplicate visible text.
- Preserved the exact recovery message text and left all other tests, labels, and production files unchanged.
- No Playwright run performed, per request.
