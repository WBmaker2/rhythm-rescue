# 리듬 구조대 기지 성장·꾸미기·업데이트 내역 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 임무 보상으로 기지 레벨을 올리고 고정 조건의 스킨·기지 장식을 해금·선택하며, 본부에서 날짜별 업데이트 내역을 확인할 수 있게 만든다.

**Architecture:** 진행도와 해금 규칙은 `src/core/progression.ts`가 소유하고 저장소는 구버전 진행도를 병합·검증한다. 업데이트 기록은 정적 목록 모듈로 분리하며, `BaseScene`은 DOM 기반 본부 UI에서 선택 상태와 기록 패널을 연결한다. 기존 Phaser 씬과 임무 규칙은 변경하지 않는다.

**Tech Stack:** TypeScript, Phaser 3.90, Vite, Vitest, Playwright, DOM/CSS.

## Global Constraints

- `default-suit`와 `default-hangar`는 새 진행도에서도 항상 해금 상태다.
- 기지 레벨 3 이상에서 `rescue-helmet` 스킨을 해금하고, 기지 레벨 5 이상에서 `signal-hq` 기지 장식을 해금한다.
- `Progress`에 `selectedSkinId`, `selectedBaseDecorationId`, `unlockedCosmeticIds`를 추가하며 구버전 저장 데이터는 기존 진행도와 설정을 보존한 채 새 기본값을 채운다.
- 잠긴 꾸미기 항목은 `disabled`이며 해금 조건을 표시한다. 선택된 항목은 `aria-pressed="true"`를 사용한다.
- `업데이트 내역` 버튼은 처음 닫힌 상태이며, 날짜 `YYYY-MM-DD`와 제목·요약을 최신순으로 표시한다.
- `첫 구조 임무 시작`에만 `gi-pulse`를 적용하고 `.reduced-motion` 및 `prefers-reduced-motion: reduce`에서는 애니메이션을 정지한다.
- 브라우저 저장 실패는 UI와 임무 진행을 막지 않는다.
- 새 production behavior는 구현 전에 실패하는 테스트를 관찰한다.
- 변경 후 `tsc -b`, `pnpm test`, `pnpm test:e2e`, `pnpm build`, `git diff --check`를 실행한다.

---

### Task 1: Progress cosmetics, unlock rules, and update history data

**Files:**
- Modify: `src/core/progression.ts`
- Modify: `src/storage/progress-store.ts`
- Create: `src/core/update-history.ts`
- Test: `tests/core/progression.test.ts`
- Test: `tests/storage/progress-store.test.ts`
- Test: `tests/core/update-history.test.ts`

**Interfaces:**
- `Progress` produces `selectedSkinId`, `selectedBaseDecorationId`, and `unlockedCosmeticIds` for `BaseScene`.
- `applyMissionReward(progress, tier)` remains the public reward entry point and updates cosmetic unlocks without changing reward amounts.
- `getUpdateHistory()` returns immutable, newest-first update records with `date`, `title`, and `summary`.

- [ ] **Step 1: Write failing progression tests**

Add tests with these exact behaviors:

```ts
it('includes default cosmetics in a new progress record', () => {
  expect(defaultProgress()).toMatchObject({
    selectedSkinId: 'default-suit',
    selectedBaseDecorationId: 'default-hangar',
    unlockedCosmeticIds: ['default-suit', 'default-hangar'],
  });
});

it('unlocks the helmet at base level 3 and the HQ decoration at base level 5', () => {
  const levelThree = applyMissionReward({ ...defaultProgress(), parts: 5 }, 1);
  expect(levelThree).toMatchObject({ baseLevel: 3, unlockedCosmeticIds: ['default-suit', 'default-hangar', 'rescue-helmet'] });

  const levelFive = applyMissionReward({ ...defaultProgress(), parts: 11 }, 1);
  expect(levelFive).toMatchObject({ baseLevel: 5, unlockedCosmeticIds: ['default-suit', 'default-hangar', 'rescue-helmet', 'signal-hq'] });
});

it('does not duplicate cosmetic unlocks when rewards cross the same level twice', () => {
  const once = applyMissionReward({ ...defaultProgress(), parts: 5 }, 1);
  const twice = applyMissionReward(once, 1);
  expect(twice.unlockedCosmeticIds.filter((id) => id === 'rescue-helmet')).toHaveLength(1);
});
```

- [ ] **Step 2: Run the progression tests and observe the expected RED failure**

Run: `pnpm vitest run tests/core/progression.test.ts`
Expected: FAIL because the new `Progress` fields and unlock logic do not exist.

