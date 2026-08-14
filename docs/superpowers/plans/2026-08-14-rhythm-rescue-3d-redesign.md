# 《리듬 구조대》 3D 재설계 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Phaser 기반 2D 화면을 Three.js 기반 3인칭 로우폴리 구조대 게임으로 전환하고, 기존 패턴·콤보·복구·보상·기지 확장 기능을 유지한다.

**Architecture:** `src/core`와 `src/game/simulation`이 저장 가능한 게임 규칙과 타이머를 소유한다. `src/render`는 Three.js 장면·카메라·오브젝트를 그 상태에 맞춰 갱신하며, `src/ui`는 DOM HUD·메뉴·접근성·업데이트 내역을 담당한다. 앱 진입점은 하나의 `RhythmRescueGame` 런타임으로 기지·임무·결과 화면을 전환한다.

**Tech Stack:** TypeScript, Vite, Three.js, DOM overlays, Vitest, jsdom, Playwright, GitHub Pages

## Global Constraints

- Three.js + TypeScript + Vite를 사용하고 Phaser 씬 런타임은 제거한다.
- 구조대원을 뒤에서 보는 3인칭 고정 추적 카메라를 사용한다.
- 시뮬레이션 상태는 Three.js 객체와 분리하고, 저장소에는 직렬화 가능한 Progress만 저장한다.
- HUD·메뉴·설정·업데이트 내역은 DOM으로 구현하며 중앙 플레이필드를 가리지 않는 저밀도 레이아웃을 유지한다.
- 초기 3D 오브젝트는 외부 모델 의존성이 없는 로우폴리 메시 팩토리로 만든다. 이후 모델을 추가할 때의 런타임 계약은 GLB/glTF 2.0과 GLTFLoader로 고정한다.
- 단계 진행에 필요한 `출동 시작`, 방향 입력, `기지로 돌아가기`, 다음 구조 요청 버튼에는 `gi-pulse`를 적용하고 reduced-motion에서는 정적 강조로 대체한다.
- 랜딩 화면에는 작은 `업데이트 내역` 버튼과 날짜별 기록이 있어야 한다.
- 데스크톱의 방향키/WASD와 모바일의 4방향 터치 입력은 동일한 Direction 액션으로 변환한다.
- DOM 단위 테스트는 Vitest의 `jsdom` 환경에서 실행하고, 순수 simulation 테스트는 Node 환경을 유지한다.
- 모든 작업은 작업별 테스트 또는 빌드 검증 후 커밋한다.

---

## 파일 구조와 책임

### 유지·확장

- `src/core/mission-engine.ts`: 한 수리 지점의 패턴 입력·오답·복구 상태
- `src/core/mission-run.ts`: 임무 전체의 수리 지점·콤보·보상 계산
- `src/core/progression.ts`: 부품·별·기지·코스메틱 진행
- `src/core/pattern-generator.ts`: 방향 패턴 생성
- `src/storage/progress-store.ts`: 직렬화 가능한 Progress 저장/복원
- `src/core/update-history.ts`, `src/core/update-history.generated.ts`: 날짜별 업데이트 기록

### 생성

