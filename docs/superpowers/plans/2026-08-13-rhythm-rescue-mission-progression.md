# Rhythm Rescue Multi-Point Mission Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand each rescue mission from one pattern into a config-driven sequence of repair points with one final reward and result screen.

**Architecture:** Keep `MissionState` as the tested single-pattern state machine. Add a `MissionRunState` coordinator that owns the current point, point count, aggregate mistakes/recoveries/combo, and final reward tier. `MissionScene` renders the coordinator state through the existing accessible DOM overlay, while `ResultScene` receives only the completed run summary and applies one reward.

**Tech Stack:** TypeScript, Phaser scene lifecycle, Vite, Vitest, Playwright, existing localStorage `ProgressStore`.

## Global Constraints

- The four input actions remain `up`, `right`, `down`, and `left` and accept arrows, WASD, mouse, and touch through the existing adapter/pad.
- `short-01` has 3 repair points, `medium-01` has 5, and `long-01` has 7.
- `short-01` keeps a tutorial-friendly fixed sequence beginning with `['up']`; medium and long patterns are generated through the existing `PatternGenerator` with injected randomness for deterministic tests.
- A mission may use at most two recovery signals per repair point; the final result grants stars and parts once, only after the last repair point.
- Existing result reward compatibility remains: perfect runs earn tier 3, one-or-fewer mistakes with limited recovery earns tier 2, and other completed runs earn tier 1.
- No backend, account, network, payment, advertisement, or random reward is added.
- Every production behavior added in this plan has a failing test observed before implementation.

---

### Task 1: Mission run domain coordinator

**Files:**
- Create: `src/core/mission-run.ts`
- Create: `tests/core/mission-run.test.ts`
- Modify: `src/core/types.ts` only if a shared mission-run type must be exported

**Interfaces:**
- Consumes: `MissionConfig`, `Direction`, `MissionState`, `createMissionState`, `submitDirection`, `useRecovery`, `generatePattern`.
- Produces:

```ts
export type MissionRunPhase = 'active' | 'complete';

export interface MissionRunState {
  phase: MissionRunPhase;
  missionId: string;
  repairPoints: number;
  completedPoints: number;
  currentPoint: MissionState;
  totalMistakes: number;
  totalRecoveriesUsed: number;
  combo: number;
  bestCombo: number;
  rewardTier: 1 | 2 | 3;
}

export interface MissionRunOptions {
  random: () => number;
  tutorialPatterns?: readonly Direction[][];
}

export function createMissionRun(config: MissionConfig, options: MissionRunOptions): MissionRunState;
export function submitRunDirection(state: MissionRunState, direction: Direction, options: MissionRunOptions): MissionRunState;
export function useRunRecovery(state: MissionRunState): MissionRunState;
```

- [ ] **Step 1: Write failing tests for point counts and tutorial sequence.**

```ts
it('starts short missions at point one with three total points', () => {
  const state = createMissionRun(getMissionConfig('short-01'), {
    random: () => 0.5,
    tutorialPatterns: [['up'], ['right'], ['down']],
  });
  expect(state).toMatchObject({ phase: 'active', repairPoints: 3, completedPoints: 0 });
  expect(state.currentPoint.pattern).toEqual(['up']);
});

it('advances to the next point and completes only after the final point', () => {
  const options = { random: () => 0.5, tutorialPatterns: [['up'], ['right']] };
  let state = createMissionRun({ ...getMissionConfig('short-01'), repairPoints: 2 }, options);
  state = submitRunDirection(state, 'up', options);
  expect(state).toMatchObject({ phase: 'active', completedPoints: 1 });
  expect(state.currentPoint.pattern).toEqual(['right']);
  state = submitRunDirection(state, 'right', options);
  expect(state).toMatchObject({ phase: 'complete', completedPoints: 2, rewardTier: 3 });
});
```

- [ ] **Step 2: Run the focused test and observe the expected missing-module failure.**

Run: `node_modules/.bin/vitest.cmd run tests/core/mission-run.test.ts`

Expected: FAIL because `src/core/mission-run.ts` does not exist.

- [ ] **Step 3: Implement the coordinator with deterministic tutorial patterns and generated later patterns.**

