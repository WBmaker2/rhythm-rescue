# Rhythm Rescue Gameplay Revision Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 중앙 HUD 가림을 제거하고, 패턴 스캔·기억 입력·3D 수리 피드백이 실제 게임플레이로 느껴지는 임무 루프를 구현한다.

**Architecture:** 순수 타이밍 계산은 `src/game/simulation`에 두고, `RhythmRescueGame`은 스캔 시작 시각과 현재 입력 상태를 조정한다. DOM HUD는 작은 패턴 카드와 입력 진행을 표시하며, Three.js 오브젝트는 방향 입력과 수리 진행의 시각적 결과만 받는다.

**Tech Stack:** TypeScript, Three.js, Vite, DOM overlays, Vitest, jsdom, Playwright

## Global Constraints

- 중앙 플레이필드와 하단 중앙 플레이필드는 정상 플레이 중 가린 면적을 최소화한다.
- 스캔 중에는 방향 입력을 잠그고, 스캔 종료 후에만 입력을 활성화한다.
- 패턴 미리보기 시간은 패턴 길이에 비례한다.
- 기존 키보드·터치 입력, 일시정지, reduced-motion, 업데이트 내역을 유지한다.
- 외부 3D 에셋과 서버 저장소를 추가하지 않는다.

---

### Task 1: 순차 패턴 타이밍과 입력 규칙

**Files:**
- Create: `src/game/simulation/pattern-preview.ts`
- Modify: `src/core/pattern-generator.ts`
- Modify: `src/game/rhythm-rescue-game.ts`
- Create: `tests/game/pattern-preview.test.ts`
- Modify: `tests/core/pattern-generator.test.ts`

- [x] **Step 1: Write failing timing tests.**

```ts
import { describe, expect, it } from 'vitest';
import { getPreviewDurationMs, getPreviewIndex } from '../../src/game/simulation/pattern-preview';

describe('pattern preview timing', () => {
  it('adds one beat for each pattern item and a final hold', () => {
    expect(getPreviewDurationMs(1, 320)).toBe(740);
    expect(getPreviewDurationMs(3, 320)).toBe(1380);
  });

  it('reveals one cumulative item at a time', () => {
    expect(getPreviewIndex(0, 3, 320)).toBe(0);
    expect(getPreviewIndex(319, 3, 320)).toBe(0);
    expect(getPreviewIndex(320, 3, 320)).toBe(1);
    expect(getPreviewIndex(1_000, 3, 320)).toBe(2);
  });
});
```

- [x] **Step 2: Run the focused test and confirm the module is missing.**

Run: `node node_modules/vitest/vitest.mjs run tests/game/pattern-preview.test.ts`

- [x] **Step 3: Implement the immutable timing helpers and non-repeating adjacent direction generation.**

- [x] **Step 4: Wire scan start, scan index, and input lock into `RhythmRescueGame`.**

- [x] **Step 5: Run timing, core, and type tests.**

### Task 2: Compact responsive HUD

**Files:**
- Modify: `src/ui/hud/game-hud.ts`
- Modify: `src/ui/hud/pattern-display.ts`
- Modify: `src/ui/controls/direction-controls.ts`
- Modify: `src/ui/game-ui.ts`
- Modify: `src/styles.css`
- Modify: `tests/ui/game-ui.test.ts`
- Modify: `tests/e2e/rhythm-rescue.spec.ts`

- [x] **Step 1: Add a failing jsdom assertion for disabled scan controls and inline status.**
- [x] **Step 2: Move mission status inside the pattern card and add `previewIndex` to the pattern display contract.**
- [x] **Step 3: Add compact desktop/mobile layout rules and remove status overlap with the direction pad.**
- [x] **Step 4: Run the UI tests and a focused Playwright layout check.**

### Task 3: 3D input and repair feedback

**Files:**
- Modify: `src/game/rhythm-rescue-game.ts`
- Modify: `src/render/objects/rescue-agent.ts`
- Modify: `src/render/objects/repair-target.ts`
- Modify: `src/render/objects/obstacles.ts`
- Modify: `tests/e2e/rhythm-rescue.spec.ts`

- [x] **Step 1: Add a failing browser assertion for the scan phase and repair progress.**
- [x] **Step 2: Pulse the selected rail, move to a stable direction anchor, and increase repair target power after each completed point.**
- [x] **Step 3: Add obstacle telegraph state without making obstacles instant failure sources.**
- [x] **Step 4: Run the full test suite and desktop/mobile screenshots.**

### Task 4: Documentation, verification, and handoff

**Files:**
- Modify: `README.md`
- Modify: `src/core/update-history-catalog.json`
- Regenerate: `src/core/update-history.generated.ts`

- [x] **Step 1: Add the gameplay revision to the dated update catalog.**
- [x] **Step 2: Run typecheck, all unit tests, production build, and Playwright E2E.**
- [x] **Step 3: Verify the 1440x900 and 375x667 screenshots for playfield clearance.**
- [x] **Step 4: Commit the implementation and report the live deployment status.**