- `src/game/simulation/game-state.ts`: 현재 화면, 임무 런, pause 상태를 보관하는 순수 상태 전이
- `src/game/simulation/mission-clock.ts`: 임무 제한 시간의 생성·tick·만료 판정
- `src/game/input/action-map.ts`: 물리 입력을 `Direction`과 시스템 액션으로 변환
- `src/game/input/input-controller.ts`: 키보드와 DOM 버튼을 연결하고 메뉴 입력을 잠금
- `src/game/content/mission-content.ts`: 임무별 색상, 장애물, 제한 시간, 3D 연출 설정
- `src/game/rhythm-rescue-game.ts`: Three.js, simulation, UI를 조정하는 앱 런타임
- `src/render/app/create-renderer.ts`: WebGL renderer와 resize/context-loss 경계
- `src/render/app/create-scene.ts`: 별, 안개, 조명, 월드 루트 구성
- `src/render/app/create-camera.ts`: 3인칭 추적 카메라와 follow 계산
- `src/render/app/create-game-loop.ts`: animation loop와 delta time 전달
- `src/render/objects/space-base.ts`: 착륙장·안테나·업그레이드 모듈 메시
- `src/render/objects/rescue-agent.ts`: 구조대원 메시와 이동/회전 애니메이션
- `src/render/objects/repair-target.ts`: 로봇·우주선 변형과 수리 발광
- `src/render/objects/energy-rails.ts`: 네 방향 발광 레일과 접점 링
- `src/render/objects/obstacles.ts`: 궤도 드론·신호 차단막 메시와 상태 갱신
- `src/render/materials/material-factory.ts`: 팔레트 기반 재사용 머티리얼
- `src/render/assets/manifest.ts`: 안정적인 에셋 키와 procedural/GLB 소스 메타데이터
- `src/render/assets/gltf-loader.ts`: 이후 GLB를 연결할 명시적 로더 경계
- `src/ui/game-ui.ts`: base/mission/result DOM 화면과 공통 루트
- `src/ui/hud/game-hud.ts`: 목표·상태·타이머·패턴 HUD
- `src/ui/hud/pattern-display.ts`: 홀로그램 패턴 프리뷰/입력 진행 표시
- `src/ui/controls/direction-controls.ts`: 키보드와 터치에서 공통으로 쓰는 방향 버튼
- `src/ui/menus/base-menu.ts`: 기지 화면, 출동 시작, 코스메틱, 업데이트 내역
- `src/ui/menus/pause-menu.ts`: 일시정지와 설정
- `src/ui/menus/result-menu.ts`: 결과·보상·기지 복귀·다음 구조 요청
- `src/styles.css`: 게임 팔레트·반응형·HUD·`gi-pulse` 스타일
- `tests/game/mission-clock.test.ts`: 제한 시간 순수 함수 테스트
- `tests/game/action-map.test.ts`: 입력 액션 매핑 테스트
- `tests/e2e/rhythm-rescue.spec.ts`: 3D 캔버스와 DOM 게임 흐름 테스트

### 제거·대체

- `src/main.ts`: Phaser.Game 초기화를 제거하고 `RhythmRescueGame`을 시작한다.
- `src/scenes/boot-scene.ts`, `src/scenes/base-scene.ts`, `src/scenes/mission-scene.ts`, `src/scenes/result-scene.ts`: Three.js 런타임으로 대체하므로 제거한다.
- `src/ui/direction-pad.ts`, `src/ui/obstacle-layer.ts`: 새 DOM controls/HUD 모듈로 대체한다.
- `package.json`: `phaser`를 제거하고 `three`를 추가한다.

---

### Task 1: Three.js 의존성과 순수 임무 타이머 경계

**Files:**
- Modify: `package.json`
- Create: `src/game/simulation/mission-clock.ts`
- Create: `tests/game/mission-clock.test.ts`
- Modify: `src/core/types.ts` only if the timer needs a shared mission type

**Interfaces:**
- Produces `MissionClockState = { limitMs: number; remainingMs: number; phase: 'running' | 'expired' }`.
- Produces `createMissionClock(limitMs: number): MissionClockState`.
- Produces `tickMissionClock(state: MissionClockState, deltaMs: number): MissionClockState`.
- Produces `isMissionClockExpired(state: MissionClockState): boolean`.

- [ ] **Step 1: Add the failing timer tests.**

```ts
import { describe, expect, it } from 'vitest';
import { createMissionClock, isMissionClockExpired, tickMissionClock } from '../../src/game/simulation/mission-clock';

describe('mission clock', () => {
  it('starts with the configured limit', () => {
    expect(createMissionClock(16_000)).toEqual({ limitMs: 16_000, remainingMs: 16_000, phase: 'running' });
  });

  it('subtracts elapsed time without going below zero', () => {
    const next = tickMissionClock(createMissionClock(1_000), 1_250);
    expect(next).toEqual({ limitMs: 1_000, remainingMs: 0, phase: 'expired' });
    expect(isMissionClockExpired(next)).toBe(true);
  });
});
```

- [ ] **Step 2: Run the focused test and verify it fails because the module is missing.**

Run: `npm test -- tests/game/mission-clock.test.ts`