Use the tutorial pattern at index `completedPoints` when supplied; otherwise choose a length in the inclusive `[patternMin, patternMax]` range and call `generatePattern`. Wrap each new pattern with `createMissionState([...pattern])` and set its phase to `input`, matching the current scene contract. On point completion, accumulate that point’s mistakes and recovery usage, update `bestCombo`, and either create the next point or mark the run complete. Compute the final tier once from aggregate mistakes and recoveries.

- [ ] **Step 4: Add tests for recovery aggregation, generated pattern bounds, and one-time completion reward tier.**

```ts
it('uses no more than two recoveries per point and aggregates recovery usage', () => {
  const options = { random: () => 0.5, tutorialPatterns: [['up'], ['right']] };
  let state = createMissionRun({ ...getMissionConfig('short-01'), repairPoints: 2 }, options);
  state = submitRunDirection(state, 'right', options);
  expect(state.currentPoint.phase).toBe('recovery');
  state = useRunRecovery(state);
  expect(state.currentPoint.recoveriesLeft).toBe(1);
  state = submitRunDirection(state, 'up', options);
  state = submitRunDirection(state, 'up', options);
  expect(state.completedPoints).toBe(1);
  expect(state.totalMistakes).toBe(1);
  expect(state.totalRecoveriesUsed).toBe(1);
});
```

- [ ] **Step 5: Run the focused tests and the existing core suite.**

Run: `node_modules/.bin/vitest.cmd run tests/core/mission-run.test.ts tests/core/mission-engine.test.ts tests/core/pattern-generator.test.ts tests/core/mission-config.test.ts`

Expected: PASS with all focused tests and no regression.

- [ ] **Step 6: Commit the domain coordinator.**

```bash
git add src/core/mission-run.ts tests/core/mission-run.test.ts src/core/types.ts
git commit -m "feat: add multi-point mission run state"
```

### Task 2: Multi-point mission scene integration

**Files:**
- Modify: `src/scenes/mission-scene.ts`
- Modify: `src/scenes/result-scene.ts`
- Modify: `tests/e2e/rhythm-rescue.spec.ts`

**Interfaces:**
- Consumes: `MissionRunState`, `createMissionRun`, `submitRunDirection`, `useRunRecovery`.
- Produces: a DOM-accessible mission screen with `수리 지점 N / 총 M`, current point pattern, aggregate combo/mistake/recovery status, and a single final result transition.

- [ ] **Step 1: Add failing E2E coverage for three-point tutorial completion.**

```ts
test('completes all tutorial repair points before showing the result', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '첫 구조 임무 시작' }).click();
  await expect(page.getByText('수리 지점 1 / 3')).toBeVisible();
  await page.getByRole('button', { name: '위 수리 신호' }).click();
  await expect(page.getByText('수리 지점 2 / 3')).toBeVisible();
  await page.getByRole('button', { name: '오른쪽 수리 신호' }).click();
  await expect(page.getByText('수리 지점 3 / 3')).toBeVisible();
  await page.getByRole('button', { name: '아래 수리 신호' }).click();
  await expect(page.getByText('임무 결과')).toBeVisible();
});
```

- [ ] **Step 2: Run the new E2E and observe failure because the current scene exits after one point.**

Run: `node_modules/.bin/playwright.cmd test tests/e2e/rhythm-rescue.spec.ts --grep "all tutorial repair points"`

Expected: FAIL while waiting for `수리 지점 2 / 3`.

- [ ] **Step 3: Replace the scene’s single `MissionState` field with `MissionRunState`.**

Initialize the run with `getMissionConfig('short-01')` and tutorial patterns `[['up'], ['right'], ['down']]`; pass the existing mission config for medium and long buttons. On input call `submitRunDirection`; on recovery call `useRunRecovery`; on `complete` pass aggregate mistakes, recoveries, and reward tier to `ResultScene`. Reset the preview timer whenever `completedPoints` advances.

- [ ] **Step 4: Render point progress and aggregate feedback without changing existing accessible button names.**

Keep `엔진 신호 복원 중`, the current pattern card, four exact direction labels, pause overlay, and obstacle layer. Add a visible `수리 지점 ${completedPoints + 1} / ${repairPoints}` element, and show total mistakes and recovery usage from the run state. The current point’s cursor still controls revealed pattern symbols.

