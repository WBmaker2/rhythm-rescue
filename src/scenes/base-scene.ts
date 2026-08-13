import Phaser from 'phaser';
import type { Progress } from '../core/progression';
import { createProgressStore } from '../storage/progress-store';
import { createAccessibilityPanel, applyAccessibilitySettings } from '../ui/accessibility-panel';
import { createUiButton, resetGameUi } from '../ui/direction-pad';
import { getMissionConfig } from '../core/mission-config';
import { getUpdateHistory } from '../core/update-history';
import { COSMETIC_LABELS, type BaseDecorationId, type CosmeticId, type SkinId } from '../core/progression';

export interface SceneProgressData {
  progress?: Progress;
}

export class BaseScene extends Phaser.Scene {
  private progress!: Progress;

  constructor() {
    super('BaseScene');
  }

  create(data: SceneProgressData = {}): void {
    this.progress = data.progress ?? createProgressStore(window.localStorage).load();
    applyAccessibilitySettings(this.progress.settings);
    this.add.text(64, 54, 'RESCUE HQ', { color: '#73d7ff', fontSize: '20px' });

    const ui = resetGameUi();
    const screen = document.createElement('main');
    screen.className = 'screen base-screen';
    screen.dataset.skin = this.progress.selectedSkinId;
    screen.dataset.decoration = this.progress.selectedBaseDecorationId;
    screen.classList.add(`skin-${this.progress.selectedSkinId}`, `decoration-${this.progress.selectedBaseDecorationId}`);
    const startMission = (missionId: string): void => {
      this.scene.start('MissionScene', {
        progress: this.progress,
        config: getMissionConfig(missionId),
      });
    };
    screen.innerHTML = `
      <p class="eyebrow">리듬 구조대 본부</p>
      <h1>고장 난 친구를<br />리듬으로 깨워요</h1>
      <p class="intro">짧은 수리 신호를 기억하고, 같은 순서로 눌러 구조대를 출동시키세요.</p>
      <div class="base-stats" aria-label="기지 현황">
        <span>기지 레벨 <strong>${this.progress.baseLevel}</strong></span>
        <span>구조 부품 <strong>${this.progress.parts}</strong></span>
        <span>별 <strong>${this.progress.stars}</strong></span>
      </div>
    `;
    screen.append(
      createAccessibilityPanel(this.progress.settings, (settings) => {
        this.progress = { ...this.progress, settings: { ...settings } };
        createProgressStore(window.localStorage).save(this.progress);
        applyAccessibilitySettings(settings);
      }),
    );
    const startButton = createUiButton('첫 구조 임무 시작', () => {
      startMission('short-01');
    });
    startButton.classList.add('start-button', 'gi-pulse');
    const missionOptions = document.createElement('div');
    missionOptions.className = 'mission-options';
    missionOptions.setAttribute('aria-label', '다른 구조 임무');
    missionOptions.append(
      createUiButton('드론 경계 임무', () => startMission('medium-01')),
      createUiButton('혼합 장애물 임무', () => startMission('long-01')),
    );
    screen.append(startButton, missionOptions);

    const customization = document.createElement('section');
    customization.className = 'base-customization';
    customization.setAttribute('aria-label', '기지 꾸미기');
    customization.innerHTML = '<h2>기지 꾸미기</h2>';
    const cosmeticGrid = document.createElement('div');
    cosmeticGrid.className = 'cosmetic-grid';
    const cosmetics: Array<{ id: CosmeticId; label: string; requirement?: string }> = [
      { id: 'default-suit', label: '기본 스킨' },
      { id: 'rescue-helmet', label: '헬멧 스킨', requirement: '기지 레벨 3에서 해금' },
      { id: 'default-hangar', label: '기본 격납고' },
      { id: 'signal-hq', label: '신호 관제실', requirement: '기지 레벨 5에서 해금' },
    ];
    for (const cosmetic of cosmetics) {
      const card = document.createElement('article');
      card.className = 'cosmetic-card';
      const option = document.createElement('button');
      option.type = 'button';
      option.className = 'cosmetic-option';
      option.textContent = cosmetic.label;
      const unlocked = this.progress.unlockedCosmeticIds.includes(cosmetic.id);
      option.disabled = !unlocked;
      option.setAttribute('aria-pressed', String(
        cosmetic.id === this.progress.selectedSkinId || cosmetic.id === this.progress.selectedBaseDecorationId,
      ));
      option.addEventListener('click', () => {
        if (!this.progress.unlockedCosmeticIds.includes(cosmetic.id)) return;
        this.progress = cosmetic.id === 'default-suit' || cosmetic.id === 'rescue-helmet'
          ? { ...this.progress, selectedSkinId: cosmetic.id as SkinId }
          : { ...this.progress, selectedBaseDecorationId: cosmetic.id as BaseDecorationId };
        createProgressStore(window.localStorage).save(this.progress);
        this.scene.restart({ progress: this.progress });
      });
      card.append(option);
      if (cosmetic.requirement && !unlocked) {
        const requirement = document.createElement('span');
        requirement.className = 'cosmetic-requirement';
        requirement.id = `cosmetic-requirement-${cosmetic.id}`;
        requirement.textContent = cosmetic.requirement;
        option.setAttribute('aria-describedby', requirement.id);
        card.append(requirement);
      }
      cosmeticGrid.append(card);
    }
    customization.append(cosmeticGrid);

    let historyOpen = false;
    const historyButton = createUiButton('업데이트 내역', () => {
      historyOpen = !historyOpen;
      historyButton.setAttribute('aria-expanded', String(historyOpen));
      historyPanel.hidden = !historyOpen;
      if (!historyOpen) historyButton.focus();
    });
    historyButton.classList.add('update-history-button');
    historyButton.setAttribute('aria-expanded', 'false');
    const historyPanel = document.createElement('section');
    historyPanel.className = 'update-history-panel';
    historyPanel.setAttribute('aria-label', '업데이트 내역');
    historyPanel.hidden = true;
    const historyList = document.createElement('ul');
    for (const entry of getUpdateHistory()) {
      const item = document.createElement('li');
      const time = document.createElement('time');
      time.dateTime = entry.date;
      time.textContent = entry.date;
      item.append(time, document.createTextNode(` ${entry.title}: ${entry.summary}`));
      historyList.append(item);
    }
    historyPanel.append(historyList);
    screen.append(customization, historyButton, historyPanel);
    ui.append(screen);
  }
}