Expected: FAIL with a module-not-found error for `src/game/simulation/mission-clock`.

- [ ] **Step 3: Implement the smallest immutable timer module.**

```ts
export interface MissionClockState {
  limitMs: number;
  remainingMs: number;
  phase: 'running' | 'expired';
}

export function createMissionClock(limitMs: number): MissionClockState {
  if (!Number.isFinite(limitMs) || limitMs <= 0) throw new RangeError('Mission clock limit must be positive');
  return { limitMs, remainingMs: limitMs, phase: 'running' };
}

export function tickMissionClock(state: MissionClockState, deltaMs: number): MissionClockState {
  const remainingMs = Math.max(0, state.remainingMs - Math.max(0, deltaMs));
  return { ...state, remainingMs, phase: remainingMs === 0 ? 'expired' : state.phase };
}

export function isMissionClockExpired(state: MissionClockState): boolean {
  return state.phase === 'expired';
}
```

- [ ] **Step 4: Install Three.js and run the focused timer test.**

Run: `npm install three`

Then run: `npm test -- tests/game/mission-clock.test.ts`

Expected: PASS with 2 tests.

- [ ] **Step 5: Run the existing core suite and commit.**

Run: `npm test -- tests/core`

Expected: all existing core tests pass.

```powershell
git add package.json package-lock.json src/game/simulation/mission-clock.ts tests/game/mission-clock.test.ts
git commit -m "feat: add three runtime and mission clock"
```

---

### Task 2: Three.js render foundation and procedural rescue scene

**Files:**
- Create: `src/render/app/create-renderer.ts`
- Create: `src/render/app/create-scene.ts`
- Create: `src/render/app/create-camera.ts`
- Create: `src/render/app/create-game-loop.ts`
- Create: `tests/render/create-camera.test.ts`
- Create: `src/render/materials/material-factory.ts`
- Create: `src/render/assets/manifest.ts`
- Create: `src/render/assets/gltf-loader.ts`
- Create: `src/render/objects/space-base.ts`
- Create: `src/render/objects/rescue-agent.ts`
- Create: `src/render/objects/repair-target.ts`
- Create: `src/render/objects/energy-rails.ts`
- Create: `src/render/objects/obstacles.ts`

**Interfaces:**
- `createRenderer(container: HTMLElement): THREE.WebGLRenderer` configures antialiasing, pixel ratio capped at 2, transparent background, resize, and context-loss listeners.
- `createGameScene(): { scene: THREE.Scene; world: THREE.Group }` returns a scene with fog, lights, stars, and a world root.
- `createFollowCamera(): { camera: THREE.PerspectiveCamera; update(target: THREE.Object3D, deltaMs: number): void }` keeps the camera behind the agent and aimed at the repair target.
- `createGameLoop(render: (deltaMs: number) => void): { start(): void; stop(): void }` calls the callback from `renderer.setAnimationLoop`.
- Object factories return disposable `THREE.Group` instances and update methods accept plain view-model values, not `MissionRunState` directly.

- [ ] **Step 1: Create the render contract test for the camera follow boundary.**

```ts
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { createFollowCamera } from '../../src/render/app/create-camera';

describe('follow camera', () => {
  it('keeps a positive distance behind the target after an update', () => {
    const target = new THREE.Object3D();
    target.position.set(2, 0, -3);
    const follow = createFollowCamera();
    follow.update(target, 16);
    expect(follow.camera.position.distanceTo(target.position)).toBeGreaterThan(1);
  });
});
```

- [ ] **Step 2: Run the focused test and verify the foundation is missing.**

Run: `npm test -- tests/render/create-camera.test.ts`

Expected: FAIL because `src/render/app/create-camera.ts` does not exist.

- [ ] **Step 3: Implement renderer, scene, camera, loop, materials, asset manifest, and object factories.**

Use the following contracts while implementing:

```ts
export interface FollowCamera {
  camera: THREE.PerspectiveCamera;
  update(target: THREE.Object3D, deltaMs: number): void;
}

export function createFollowCamera(): FollowCamera {
  const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 120);
  camera.position.set(0, 4.2, 7.2);
  return {
    camera,
    update(target, deltaMs) {
      const desired = target.position.clone().add(new THREE.Vector3(0, 3.2, 6.4));
      const alpha = 1 - Math.pow(0.001, Math.min(deltaMs, 50) / 1000);
      camera.position.lerp(desired, alpha);
      camera.lookAt(target.position.x, target.position.y + 0.9, target.position.z);
    },
  };
}
```

The scene must contain a landing pad, four emissive rails, a repair target, a procedural rescue agent, a few stars, and a fogged navy background. Reuse geometries/materials for repeated rails and obstacles.

- [ ] **Step 4: Run the focused render test and the TypeScript build.**

Run: `npm test -- tests/render/create-camera.test.ts`

Expected: PASS.

Run: `npm run build`

Expected: PASS after unused Phaser scene imports are removed or no longer included by the entry graph.

- [ ] **Step 5: Commit the render foundation.**

```powershell
git add src/render tests/render
git commit -m "feat: add procedural three rescue scene"
```

---

### Task 3: DOM HUD, controls, base/result menus, and update history

**Files:**
- Create: `src/ui/game-ui.ts`
- Create: `src/ui/hud/game-hud.ts`
- Create: `src/ui/hud/pattern-display.ts`
- Create: `src/ui/controls/direction-controls.ts`
- Create: `src/ui/menus/base-menu.ts`
- Create: `src/ui/menus/pause-menu.ts`
- Create: `src/ui/menus/result-menu.ts`
- Create: `tests/ui/game-ui.test.ts`
- Modify: `package.json` to add the `jsdom` dev dependency
- Modify: `src/core/update-history-catalog.json`
- Modify: `src/styles.css`
- Modify: `scripts/generate-update-history.mjs` only if the new entry shape requires it

**Interfaces:**
- `createGameUi(root: HTMLElement): GameUi` returns `showBase`, `showMission`, `showResult`, `showPause`, `clear`, and `getRoot` methods.
- `createDirectionControls(onDirection: (direction: Direction) => void): HTMLElement` renders four accessible buttons using the shared Direction type.
- `renderMissionHud(container: HTMLElement, view: MissionHudView): void` updates objective, pattern, timer, combo, parts, and input progress without rebuilding the canvas.
- `createPatternDisplay(pattern: readonly Direction[], cursor: number, previewVisible: boolean): HTMLElement` masks unrevealed directions and adds accessible text.

- [ ] **Step 1: Add a DOM contract test for the required step button.**

```ts
import { describe, expect, it } from 'vitest';
import { createGameUi } from '../../src/ui/game-ui';

describe('game UI', () => {
  it('marks the base launch button with gi-pulse until it is clicked', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const ui = createGameUi(document.getElementById('app')!);
    ui.showBase({ parts: 0, baseLevel: 1, onStart: () => undefined });
    const button = document.querySelector<HTMLButtonElement>('[data-action="start-mission"]');
    expect(button?.classList.contains('gi-pulse')).toBe(true);
    button?.click();
    expect(button?.classList.contains('gi-pulse')).toBe(false);
  });
});
```

- [ ] **Step 2: Run the focused test and verify it fails because the new UI module is missing.**

Run: `npm test -- tests/ui/game-ui.test.ts`

Expected: FAIL with a module-not-found error for `src/ui/game-ui`.

- [ ] **Step 3: Implement the DOM screens and HUD.**

Run `npm install -D jsdom` before implementing the browser-facing modules. Add `/** @vitest-environment jsdom */` as the first line of `tests/ui/game-ui.test.ts` so the UI contract test has a real DOM while the rest of the Vitest suite remains on the Node environment.

The base view must include `data-action="start-mission"`, a small `업데이트 내역` button, and a closed-by-default update panel. The mission view must include `aria-live="polite"`, pattern preview, timer, status strip, and direction buttons. The result view must include `data-action="return-to-base"` and `data-action="next-mission"` as applicable.

- [ ] **Step 4: Replace styles with the approved neon low-poly UI system.**

Define CSS variables for navy background, cyan signal, lime success, orange warning, pink hazard, and gold reward. Keep the center clear, set touch targets to at least 52px, implement desktop/mobile layout changes, and include:

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

