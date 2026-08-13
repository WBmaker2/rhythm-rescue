# 《리듬 구조대》 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 키보드·마우스·터치로 네 방향 수리 신호를 입력해 구조 임무를 완료하고, 로컬 진행도로 구조대 기지를 확장하는 브라우저 게임 MVP를 만든다.

**Architecture:** Phaser 씬은 화면과 애니메이션을 담당하고, 게임 규칙은 프레임워크와 분리된 순수 TypeScript 모듈로 둔다. InputAdapter가 모든 장치의 이벤트를 `Direction`으로 정규화해 MissionEngine에 전달하고, 임무 결과는 ProgressStore를 거쳐 UI를 갱신한다.

**Tech Stack:** TypeScript, Vite, Phaser 3, Vitest, Playwright, localStorage.

## Global Constraints

- 웹 브라우저에서 키보드(방향키·WASD), 마우스, 터치를 모두 지원한다.
- 수리 신호는 `up`, `right`, `down`, `left` 네 가지뿐이다.
- 임무당 복구 신호는 최대 2회이며, 세 번째 실수 이후에도 임무는 완료할 수 있다.
- 3~5분, 7~10분, 10~15분 임무에서 한 번에 하나의 새 난이도 변화만 추가한다.
- 시간은 보상 등급 요소이며 즉시 실패 조건이 아니다.
- 소리 없이 플레이 가능하고, 색 이외의 방향 아이콘을 반드시 표시한다.
- 광고, 결제, 로그인, 온라인 통신, 채팅, 공개 순위표, 자동 다음 임무 시작을 만들지 않는다.
- 진행도와 접근성 설정은 브라우저 localStorage에만 저장한다.

---

## File Structure

```text
index.html
package.json
vite.config.ts
src/
  main.ts
  styles.css
  core/
    types.ts
    pattern-generator.ts
    mission-engine.ts
    mission-config.ts
    progression.ts
  input/
    input-adapter.ts
  storage/
    progress-store.ts
  scenes/
    boot-scene.ts
    base-scene.ts
    mission-scene.ts
    result-scene.ts
  ui/
    direction-pad.ts
    accessibility-panel.ts
tests/
  core/pattern-generator.test.ts
  core/mission-engine.test.ts
  core/mission-config.test.ts
  core/progression.test.ts
  input/input-adapter.test.ts
  storage/progress-store.test.ts
  e2e/rhythm-rescue.spec.ts
```

## Task 1: 프로젝트 스캐폴드와 테스트 실행 환경

**Files:**
- Create: `package.json`, `index.html`, `vite.config.ts`, `src/main.ts`, `src/styles.css`, `src/scenes/boot-scene.ts`
- Create: `tests/scaffold.test.ts`

**Interfaces:**
- Produces: `npm run dev`, `npm run build`, `npm test`, `npm run test:e2e` 실행 명령

- [ ] **Step 1: 제목 검증 테스트를 작성한다.**

