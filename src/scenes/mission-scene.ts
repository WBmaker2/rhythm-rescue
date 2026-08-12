import Phaser from 'phaser';
import { createMissionState, submitDirection, useRecovery, type MissionState } from '../core/mission-engine';
import type { Direction } from '../core/types';
import { directionFromKeyboard } from '../input/input-adapter';
import { createDirectionPad, createUiButton, resetGameUi } from '../ui/direction-pad';
import type { Progress } from '../core/progression';
import { getMissionConfig } from '../core/mission-config';
import type { MissionConfig } from '../core/types';
import { createObstacleLayer } from '../ui/obstacle-layer';

interface MissionData {
  progress: Progress;
  config?: MissionConfig;
}

const TUTORIAL_PATTERN: Direction[] = ['up'];
const MISSION_PATTERNS: Readonly<Record<string, Direction[]>> = {
  'short-01': TUTORIAL_PATTERN,
  'medium-01': ['up', 'right', 'down', 'left', 'up'],
  'long-01': ['up', 'right', 'down', 'left', 'up', 'down', 'right'],
};
const SYMBOLS: Record<Direction, string> = { up: '↑', right: '→', down: '↓', left: '←' };

export class MissionScene extends Phaser.Scene {
  private progress!: Progress;
  private state!: MissionState;
  private config!: MissionConfig;
  private paused = false;
  private previewVisible = true;
  private previewTimer?: number;
  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (this.paused) return;
    const direction = directionFromKeyboard(event.key);
    if (direction) {
      event.preventDefault();
      this.handleDirection(direction);
    }
  };
  private readonly pauseMission = (): void => {
    if (this.paused) return;
    this.paused = true;
    this.render();
  };
  private readonly onBlur = (): void => {
    this.pauseMission();
  };
  private readonly onVisibilityChange = (): void => {
    if (document.visibilityState === 'hidden') this.pauseMission();
  };

  constructor() {
    super('MissionScene');
  }

  create(data: MissionData): void {
    this.progress = data.progress;
    this.config = data.config ?? getMissionConfig('short-01');
    const pattern = MISSION_PATTERNS[this.config.id] ?? TUTORIAL_PATTERN;
    this.state = { ...createMissionState([...pattern]), phase: 'input' };
    this.previewVisible = true;
    this.previewTimer = window.setTimeout(() => {
      this.previewVisible = false;
      this.render();
    }, 1800);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('blur', this.onBlur);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener('keydown', this.onKeyDown);
      window.removeEventListener('blur', this.onBlur);
      document.removeEventListener('visibilitychange', this.onVisibilityChange);
      if (this.previewTimer !== undefined) window.clearTimeout(this.previewTimer);
    });
    this.add.text(64, 54, 'MISSION 01 / TUTORIAL', { color: '#73d7ff', fontSize: '20px' });
    this.render();
  }

  private handleDirection(direction: Direction): void {
    if (this.paused) return;
    const next = submitDirection(this.state, direction);
    if (next.phase === 'recovery') {
      this.state = useRecovery(next);
      this.previewVisible = false;
      this.render('신호가 흐트러졌어요. 한 번 더 천천히 기억해요.');
      return;
    }

    this.state = next;
    if (this.state.phase === 'complete') {
      this.scene.start('ResultScene', {
        progress: this.progress,
        rewardTier: this.state.rewardTier,
        mistakes: this.state.mistakes,
        recoveriesUsed: 2 - this.state.recoveriesLeft,
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
      this.previewVisible || index < this.state.cursor ? SYMBOLS[direction] : '•',
    );
    const displayMessage = message ??
      (this.previewVisible
        ? '신호를 기억하세요. 잠시 뒤 패턴이 가려집니다.'
        : '빛나는 신호를 순서대로 눌러 엔진을 깨워요.');
    screen.innerHTML = `
      <div class="mission-heading">
        <div>
          <p class="eyebrow">튜토리얼 구조 임무</p>
          <h1>엔진 신호 복원 중</h1>
        </div>
        <span class="mission-chip">기억 ${this.state.pattern.length}칸</span>
      </div>
      <p class="mission-message">${displayMessage}</p>
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
    const obstacleLayer = createObstacleLayer(this.config.obstacle);
    if (obstacleLayer) screen.append(obstacleLayer);
    if (this.paused) {
      const pauseOverlay = document.createElement('div');
      pauseOverlay.className = 'pause-overlay';
      pauseOverlay.setAttribute('role', 'dialog');
      pauseOverlay.setAttribute('aria-modal', 'true');
      pauseOverlay.innerHTML = `
        <p class="eyebrow">잠깐 쉬어가요</p>
        <h2>임무 일시정지</h2>
        <p>준비가 되면 계속해서 수리 신호를 입력하세요.</p>
      `;
      pauseOverlay.append(
        createUiButton('임무 계속하기', () => {
          this.paused = false;
          this.render();
        }),
      );
      screen.append(pauseOverlay);
    }
    ui.append(screen);
  }
}