- [ ] **Step 5: Regenerate update history, run UI tests, and commit.**

Run: `npm run prebuild`

Expected: `src/core/update-history.generated.ts` includes a dated entry describing the 3D redesign.

Run: `npm test -- tests/ui/game-ui.test.ts tests/core/update-history.test.ts`

Expected: PASS.

```powershell
git add src/ui src/styles.css src/core/update-history-catalog.json src/core/update-history.generated.ts scripts/generate-update-history.mjs tests/ui package.json package-lock.json
git commit -m "feat: add low chrome rescue HUD"
```

---

### Task 4: Input adapter and RhythmRescueGame runtime integration

**Files:**
- Create: `src/game/input/action-map.ts`
- Create: `src/game/input/input-controller.ts`
- Create: `src/game/content/mission-content.ts`
- Create: `src/game/rhythm-rescue-game.ts`
- Modify: `src/main.ts`
- Delete: `src/scenes/boot-scene.ts`
- Delete: `src/scenes/base-scene.ts`
- Delete: `src/scenes/mission-scene.ts`
- Delete: `src/scenes/result-scene.ts`
- Delete: `src/ui/direction-pad.ts`
- Delete: `src/ui/obstacle-layer.ts`
- Modify: `src/input/input-adapter.ts` or replace its implementation with the new action map

**Interfaces:**
- `mapKeyboardKey(key: string): Direction | 'confirm' | 'pause' | undefined`.
- `createInputController(options: { onDirection; onConfirm; onPause }): { dispose(): void; setEnabled(enabled: boolean): void }`.
- `MissionContent` includes `missionId`, `timeLimitMs`, `obstacle`, `accent`, and `patternPreviewMs`.
- `RhythmRescueGame` exposes `start(): void`, `startMission(id: string): void`, `submitDirection(direction: Direction): void`, `pause(): void`, and `dispose(): void`.

- [ ] **Step 1: Add failing action-map tests.**

```ts
import { describe, expect, it } from 'vitest';
import { mapKeyboardKey } from '../../src/game/input/action-map';

describe('action map', () => {
  it('maps WASD and arrow keys to the same directions', () => {
    expect(mapKeyboardKey('ArrowUp')).toBe('up');
    expect(mapKeyboardKey('w')).toBe('up');
    expect(mapKeyboardKey('D')).toBe('right');
  });
});
```

- [ ] **Step 2: Run the focused input test and verify it fails because the module is missing.**

Run: `npm test -- tests/game/action-map.test.ts`

Expected: FAIL with a module-not-found error for `src/game/input/action-map`.

- [ ] **Step 3: Implement input mapping and input-controller lifecycle.**

Keyboard listeners must call `preventDefault()` only for mapped game keys, and `dispose()` must remove every listener. Direction buttons call the same `onDirection` callback as keyboard input.

- [ ] **Step 4: Implement `RhythmRescueGame` state flow.**

Use `createProgressStore(window.localStorage)`, existing `createMissionRun`, `submitRunDirection`, `useRunRecovery`, `applyMissionReward`, and the new `MissionClockState`. Keep the following transitions explicit:

```text
base --startMission--> mission/preview
mission/preview --preview timeout--> mission/input
mission/input --correct direction--> mission/input or next repair point
mission/input --wrong direction--> mission/recovery or mission/input
mission/input --clock expired--> mission/recovery or result/failure
mission/complete --all points--> result
result --return-to-base--> base
```

After every simulation transition, update the Three.js view model and DOM HUD. When an action button is clicked, remove its `gi-pulse` class. On `visibilitychange` or `blur`, pause the mission.

- [ ] **Step 5: Replace the Phaser entry point and remove obsolete scene imports.**

`src/main.ts` must create a root canvas container, a UI root, instantiate `RhythmRescueGame`, and call `start()`. No file in the production entry graph may import `phaser`.

- [ ] **Step 6: Run the full unit suite and build.**

Run: `npm test`

Expected: all unit tests pass.

Run: `npm run build`

Expected: TypeScript and Vite both exit with code 0 and produce `dist/`.

- [ ] **Step 7: Commit the integrated runtime.**