```ts
// tests/scaffold.test.ts
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, it } from 'vitest';

it('uses the approved game title', () => {
  const html = readFileSync(resolve('index.html'), 'utf8');
  expect(html).toContain('<title>리듬 구조대</title>');
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다.**

Run: `pnpm vitest run tests/scaffold.test.ts`  
Expected: FAIL because `index.html` does not exist or has no approved title.

- [ ] **Step 3: Vite·Phaser·Vitest·Playwright 설정과 최소 앱을 작성한다.**

```ts
// src/main.ts
import Phaser from 'phaser';
import './styles.css';
import { BootScene } from './scenes/boot-scene';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  width: 1280,
  height: 720,
  backgroundColor: '#0b1630',
  scene: [BootScene],
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
});
```

```ts
// src/scenes/boot-scene.ts
import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  create(): void {
    this.add.text(32, 32, '리듬 구조대', { color: '#ffffff' });
  }
}
```

`index.html`에는 `<div id="app"></div>`와 정확히 `<title>리듬 구조대</title>`를 넣는다. `package.json`에는 `dev`, `build`, `test`, `test:e2e` 스크립트를 정의한다.

- [ ] **Step 4: 단위 테스트와 프로덕션 빌드를 확인한다.**

Run: `pnpm vitest run tests/scaffold.test.ts && pnpm build`  
Expected: PASS, 그리고 Vite가 `dist/`를 생성한다.

- [ ] **Step 5: 커밋한다.**

```bash
git add package.json index.html vite.config.ts src/main.ts src/styles.css src/scenes/boot-scene.ts tests/scaffold.test.ts
git commit -m "chore: scaffold rhythm rescue game"
```

## Task 2: 방향·난이도·패턴 생성 도메인

**Files:**
- Create: `src/core/types.ts`, `src/core/mission-config.ts`, `src/core/pattern-generator.ts`
- Create: `tests/core/mission-config.test.ts`, `tests/core/pattern-generator.test.ts`

**Interfaces:**
- Produces:

```ts
export type Direction = 'up' | 'right' | 'down' | 'left';
export type MissionLength = 'short' | 'medium' | 'long';
export interface MissionConfig { id: string; length: MissionLength; repairPoints: number; patternMin: number; patternMax: number; obstacle: 'none' | 'drone' | 'occluder' | 'mixed'; }
export function getMissionConfig(id: string): MissionConfig;
export function generatePattern(length: number, random: () => number): Direction[];
```

- [ ] **Step 1: 미션 범위와 패턴 출력 테스트를 작성한다.**

```ts
expect(getMissionConfig('short-01')).toMatchObject({ repairPoints: 3, patternMin: 3, patternMax: 6, obstacle: 'none' });
expect(getMissionConfig('medium-01')).toMatchObject({ repairPoints: 5, patternMin: 5, patternMax: 9, obstacle: 'drone' });
expect(generatePattern(6, () => 0.51)).toHaveLength(6);
expect(generatePattern(6, () => 0.51).every((d) => ['up', 'right', 'down', 'left'].includes(d))).toBe(true);
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다.**

Run: `pnpm vitest run tests/core/mission-config.test.ts tests/core/pattern-generator.test.ts`  
Expected: FAIL because exported modules do not exist.

- [ ] **Step 3: 세 가지 임무 길이 설정과 결정 가능한 패턴 생성기를 구현한다.**

```ts
const DIRECTIONS: Direction[] = ['up', 'right', 'down', 'left'];

export function generatePattern(length: number, random: () => number): Direction[] {
  return Array.from({ length }, () => DIRECTIONS[Math.floor(random() * DIRECTIONS.length)]);
}
```

`short-01`, `medium-01`, `long-01`은 각각 한 가지 난이도 변화만 포함하도록 정의한다. long 미션은 수리 순서 선택과 `mixed` 장애물을 사용한다.

- [ ] **Step 4: 테스트를 통과시킨다.**

Run: `pnpm vitest run tests/core/mission-config.test.ts tests/core/pattern-generator.test.ts`  
Expected: PASS.

- [ ] **Step 5: 커밋한다.**

```bash
git add src/core tests/core
git commit -m "feat: add mission configuration and patterns"
```

## Task 3: 수리·복구·보상 판정 엔진

**Files:**
- Create: `src/core/mission-engine.ts`
- Create: `tests/core/mission-engine.test.ts`

**Interfaces:**
- Consumes: `Direction`, `MissionConfig`, `generatePattern`
- Produces:

```ts
export type MissionPhase = 'preview' | 'input' | 'recovery' | 'complete';
export interface MissionState { phase: MissionPhase; pattern: Direction[]; cursor: number; mistakes: number; recoveriesLeft: number; combo: number; completedPoints: number; rewardTier: 1 | 2 | 3; }
export function createMissionState(pattern: Direction[]): MissionState;
export function submitDirection(state: MissionState, direction: Direction): MissionState;
export function useRecovery(state: MissionState): MissionState;
```

- [ ] **Step 1: 성공·실수·복구의 실패 테스트를 작성한다.**

