# Rhythm Rescue Feedback and Audio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add reliable visual, sound, and vibration feedback for the five approved rescue events without coupling browser APIs to mission judgment.

**Architecture:** Keep `MissionRunState` pure and introduce a small synchronous `FeedbackBus` in `src/core`. A browser-facing `FeedbackEffects` adapter subscribes to the bus, lazily generates Web Audio tones, and invokes vibration only when enabled and supported. `MissionScene` emits events after state transitions, keeps text feedback accessible, and remains responsible for scene navigation.

**Tech Stack:** TypeScript, Phaser scene lifecycle, Web Audio API, `navigator.vibrate`, Vitest, Playwright, Vite.

## Global Constraints

- Events are limited to `input-correct`, `input-wrong`, `recovery-used`, `point-complete`, and `mission-complete`.
- Existing `Progress.settings.sound` and `Progress.settings.vibration` remain the only sound and vibration settings; no storage migration or new setting key is added.
- No external audio files, background music, network requests, accounts, payments, ads, or random rewards are added.
- Web Audio and vibration failures are swallowed at the adapter boundary and never block input judgment, scene transitions, or reward persistence.
- All production behavior is introduced by a failing test observed before implementation.
- Existing accessible direction button names, keyboard controls, pause behavior, reduced-motion behavior, and multi-point mission rules remain unchanged.

---

### Task 1: Core feedback event bus

**Files:**
- Create: `src/core/feedback.ts`
- Create: `tests/core/feedback.test.ts`

**Interfaces:**
- Produces:

```ts
export type FeedbackEvent =
  | 'input-correct'
  | 'input-wrong'
  | 'recovery-used'
  | 'point-complete'
  | 'mission-complete';

export interface FeedbackBus {
  emit(event: FeedbackEvent): void;
  subscribe(listener: (event: FeedbackEvent) => void): () => void;
}

export function createFeedbackBus(): FeedbackBus;
```

- `emit` preserves subscription order.
- A listener exception is isolated so later listeners still receive the event and the caller does not receive the exception.
- The unsubscribe function is idempotent.

- [ ] **Step 1: Write failing tests for ordered delivery and unsubscribe.**

```ts
it('delivers events to subscribers in order', () => {
  const bus = createFeedbackBus();
  const received: FeedbackEvent[] = [];
  bus.subscribe((event) => received.push(event));

  bus.emit('input-correct');
  bus.emit('point-complete');

  expect(received).toEqual(['input-correct', 'point-complete']);
});

it('isolates listener failures and stops delivery after unsubscribe', () => {
  const bus = createFeedbackBus();
  const received: FeedbackEvent[] = [];
  bus.subscribe(() => { throw new Error('listener failure'); });
  const unsubscribe = bus.subscribe((event) => received.push(event));

  expect(() => bus.emit('input-wrong')).not.toThrow();
  unsubscribe();
  unsubscribe();
  bus.emit('recovery-used');

  expect(received).toEqual(['input-wrong']);
});
```

- [ ] **Step 2: Run the focused test and observe the expected missing-module failure.**

Run: `node_modules/.bin/vitest.cmd run tests/core/feedback.test.ts`

Expected: FAIL because `src/core/feedback.ts` does not exist.

- [ ] **Step 3: Implement the minimal bus.**

Use a `Set` of listeners. Copy the set before dispatch so unsubscribe during dispatch does not corrupt iteration. Wrap each listener call in `try/catch`, then remove a listener by reference when its unsubscribe function is called.

- [ ] **Step 4: Run the focused test and the existing core suite.**

Run: `node_modules/.bin/vitest.cmd run tests/core/feedback.test.ts tests/core/mission-run.test.ts tests/core/mission-engine.test.ts`

Expected: all focused tests pass with no regression.

- [ ] **Step 5: Commit the event bus.**

```bash
git add src/core/feedback.ts tests/core/feedback.test.ts
git commit -m "feat: add rescue feedback event bus"
```

### Task 2: Browser sound and vibration effects

**Files:**
- Create: `src/feedback/feedback-effects.ts`
- Create: `tests/feedback/feedback-effects.test.ts`

**Interfaces:**
- Consumes: `FeedbackBus`, `FeedbackEvent`, `ProgressSettings`.
- Produces:

```ts
export interface FeedbackRuntime {
  playSound(event: FeedbackEvent): void;
  vibrate(pattern: readonly number[]): void;
  dispose(): void;
}

export interface FeedbackEffects {
  dispose(): void;
}

export function createBrowserFeedbackRuntime(): FeedbackRuntime;
export function createFeedbackEffects(
  bus: FeedbackBus,
  settings: ProgressSettings,
  runtime?: FeedbackRuntime,
): FeedbackEffects;
```

- `createBrowserFeedbackRuntime` lazily creates `AudioContext` on the first sound event, schedules short oscillator tones, and catches unsupported or failed APIs.
- `createFeedbackEffects` subscribes to the bus once, filters sound/vibration by settings, maps each event to a fixed tone/vibration pattern, and unsubscribes on `dispose`.
- With `sound: false`, `runtime.playSound` is never called. With `vibration: false`, `runtime.vibrate` is never called.

- [ ] **Step 1: Write failing tests with an injected runtime.**

```ts
it('plays sound and vibration for events when both settings are enabled', () => {
  const bus = createFeedbackBus();
  const sounds: FeedbackEvent[] = [];
  const vibrations: number[][] = [];
  const runtime: FeedbackRuntime = {
    playSound: (event) => sounds.push(event),
    vibrate: (pattern) => vibrations.push([...pattern]),
    dispose: () => undefined,
  };

  const effects = createFeedbackEffects(bus, { sound: true, vibration: true }, runtime);
  bus.emit('point-complete');

  expect(sounds).toEqual(['point-complete']);
  expect(vibrations[0].length).toBeGreaterThan(0);
  effects.dispose();
});

it('filters disabled effects and releases the subscription', () => {
  const bus = createFeedbackBus();
  const runtimeCalls = { sound: 0, vibration: 0, dispose: 0 };
  const runtime: FeedbackRuntime = {
    playSound: () => { runtimeCalls.sound += 1; },
    vibrate: () => { runtimeCalls.vibration += 1; },
    dispose: () => { runtimeCalls.dispose += 1; },
  };
  const effects = createFeedbackEffects(bus, { sound: false, vibration: false }, runtime);

  bus.emit('input-correct');
  effects.dispose();
  bus.emit('mission-complete');

  expect(runtimeCalls).toEqual({ sound: 0, vibration: 0, dispose: 1 });
});
```

- [ ] **Step 2: Run the focused test and confirm the expected missing-module failure.**

Run: `node_modules/.bin/vitest.cmd run tests/feedback/feedback-effects.test.ts`

Expected: FAIL because `src/feedback/feedback-effects.ts` does not exist.

- [ ] **Step 3: Implement settings filtering and event pattern mapping.**

Define one vibration pattern per event. Keep the mapping private and deterministic. Subscribe to the bus, call the injected runtime only when the relevant setting is true, and make `dispose` safe to call more than once.

- [ ] **Step 4: Implement the browser runtime with a lazy Web Audio context.**

Use `window.AudioContext ?? window.webkitAudioContext` when available. Create an oscillator and gain node for each event, set a short envelope, start/stop it, and close the context in `dispose`. If any API is absent or throws, return without rethrowing. Call `navigator.vibrate` only when it exists.

- [ ] **Step 5: Run focused effects tests and the full unit suite.**

Run: `node_modules/.bin/vitest.cmd run tests/feedback/feedback-effects.test.ts tests/core/feedback.test.ts`; then `node_modules/.bin/vitest.cmd run`

Expected: all tests pass.

- [ ] **Step 6: Commit the effects adapter.**

```bash
git add src/feedback/feedback-effects.ts tests/feedback/feedback-effects.test.ts
git commit -m "feat: add safe sound and vibration effects"
```

### Task 3: Mission scene event wiring and accessible visual feedback

**Files:**
- Modify: `src/scenes/mission-scene.ts`
- Modify: `tests/e2e/rhythm-rescue.spec.ts`
- Modify: `src/styles.css` only if the new status treatment requires layout or focus styling

**Interfaces:**
- Consumes: `createFeedbackBus`, `createFeedbackEffects`, `FeedbackEvent`, `FeedbackEffects`.
- Produces: event-driven visual messages while preserving the current point HUD, direction button labels, pause overlay, and result transition.

- [ ] **Step 1: Add a failing E2E test for an error/recovery message and disabled-effects completion.**