```powershell
git add src/main.ts src/game src/input src/render src/ui src/scenes package.json package-lock.json tests
git commit -m "feat: migrate rhythm rescue to three runtime"
```

---

### Task 5: Browser flow, accessibility, and responsive verification

**Files:**
- Modify: `tests/e2e/rhythm-rescue.spec.ts`
- Modify: `tests/scaffold.test.ts` if the app-root contract changes
- Modify: `src/ui/accessibility-panel.ts` to connect settings to the new UI if needed
- Modify: `src/game/rhythm-rescue-game.ts` for focus and pause behavior found by tests

**Interfaces:**
- The browser-facing contract uses `#app`, `[data-screen="base"]`, `[data-screen="mission"]`, `[data-screen="result"]`, `[data-action="start-mission"]`, `[data-action="return-to-base"]`, and `[data-action="update-history"]`.

- [ ] **Step 1: Rewrite the end-to-end test around visible game contracts.**

```ts
test('student can launch a rescue, input a tutorial pattern, and return to base', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-screen="base"]')).toBeVisible();
  await expect(page.locator('[data-action="start-mission"]')).toHaveClass(/gi-pulse/);
  await page.locator('[data-action="start-mission"]').click();
  await expect(page.locator('[data-screen="mission"]')).toBeVisible();
  await page.locator('[data-direction="up"]').click();
  await page.locator('[data-direction="right"]').click();
  await page.locator('[data-direction="down"]').click();
  await expect(page.locator('[data-screen="result"]')).toBeVisible();
  await page.locator('[data-action="return-to-base"]').click();
  await expect(page.locator('[data-screen="base"]')).toBeVisible();
});
```

- [ ] **Step 2: Run the focused Playwright test on the Vite server.**

Run: `npm run test:e2e -- tests/e2e/rhythm-rescue.spec.ts`

Expected: PASS on the desktop viewport.

- [ ] **Step 3: Add update-history and mobile checks.**

Verify that clicking `[data-action="update-history"]` reveals dated entries, and run the same base/mission selectors at a 390×844 viewport to ensure the direction pad and primary buttons remain visible.

- [ ] **Step 4: Run the full verification set.**

Run:

```powershell
npm test
npm run build
npm run test:e2e
```

Expected: all commands exit 0 with no failed tests.

- [ ] **Step 5: Commit browser verification updates.**

```powershell
git add tests/e2e tests/scaffold.test.ts src/ui/accessibility-panel.ts src/game/rhythm-rescue-game.ts
git commit -m "test: verify three rescue gameplay flow"
```

---

### Task 6: Final review, Pages deployment, and handoff

**Files:**
- Inspect: `README.md`
- Inspect: `.github/workflows/deploy-pages.yml`
- Modify: `README.md` with the new 3D controls and live Pages URL if the current documentation still describes Phaser

- [ ] **Step 1: Review the final diff and requirement checklist.**

Run:

```powershell
git status --short
git diff HEAD~5..HEAD --stat
rg -n "Phaser|gi-pulse|업데이트 내역|three|data-screen|GLB|glTF" src package.json README.md docs
```

Confirm that no production entry file imports Phaser, required step buttons use `gi-pulse`, update history is visible, Three.js is installed, and the docs describe keyboard and touch controls.

- [ ] **Step 2: Run the final verification before any publish action.**

Run:

```powershell
npm test
npm run build
npm run test:e2e
```

Expected: all commands exit 0.

- [ ] **Step 3: Commit documentation if it changed.**

```powershell
git add README.md
git commit -m "docs: describe three rescue controls"
```

- [ ] **Step 4: Publish the current branch to the configured GitHub repository.**

Use the GitHub publish workflow already configured for `WBmaker2/rhythm-rescue`. Confirm the target repository and branch before updating the remote ref. Do not publish `dist/` as source; GitHub Actions must build the app and deploy the `dist/` artifact.

- [ ] **Step 5: Verify GitHub Pages.**

Open the repository Actions run, wait for `build` and `deploy` to complete successfully, then verify the live URL:

`https://wbmaker2.github.io/rhythm-rescue/`

Confirm the landing screen loads, the Three.js canvas is present, and the first mission can be started from the published site.