```ts
it('replays from the mistaken position while a recovery remains', () => {
  const state = { ...createMissionState(['up', 'right']), phase: 'input' as const };
  const afterMistake = submitDirection(state, 'left');
  expect(afterMistake).toMatchObject({ phase: 'recovery', cursor: 0, mistakes: 1, combo: 0, recoveriesLeft: 2 });
  expect(useRecovery(afterMistake)).toMatchObject({ phase: 'input', recoveriesLeft: 1 });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다.**

Run: `pnpm vitest run tests/core/mission-engine.test.ts`  
Expected: FAIL because `MissionEngine` exports do not exist.

- [ ] **Step 3: 불변 상태 전환으로 엔진을 구현한다.**

`submitDirection`은 맞는 입력이면 cursor와 combo를 올린다. 실수 시 combo를 0으로 만들고, 남은 복구가 있으면 `recovery`로 전환한다. 복구가 없으면 input 상태를 유지하되 mistakes를 증가시킨다. 패턴 끝에 도달하면 rewardTier를 계산하고 `complete`로 전환한다.

- [ ] **Step 4: 전체 엔진 규칙을 테스트한다.**

Run: `pnpm vitest run tests/core/mission-engine.test.ts`  
Expected: PASS for 정확 입력, 두 번의 복구, 세 번째 실수 후 계속, 완료 등급.

- [ ] **Step 5: 커밋한다.**

```bash
git add src/core/mission-engine.ts tests/core/mission-engine.test.ts
git commit -m "feat: add repair mission engine"
```

## Task 4: 장치별 입력 정규화

**Files:**
- Create: `src/input/input-adapter.ts`
- Create: `tests/input/input-adapter.test.ts`

**Interfaces:**
- Consumes: `Direction`
- Produces:

```ts
export function directionFromKeyboard(key: string): Direction | null;
export function createInputGate(minIntervalMs: number): { accept(direction: Direction, now: number): Direction | null };
```

- [ ] **Step 1: 키 매핑과 중복 입력 테스트를 작성한다.**

```ts
expect(directionFromKeyboard('ArrowUp')).toBe('up');
expect(directionFromKeyboard('d')).toBe('right');
const gate = createInputGate(80);
expect(gate.accept('up', 100)).toBe('up');
expect(gate.accept('up', 120)).toBeNull();
expect(gate.accept('up', 181)).toBe('up');
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다.**

Run: `pnpm vitest run tests/input/input-adapter.test.ts`  
Expected: FAIL because input adapter is absent.

- [ ] **Step 3: 키보드, 버튼 클릭, 터치가 같은 콜백을 사용하도록 구현한다.**

`directionFromKeyboard`은 방향키와 대소문자 무관 WASD만 변환한다. `createInputGate`는 80ms 안의 중복 신호를 버린다. 이후 UI 버튼에는 `pointerdown`만 연결하고 방향 문자열만 MissionScene에 전달한다.

- [ ] **Step 4: 테스트와 브라우저 수동 점검을 실행한다.**

Run: `pnpm vitest run tests/input/input-adapter.test.ts`  
Expected: PASS.  
Manual: 한 임무에서 ArrowUp, W, 클릭, 터치가 모두 `up`으로 판정되는지 확인한다.

- [ ] **Step 5: 커밋한다.**

```bash
git add src/input tests/input
git commit -m "feat: normalize repair inputs"
```

## Task 5: 진행도와 로컬 저장

**Files:**
- Create: `src/core/progression.ts`, `src/storage/progress-store.ts`
- Create: `tests/core/progression.test.ts`, `tests/storage/progress-store.test.ts`

**Interfaces:**
- Produces:

```ts
export interface Progress { stars: number; parts: number; baseLevel: 1 | 2 | 3 | 4 | 5; unlockedMissionIds: string[]; settings: { sound: boolean; vibration: boolean; reducedMotion: boolean; relaxedTiming: boolean }; }
export function defaultProgress(): Progress;
export function applyMissionReward(progress: Progress, tier: 1 | 2 | 3): Progress;
export function createProgressStore(storage: Storage): { load(): Progress; save(progress: Progress): boolean };
```