- [ ] **Step 3: Implement the minimal progression model and unlock calculation**

Add the exact cosmetic union and fields, set the two default IDs in `defaultProgress()`, and use a small fixed unlock table inside `applyMissionReward`. Preserve existing stars, parts, base level, missions, and settings.

```ts
export type CosmeticId = 'default-suit' | 'default-hangar' | 'rescue-helmet' | 'signal-hq';
export type SkinId = 'default-suit' | 'rescue-helmet';
export type BaseDecorationId = 'default-hangar' | 'signal-hq';
```

Unlock IDs must be appended only when absent and must be selected in no automatic way; selection remains a UI concern.

- [ ] **Step 4: Add failing storage migration tests**

Add a test that persists a valid old-format object with no cosmetic fields and verifies that `load()` preserves `stars`, `parts`, `baseLevel`, `unlockedMissionIds`, and `settings` while filling the two default selections and default unlock IDs. Add a second test that rejects an invalid selected ID and returns `defaultProgress()`.

- [ ] **Step 5: Run the storage tests and observe RED**

Run: `pnpm vitest run tests/storage/progress-store.test.ts`
Expected: FAIL because the current validator treats missing cosmetic fields as invalid and has no migration path.

- [ ] **Step 6: Implement safe progress normalization**

Keep `STORAGE_KEY` unchanged. Parse an object with the existing fields, merge it over `defaultProgress()`, validate counts/settings, normalize cosmetic arrays to known IDs, and fall back to defaults only for structurally invalid legacy data. Return cloned arrays/settings as the existing store does.

- [ ] **Step 7: Add the update-history module and tests**

Create a newest-first immutable list containing the current feature entry and prior implemented milestones:

```ts
export interface UpdateEntry { date: string; title: string; summary: string; }
export function getUpdateHistory(): readonly UpdateEntry[];
```

The current entry date is `2026-08-13`, titled `기지 성장과 본부 꾸미기`, and summarizes cosmetic unlocks and the update panel. Test date format, newest-first ordering, required strings, and that callers cannot mutate the source list.

- [ ] **Step 8: Run the focused green suite and commit**

Run: `pnpm vitest run tests/core/progression.test.ts tests/storage/progress-store.test.ts tests/core/update-history.test.ts`
Then commit: `git add src/core/progression.ts src/storage/progress-store.ts src/core/update-history.ts tests/core/progression.test.ts tests/storage/progress-store.test.ts tests/core/update-history.test.ts && git commit -m "feat: add cosmetic progression data"`

### Task 2: Base customization and update-history UI

**Files:**
- Modify: `src/scenes/base-scene.ts`
- Modify: `src/styles.css`
- Test: `tests/e2e/rhythm-rescue.spec.ts`

**Interfaces:**
- Consumes the normalized `Progress` from Task 1 and `getUpdateHistory()`.
- Produces accessible buttons with stable labels and classes: `.cosmetic-option`, `.update-history-button`, `.update-history-panel`, and `.start-button.gi-pulse`.

- [ ] **Step 1: Write failing E2E tests for the base UI**

Add Playwright tests for:

```ts
test('shows locked cosmetics and a closed update history panel', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: '헬멧 스킨' })).toBeDisabled();
  await expect(page.getByText('기지 레벨 3에서 해금')).toBeVisible();
  await expect(page.getByRole('button', { name: '업데이트 내역' })).toBeVisible();
  await expect(page.locator('.update-history-panel')).toBeHidden();
});

test('opens dated updates and highlights the required mission button', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.start-button')).toHaveClass(/gi-pulse/);
  await page.getByRole('button', { name: '업데이트 내역' }).click();
  await expect(page.locator('.update-history-panel')).toBeVisible();
  await expect(page.getByText('2026-08-13')).toBeVisible();
});

test('selects an unlocked cosmetic and persists the choice', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('rhythm-rescue-progress-v1', JSON.stringify({
    stars: 6, parts: 6, baseLevel: 3, unlockedMissionIds: ['tutorial'],
    settings: { sound: true, vibration: true, reducedMotion: false, relaxedTiming: false },
    selectedSkinId: 'default-suit', selectedBaseDecorationId: 'default-hangar',
    unlockedCosmeticIds: ['default-suit', 'default-hangar', 'rescue-helmet'],
  }));
  await page.reload();
  await page.getByRole('button', { name: '헬멧 스킨' }).click();
  await expect(page.getByRole('button', { name: '헬멧 스킨' })).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('rhythm-rescue-progress-v1') ?? '{}').selectedSkinId)).toBe('rescue-helmet');
});
```

- [ ] **Step 2: Run the focused E2E tests and observe RED**

