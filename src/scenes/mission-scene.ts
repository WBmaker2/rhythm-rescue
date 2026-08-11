import Phaser from 'phaser';
import { createMissionState, submitDirection, useRecovery, type MissionState } from '../core/mission-engine';
import type { Direction } from '../core/types';
import { directionFromKeyboard } from '../input/input-adapter';
import { createDirectionPad, resetGameUi } from '../ui/direction-pad';
import type { Progress } from '../core/progression';

interface MissionData {
  progress: Progress;
}

const TUTORIAL_PATTERN: Direction[] = ['up'];
const SYMBOLS: Record<Direction, string> = { up: '↑', right: '→', down: '↓', left: '←' };

export class MissionScene extends Phaser.Scene {
  private progress!: Progress;
  private state!: MissionState;
  private readonly onKeyDown = (event: KeyboardEvent): void => {
    const direction = directionFromKeyboard(event.key);
    if (direction) {
      event.preventDefault();
      this.handleDirection(direction);
    }
  };

  constructor() {
    super('MissionScene');
  }

  create(data: MissionData): void {
    this.progress = data.progress;
    this.state = { ...createMissionState(TUTORIAL_PATTERN), phase: 'input' };
    window.addEventListener('keydown', this.onKeyDown);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener('keydown', this.onKeyDown);
    });
    this.add.text(64, 54, 'MISSION 01 / TUTORIAL', { color: '#73d7ff', fontSize: '20px' });
    this.render();
  }

  private handleDirection(direction: Direction): void {
    const next = submitDirection(this.state, direction);
    if (next.phase === 'recovery') {
      this.state = useRecovery(next);
      this.render('신호가 흐트러졌어요. 한 번 더 천천히 기억해요.');
      return;
    }

    this.state = next;
    if (this.state.phase === 'complete') {
      this.scene.start('ResultScene', {
        progress: this.progress,
        rewardTier: this.state.rewardTier,
      });
      return;
    }
    this.render();
  }

  private render(message = '빛나는 신호를 순서대로 눌러 엔진을 깨워요.'): void {
    const ui = resetGameUi();
    const screen = document.createElement('main');
    screen.className = 'screen mission-screen';
    const pattern = this.state.pattern.map((direction, index) =>
      index < this.state.cursor ? SYMBOLS[direction] : '•',
    );
    screen.innerHTML = `
      <div class="mission-heading">
        <div>
          <p class="eyebrow">튜토리얼 구조 임무</p>
          <h1>엔진 신호 복원 중</h1>
        </div>
        <span class="mission-chip">기억 ${this.state.pattern.length}칸</span>
      </div>
      <p class="mission-message">${message}</p>
      <section class="repair-card" aria-label="수리 패턴">
        <span class="card-label">수리 패턴</span>
        <strong class="pattern-display" aria-label="현재 수리 패턴">${pattern.join(' ')}</strong>
        <span class="progress-copy">입력 ${this.state.cursor} / ${this.state.pattern.length}</span>
      </section>
      <div class="mission-footer">
        <span>콤보 <strong>${this.state.combo}</strong></span>
        <span>실수 <strong>${this.state.mistakes}</strong></span>
      </div>
    `;
    screen.append(createDirectionPad((direction) => this.handleDirection(direction)));
    ui.append(screen);
  }
}