- [ ] **Step 1: 보상·기지 해금·저장 실패 테스트를 작성한다.**

```ts
const throwingStorage = {
  getItem: () => { throw new Error('blocked'); },
  setItem: () => { throw new Error('blocked'); },
  removeItem: () => undefined,
  clear: () => undefined,
  key: () => null,
  length: 0,
} as unknown as Storage;

expect(applyMissionReward(defaultProgress(), 3)).toMatchObject({ stars: 3, parts: 3 });
expect(createProgressStore(throwingStorage).save(defaultProgress())).toBe(false);
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다.**

Run: `pnpm vitest run tests/core/progression.test.ts tests/storage/progress-store.test.ts`  
Expected: FAIL because progression and storage modules are absent.

- [ ] **Step 3: 고정 보상과 안전한 저장소를 구현한다.**

별 등급은 같은 수의 별과 구조 부품을 준다. 기지 레벨은 누적 구조 부품의 명시적 경계값으로 1~5를 계산한다. 저장·파싱 오류는 기본 Progress를 반환하고 UI가 세션 전용 경고를 표시할 수 있도록 `false`를 반환한다.

- [ ] **Step 4: 테스트를 통과시킨다.**

Run: `pnpm vitest run tests/core/progression.test.ts tests/storage/progress-store.test.ts`  
Expected: PASS.

- [ ] **Step 5: 커밋한다.**

```bash
git add src/core/progression.ts src/storage tests/core tests/storage
git commit -m "feat: add local rescue progression"
```

## Task 6: 본부·임무·결과 씬과 네 방향 패드

**Files:**
- Modify: `src/scenes/boot-scene.ts`
- Create: `src/scenes/base-scene.ts`, `src/scenes/mission-scene.ts`, `src/scenes/result-scene.ts`, `src/ui/direction-pad.ts`
- Create: `tests/e2e/rhythm-rescue.spec.ts`

**Interfaces:**
- Consumes: `MissionState`, `submitDirection`, `Progress`, `Direction`
- Produces: 본부 → 임무 → 결과 → 본부의 화면 흐름

- [ ] **Step 1: 첫 임무 시작 흐름의 E2E 테스트를 작성한다.**

```ts
import { expect, test } from '@playwright/test';

test('starts and completes the tutorial rescue', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '첫 구조 임무 시작' }).click();
  await expect(page.getByText('엔진 신호 복원 중')).toBeVisible();
  await page.getByRole('button', { name: '위 수리 신호' }).click();
  await expect(page.getByText('임무 결과')).toBeVisible();
});
```

- [ ] **Step 2: E2E 테스트가 실패하는지 확인한다.**

Run: `pnpm playwright test tests/e2e/rhythm-rescue.spec.ts`  
Expected: FAIL because the scenes and accessible buttons do not exist.

- [ ] **Step 3: 화면 흐름을 구현한다.**

BootScene은 저장된 Progress를 읽고 BaseScene을 연다. BaseScene은 기지 레벨, 구조 부품, `첫 구조 임무 시작` 버튼을 표시한다. 튜토리얼은 E2E와 첫 경험을 위해 고정 패턴 `['up']` 하나로 시작한다. MissionScene은 상단 임무 정보, 중앙 수리 대상과 패턴, 보조 진행 패널, 하단 네 방향 패드를 표시한다. DirectionPad의 버튼 접근성 이름은 `위 수리 신호`, `오른쪽 수리 신호`, `아래 수리 신호`, `왼쪽 수리 신호`로 지정한다. ResultScene은 별, 부품, 실패 원인, `본부로 돌아가기` 버튼을 표시하고 자동 다음 임무를 시작하지 않는다.

- [ ] **Step 4: E2E와 프로덕션 빌드를 통과시킨다.**

Run: `pnpm playwright test tests/e2e/rhythm-rescue.spec.ts && pnpm build`  
Expected: PASS.

- [ ] **Step 5: 커밋한다.**

```bash
git add src/scenes src/ui tests/e2e
git commit -m "feat: add rescue mission interface"
```

## Task 7: 장애물·접근성·일시정지

**Files:**
- Create: `src/ui/accessibility-panel.ts`
- Modify: `src/scenes/mission-scene.ts`, `src/scenes/base-scene.ts`, `src/styles.css`
- Test: `tests/e2e/rhythm-rescue.spec.ts`

**Interfaces:**
- Consumes: `MissionConfig.obstacle`, `Progress.settings`
- Produces: 드론·가림 효과, 설정 패널, 포커스 이탈 자동 일시정지

- [ ] **Step 1: 접근성 설정과 일시정지 E2E 테스트를 추가한다.**

```ts
test('pauses the mission and can reduce motion', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '접근성 설정' }).click();
  await page.getByLabel('화면 흔들림 줄이기').check();
  await page.getByRole('button', { name: '첫 구조 임무 시작' }).click();
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await expect(page.getByText('임무 일시정지')).toBeVisible();
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다.**

