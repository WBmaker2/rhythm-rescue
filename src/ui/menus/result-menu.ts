export interface ResultMenuOptions {
  rewardTier: 1 | 2 | 3;
  parts: number;
  baseLevel: number;
  mistakes: number;
  bestCombo: number;
  onReturnToBase(): void;
  onNextMission?(): void;
}

export function createResultMenu(options: ResultMenuOptions): HTMLElement {
  const screen = document.createElement('main');
  screen.className = 'screen result-screen';
  screen.dataset.screen = 'result';
  screen.innerHTML = `
    <p class="eyebrow">STRUCTURE COMPLETE</p>
    <h1>수리 성공!</h1>
    <p class="result-copy">우주선의 신호가 다시 켜졌습니다. 구조대 기지에 새 부품이 도착했어요.</p>
    <div class="reward-card">
      <span class="reward-stars" aria-label="보상 ${options.rewardTier}개">${'★'.repeat(options.rewardTier)}${'☆'.repeat(3 - options.rewardTier)}</span>
      <strong>구조 부품 +${options.rewardTier}</strong>
      <span>기지 레벨 ${options.baseLevel} · 보유 부품 ${options.parts}</span>
      <span>실수 ${options.mistakes}회 · 최고 콤보 ${options.bestCombo}</span>
    </div>
  `;
  const actions = document.createElement('div');
  actions.className = 'result-actions';
  const returnButton = document.createElement('button');
  returnButton.type = 'button';
  returnButton.className = 'primary-button gi-pulse';
  returnButton.dataset.action = 'return-to-base';
  returnButton.textContent = '기지로 돌아가기';
  returnButton.addEventListener('click', () => {
    returnButton.classList.remove('gi-pulse');
    options.onReturnToBase();
  });
  actions.append(returnButton);
  if (options.onNextMission) {
    const nextButton = document.createElement('button');
    nextButton.type = 'button';
    nextButton.className = 'secondary-button gi-pulse';
    nextButton.dataset.action = 'next-mission';
    nextButton.textContent = '다음 구조 요청';
    nextButton.addEventListener('click', () => {
      nextButton.classList.remove('gi-pulse');
      options.onNextMission?.();
    });
    actions.append(nextButton);
  }
  screen.append(actions);
  return screen;
}
