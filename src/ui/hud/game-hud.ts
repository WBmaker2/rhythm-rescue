import type { Direction } from '../../core/types';
import { createDirectionControls } from '../controls/direction-controls';
import { createPatternDisplay } from './pattern-display';

export interface MissionHudView {
  objective: string;
  repairPoint: number;
  repairPoints: number;
  pattern: readonly Direction[];
  cursor: number;
  previewVisible: boolean;
  combo: number;
  bestCombo: number;
  parts: number;
  timeRemainingMs: number;
  timeLimitMs: number;
  status?: string;
  onDirection(direction: Direction): void;
  onPause(): void;
}

export function renderMissionHud(container: HTMLElement, view: MissionHudView): void {
  container.replaceChildren();
  container.className = 'mission-ui-layer';
  container.dataset.screen = 'mission';

  const main = document.createElement('main');
  main.className = 'mission-screen';
  main.innerHTML = `
    <div class="objective-chip">
      <span class="eyebrow">현재 구조 목표</span>
      <strong>${escapeHtml(view.objective)}</strong>
      <span>수리 지점 ${view.repairPoint} / ${view.repairPoints}</span>
    </div>
    <div class="status-strip">
      <span>콤보 <strong>${view.combo}</strong></span>
      <span>최고 <strong>${view.bestCombo}</strong></span>
      <span>부품 <strong>${view.parts}</strong></span>
      <button class="hud-icon-button" type="button" data-action="pause" aria-label="임무 일시정지">Ⅱ</button>
    </div>
    <section class="pattern-panel" aria-live="polite">
      <div class="pattern-panel-heading">
        <span class="eyebrow">홀로그램 수리 패턴</span>
        <span class="pattern-phase">${view.previewVisible ? '기억하세요' : '순서대로 입력'}</span>
      </div>
      <div class="pattern-slot"></div>
      <div class="timer-track" aria-label="남은 입력 시간">
        <span class="timer-fill"></span>
      </div>
      <span class="progress-copy">입력 ${view.cursor} / ${view.pattern.length}</span>
    </section>
    <p class="mission-status" aria-live="polite">${escapeHtml(view.status ?? '수리 신호를 기다리는 중입니다.')}</p>
  `;

  const patternSlot = main.querySelector<HTMLElement>('.pattern-slot');
  patternSlot?.append(createPatternDisplay(view.pattern, view.cursor, view.previewVisible));
  const timerFill = main.querySelector<HTMLElement>('.timer-fill');
  if (timerFill) timerFill.style.width = `${Math.max(0, Math.min(100, (view.timeRemainingMs / view.timeLimitMs) * 100))}%`;

  const pauseButton = main.querySelector<HTMLButtonElement>('[data-action="pause"]');
  pauseButton?.addEventListener('click', view.onPause);

  const controls = createDirectionControls(view.onDirection, { pulse: view.cursor === 0 && !view.previewVisible });
  main.append(controls);
  container.append(main);
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  })[character] ?? character);
}