Run: `pnpm playwright test tests/e2e/rhythm-rescue.spec.ts`  
Expected: FAIL because settings and pause overlay are absent.

- [ ] **Step 3: 장애물과 접근성 동작을 구현한다.**

medium 미션의 drone은 패드 일부를 500ms 이하로 시각적으로 가릴 수 있지만 입력을 바꾸지 않는다. long 미션의 mixed 장애물은 드론과 가림 효과를 순차로 사용한다. `blur` 또는 `visibilitychange`에서 입력을 막고 `임무 일시정지` 오버레이를 보여 준다. 설정 패널은 소리, 진동, 축소 모션, 시간 목표 완화를 토글하고 ProgressStore에 저장한다. 축소 모션에서는 흔들림과 확대 애니메이션을 즉시 상태 전환으로 대체한다.

- [ ] **Step 4: 접근성 검증을 통과시킨다.**

Run: `pnpm playwright test tests/e2e/rhythm-rescue.spec.ts && pnpm vitest run && pnpm build`  
Expected: PASS.  
Manual: 소리를 끈 상태에서 아이콘만으로 패턴을 완료하고, 좁은 화면에서 네 버튼을 터치해 본다.

- [ ] **Step 5: 커밋한다.**

```bash
git add src/scenes src/ui src/styles.css tests/e2e
git commit -m "feat: add accessible rescue obstacles"
```

## Task 8: 전체 회귀 확인과 문서 동기화

**Files:**
- Modify: `README.md`
- Verify: `docs/superpowers/specs/2026-08-11-rhythm-rescue-design.md`

**Interfaces:**
- Consumes: 모든 앞선 작업
- Produces: 실행 방법과 MVP 범위를 설명하는 프로젝트 README

- [ ] **Step 1: README 완료 기준 테스트 목록을 작성한다.**

```markdown
## Verification

- `pnpm vitest run`
- `pnpm playwright test`
- `pnpm build`
- 키보드·마우스·터치로 튜토리얼 임무 완료
- 소리 끔·축소 모션·포커스 이탈 일시정지 확인
```

- [ ] **Step 2: 현재 전체 검증이 실패하는지 또는 누락됐는지 확인한다.**

Run: `pnpm vitest run && pnpm playwright test && pnpm build`  
Expected: PASS; 실패 시 해당 작업의 테스트부터 수정한다.

- [ ] **Step 3: README에 실행·조작·저장 범위를 작성한다.**

README는 개발 서버 실행 명령, 방향키/WASD/클릭/터치 조작, localStorage만 사용한다는 사실, 온라인·결제·광고가 없다는 범위를 명시한다.

- [ ] **Step 4: 최종 전체 검증을 실행한다.**

Run: `pnpm vitest run && pnpm playwright test && pnpm build`  
Expected: 모든 테스트 PASS 및 빌드 성공.

- [ ] **Step 5: 커밋한다.**

```bash
git add README.md docs/superpowers/specs/2026-08-11-rhythm-rescue-design.md
git commit -m "docs: finalize rhythm rescue MVP"
```
