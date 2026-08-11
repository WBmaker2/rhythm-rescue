import Phaser from 'phaser';
import type { Progress } from '../core/progression';
import { createProgressStore } from '../storage/progress-store';
import { createUiButton, resetGameUi } from '../ui/direction-pad';

export interface SceneProgressData {
  progress?: Progress;
}

export class BaseScene extends Phaser.Scene {
  constructor() {
    super('BaseScene');
  }

  create(data: SceneProgressData = {}): void {
    const progress = data.progress ?? createProgressStore(window.localStorage).load();
    this.add.text(64, 54, 'RESCUE HQ', { color: '#73d7ff', fontSize: '20px' });

    const ui = resetGameUi();
    const screen = document.createElement('main');
    screen.className = 'screen base-screen';
    screen.innerHTML = `
      <p class="eyebrow">리듬 구조대 본부</p>
      <h1>고장 난 친구를<br />리듬으로 깨워요</h1>
      <p class="intro">짧은 수리 신호를 기억하고, 같은 순서로 눌러 구조대를 출동시키세요.</p>
      <div class="base-stats" aria-label="기지 현황">
        <span>기지 레벨 <strong>${progress.baseLevel}</strong></span>
        <span>구조 부품 <strong>${progress.parts}</strong></span>
        <span>별 <strong>${progress.stars}</strong></span>
      </div>
    `;
    const startButton = createUiButton('첫 구조 임무 시작', () => {
      this.scene.start('MissionScene', { progress });
    });
    startButton.classList.add('start-button');
    screen.append(startButton);
    ui.append(screen);
  }
}