```ts
test('shows recovery feedback and still completes with sound and vibration disabled', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '접근성 설정' }).click();
  await page.getByLabel('수리 소리 사용').uncheck();
  await page.getByLabel('진동 사용').uncheck();
  await page.getByRole('button', { name: '첫 구조 임무 시작' }).click();
  await page.getByRole('button', { name: '오른쪽 수리 신호' }).click();
  await expect(page.getByText('신호가 흐트러졌어요. 한 번 더 천천히 기억해요.')).toBeVisible();
  await page.getByRole('button', { name: '위 수리 신호' }).click();
  await page.getByRole('button', { name: '오른쪽 수리 신호' }).click();
  await page.getByRole('button', { name: '아래 수리 신호' }).click();
  await expect(page.getByText('임무 결과')).toBeVisible();
});
```

- [ ] **Step 2: Run the new E2E and observe the expected failure.**

Run: `node_modules/.bin/playwright.cmd test tests/e2e/rhythm-rescue.spec.ts --grep "recovery feedback"`

Expected: FAIL because the accessibility panel can be configured, but the scene does not yet create the feedback effects or guarantee the event-driven recovery message.

- [ ] **Step 3: Create the bus/effects during mission setup and dispose them on scene shutdown.**

Add private fields for the bus and effects. Initialize them from `this.progress.settings` after progress/config are assigned. Register a shutdown callback that calls `effects.dispose()` before removing scene listeners.

- [ ] **Step 4: Emit events after each state transition.**

In `handleDirection`, emit `input-wrong` before applying recovery, then emit `recovery-used` after `useRunRecovery`. Emit `input-correct` for every accepted input, including the final input of a point. When a point advances, emit `point-complete` before starting the next preview. On the last point, emit `mission-complete` immediately before starting `ResultScene`. Do not let effect code determine whether the transition happens.

- [ ] **Step 5: Preserve accessible visual feedback.**

Keep the existing recovery text exactly, add an `aria-live="polite"` status treatment for recovery and completion messages, and keep successful input feedback visual through the existing cursor/combo updates without announcing every keystroke. If a CSS class is added, keep it supplementary to text and numeric progress.

- [ ] **Step 6: Run the focused E2E and the complete browser suite.**

Run: `node_modules/.bin/playwright.cmd test tests/e2e/rhythm-rescue.spec.ts --grep "recovery feedback"`; then `node_modules/.bin/playwright.cmd test`

Expected: the new scenario and all existing tutorial, multi-point, keyboard, pause, obstacle, and narrow viewport tests pass.

- [ ] **Step 7: Commit the mission integration.**

```bash
git add src/scenes/mission-scene.ts tests/e2e/rhythm-rescue.spec.ts src/styles.css
git commit -m "feat: wire rescue feedback into missions"
```

### Task 4: Documentation and final verification

**Files:**
- Modify: `README.md`
- Modify: `docs/superpowers/specs/2026-08-13-rhythm-rescue-next-phase-design.md`

**Interfaces:**
- Consumes: completed feedback behavior and the approved feedback design.
- Produces: user-facing documentation that identifies sound/vibration settings and the implemented boundary.

- [ ] **Step 1: Inspect the existing documentation sections that need updating.**

Run: `rg -n "MVP 범위|접근성|후속 작업|구현 상태|피드백과 오디오" README.md docs/superpowers/specs/2026-08-13-rhythm-rescue-next-phase-design.md`

Use the output to update only the user-facing scope and implementation-status sections; do not change the original multi-point mission rules.

- [ ] **Step 2: Update the README and next-phase design.**

Document the five feedback events at a user-facing level, the existing accessibility toggles, and the fact that turning effects off does not disable mission input. Mark feedback/audio as implemented while leaving skins/base customization and extended mobile playtesting as follow-up work.

- [ ] **Step 3: Run the full verification commands.**

Run: `git diff --check`; `node_modules/.bin/tsc.cmd -b`; `node_modules/.bin/vitest.cmd run`; `node_modules/.bin/playwright.cmd test`; `node_modules/.bin/vite.cmd build`

Expected: zero test failures, successful typecheck, successful production build, and only the existing large-chunk warning if it remains.

- [ ] **Step 4: Commit the documentation.**

```bash
git add README.md docs/superpowers/specs/2026-08-13-rhythm-rescue-next-phase-design.md
git commit -m "docs: document rescue feedback effects"
```