- [ ] **Step 5: Update result assertions and add medium/long progress smoke coverage.**

Verify that the tutorial result appears only after all three clicks, that localStorage still receives one reward, and that medium/long missions show `수리 지점 1 / 5` and `수리 지점 1 / 7` respectively.

- [ ] **Step 6: Run the full frontend verification.**

Run: `node_modules/.bin/tsc.cmd -b`; `node_modules/.bin/vitest.cmd run`; `node_modules/.bin/playwright.cmd test`; `node_modules/.bin/vite.cmd build`

Expected: all tests pass and Vite produces `dist/`.

- [ ] **Step 7: Commit the scene integration.**

```bash
git add src/scenes/mission-scene.ts src/scenes/result-scene.ts tests/e2e/rhythm-rescue.spec.ts
git commit -m "feat: run missions across repair points"
```

### Task 3: Mission HUD and responsive polish for the new loop

**Files:**
- Modify: `src/styles.css`
- Modify: `src/scenes/mission-scene.ts`
- Modify: `tests/e2e/rhythm-rescue.spec.ts`

**Interfaces:**
- Consumes: the point-progress copy and aggregate run counters from Task 2.
- Produces: stable desktop and narrow-screen layout without changing game semantics.

- [ ] **Step 1: Add a narrow viewport E2E smoke test.**

```ts
test('keeps the repair HUD and four touch targets usable on a narrow screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: '첫 구조 임무 시작' }).click();
  await expect(page.getByText('수리 지점 1 / 3')).toBeVisible();
  await expect(page.getByRole('button', { name: '위 수리 신호' })).toBeVisible();
  await expect(page.getByRole('button', { name: '왼쪽 수리 신호' })).toBeVisible();
});
```

- [ ] **Step 2: Run the viewport test and observe the current layout failure or clipping.**

Run: `node_modules/.bin/playwright.cmd test tests/e2e/rhythm-rescue.spec.ts --grep "narrow screen"`

Expected: FAIL if the new point copy or pad cannot fit the 390px viewport.

- [ ] **Step 3: Implement the minimum responsive layout changes.**

Use the existing media query to stack the mission heading and point chip, keep `.direction-pad` at four large targets, prevent horizontal overflow, and preserve focus outlines. Do not reduce the direction button below 64px.

- [ ] **Step 4: Run the viewport test and full regression.**

Run: `node_modules/.bin/playwright.cmd test tests/e2e/rhythm-rescue.spec.ts`; `node_modules/.bin/vitest.cmd run`; `node_modules/.bin/vite.cmd build`

Expected: PASS.

- [ ] **Step 5: Commit responsive polish.**

```bash
git add src/styles.css src/scenes/mission-scene.ts tests/e2e/rhythm-rescue.spec.ts
git commit -m "feat: polish multi-point mission HUD"
```

### Task 4: Update next-phase documentation and verification matrix

**Files:**
- Modify: `README.md`
- Modify: `docs/superpowers/specs/2026-08-13-rhythm-rescue-next-phase-design.md`

**Interfaces:**
- Consumes: completed multi-point mission behavior and verification output.
- Produces: user-facing run instructions and an accurate documented scope.

- [ ] **Step 1: Add the multi-point loop to README’s MVP/verification sections.**

Document that short, medium, and long missions now contain 3, 5, and 7 repair points, and that rewards are granted once after the final point.

- [ ] **Step 2: Record the implemented boundary in the next-phase design.**

Mark only the multi-point mission slice as implemented; leave audio, skins, and the broader playtest matrix explicitly as follow-up slices.

- [ ] **Step 3: Run the complete verification one final time.**

Run: `git diff --check`; `node_modules/.bin/tsc.cmd -b`; `node_modules/.bin/vitest.cmd run`; `node_modules/.bin/playwright.cmd test`; `node_modules/.bin/vite.cmd build`

Expected: zero failures and a successful production build.

- [ ] **Step 4: Commit documentation.**

```bash
git add README.md docs/superpowers/specs/2026-08-13-rhythm-rescue-next-phase-design.md
git commit -m "docs: document multi-point mission loop"
```