Run: `pnpm test:e2e tests/e2e/rhythm-rescue.spec.ts`
Expected: FAIL because the cosmetic controls, update panel, and `gi-pulse` class do not exist.

- [ ] **Step 3: Implement BaseScene cosmetic controls**

Render a `기지 꾸미기` section with four buttons. Use `disabled` for locked IDs, `aria-pressed` for selected IDs, visible unlock requirements, and a shared `selectCosmetic` callback that validates `progress.unlockedCosmeticIds`, updates only the relevant selected field, saves through `createProgressStore`, and re-renders the base screen. Keep the existing mission buttons and settings panel behavior intact.

Use stable accessible names exactly: `기본 스킨`, `헬멧 스킨`, `기본 격납고`, `신호 관제실`, `업데이트 내역`, and `첫 구조 임무 시작`.

- [ ] **Step 4: Implement the update history panel**

Create a closed `section.update-history-panel` with `aria-label="업데이트 내역"`. The `업데이트 내역` button toggles `hidden`, `aria-expanded`, and panel visibility. Render entries from `getUpdateHistory()` in list order with `<time datetime="YYYY-MM-DD">`.

- [ ] **Step 5: Add themed CSS and motion-safe `gi-pulse`**

Add CSS variables/classes for selected cosmetics, `.cosmetic-grid`, `.cosmetic-option`, `.update-history-panel`, and `.gi-pulse`. Keep the primary start button visually dominant, stack the cosmetic grid and history panel below the stats on narrow screens, and ensure `.screen` remains within the viewport. Add:

```css
@keyframes gi-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(126, 231, 255, 0.2); }
  50% { box-shadow: 0 0 0 9px rgba(126, 231, 255, 0); }
}
.gi-pulse { animation: gi-pulse 1.8s ease-in-out infinite; }
.reduced-motion .gi-pulse { animation: none; }
@media (prefers-reduced-motion: reduce) {
  .gi-pulse { animation: none; }
}
```

- [ ] **Step 6: Run the focused E2E suite and commit**

Run the base UI tests plus existing mission smoke tests. Then commit: `git add src/scenes/base-scene.ts src/styles.css tests/e2e/rhythm-rescue.spec.ts && git commit -m "feat: add base customization and update history"`

### Task 3: Documentation, responsive playtest, and integration verification

**Files:**
- Modify: `README.md`
- Modify: `docs/superpowers/specs/2026-08-13-rhythm-rescue-next-phase-design.md`
- Test: `tests/e2e/rhythm-rescue.spec.ts`

**Interfaces:**
- Consumes the completed progression and BaseScene UI from Tasks 1–2.
- Produces user-facing scope documentation and browser evidence for desktop, mobile, reduced motion, and keyboard use.

- [ ] **Step 1: Add failing responsive and reduced-motion E2E checks**

Add tests that set `375x667`, open the base screen, assert the cosmetic grid fits within the viewport, assert the `gi-pulse` animation is `none` after enabling the existing `축소 모션` setting, and activate the update button with keyboard `Enter`.

- [ ] **Step 2: Run the checks and observe RED**

Run: `pnpm test:e2e tests/e2e/rhythm-rescue.spec.ts`
Expected: at least the new viewport, reduced-motion, and keyboard assertions fail before the required responsive/accessibility adjustments are complete.

- [ ] **Step 3: Implement only the required responsive/accessibility adjustments**

Adjust CSS and BaseScene semantics so the existing 64px direction controls remain untouched, the base screen scrolls instead of overflowing, focus returns to the update button when the panel closes, and all new options have visible focus outlines.

- [ ] **Step 4: Update README and next-phase scope**

Document the new fixed unlock rules, cosmetic selection persistence, the `업데이트 내역` button, and the distinction between implemented work and remaining extended mobile playtesting. Keep the existing exact labels `수리 소리 사용` and `진동 사용`.

- [ ] **Step 5: Run the complete verification set**

Run:

```bash
pnpm exec tsc -b --pretty false
pnpm test
pnpm test:e2e
pnpm build
git diff --check
```

For the browser-game playtest, inspect the base screen at desktop and `375x667`, confirm the playfield remains readable, the required start action is visibly pulsing unless reduced motion is enabled, and the update panel does not obscure mission controls.

- [ ] **Step 6: Commit the documentation and verification changes**

Commit: `git add README.md docs/superpowers/specs/2026-08-13-rhythm-rescue-next-phase-design.md tests/e2e/rhythm-rescue.spec.ts src/scenes/base-scene.ts src/styles.css && git commit -m "docs: record base customization and update history"`
