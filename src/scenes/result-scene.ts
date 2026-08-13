import Phaser from 'phaser';
import { applyMissionReward, type Progress } from '../core/progression';
import { createProgressStore } from '../storage/progress-store';
import { createUiButton, resetGameUi } from '../ui/direction-pad';

interface ResultData {
  progress: Progress;
  rewardTier: 1 | 2 | 3;
  mistakes: number;
  recoveriesUsed: number;
  bestCombo: number;
  repairPoints: number;
}

export class ResultScene extends Phaser.Scene {
  constructor() {
    super('ResultScene');
  }

  create(data: ResultData): void {
    const nextProgress = applyMissionReward(data.progress, data.rewardTier);
    createProgressStore(window.localStorage).save(nextProgress);
    this.add.text(64, 54, 'RESCUE COMPLETE', { color: '#73d7ff', fontSize: '20px' });

    const ui = resetGameUi();
    const screen = document.createElement('main');
    screen.className = 'screen result-screen';
    const reason = data.mistakes === 0
      ? '신호를 정확하게 복원했어요.'
      : '흐트러진 신호도 회복하며 끝까지 복원했어요.';
    screen.innerHTML = `
      <p class="eyebrow">구조 성공</p>
      <h1>임무 결과</h1>
      <p class="result-copy" aria-live="polite">엔진이 다시 힘차게 뛰기 시작했어요!</p>
      <p class="result-reason">${reason}</p>
      <div class="reward-card">
        <span class="reward-stars" aria-label="별 ${data.rewardTier}개">${'★'.repeat(data.rewardTier)}</span>
        <strong>구조 부품 +${data.rewardTier}</strong>
        <span>기지 레벨 ${nextProgress.baseLevel}</span>
        <span>수리 지점 ${data.repairPoints}개 · 최고 콤보 ${data.bestCombo}</span>
        <span>실수 ${data.mistakes}회 · 회복 ${data.recoveriesUsed}회</span>
      </div>
    `;
    screen.append(
      createUiButton('본부로 돌아가기', () => {
        this.scene.start('BaseScene', { progress: nextProgress });
      }),
    );
    ui.append(screen);
  }
}
