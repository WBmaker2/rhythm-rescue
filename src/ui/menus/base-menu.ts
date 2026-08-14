import { getUpdateHistory } from '../../core/update-history';

export interface BaseMenuOptions {
  parts: number;
  baseLevel: number;
  onStart(): void;
  onSettings?(): void;
}

export function createBaseMenu(options: BaseMenuOptions): HTMLElement {
  const screen = document.createElement('main');
  screen.className = 'screen base-screen';
  screen.dataset.screen = 'base';
  screen.innerHTML = `
    <div class="base-topline"><span class="brand-mark">RR / 03</span><span class="live-badge"><i></i> 구조 신호 수신 중</span></div>
    <div class="base-copy">
      <p class="eyebrow">RHYTHM RESCUE // SPACE RESPONSE</p>
      <h1>리듬 구조대</h1>
      <p class="intro">홀로그램 신호를 기억하고, 고장 난 우주 친구를 다시 움직이게 해주세요.</p>
    </div>
    <div class="base-console">
      <div class="console-orb"><span>BASE</span><strong>LV.${options.baseLevel}</strong></div>
      <div class="console-stats"><span><b>${options.parts}</b><small>부품</small></span><span><b>3</b><small>구조 임무</small></span></div>
    </div>
    <button class="primary-button launch-button gi-pulse" type="button" data-action="start-mission">출동 시작 <span>→</span></button>
    <p class="control-hint">방향키 / WASD 또는 화면 버튼으로 구조대를 움직이세요</p>
    <div class="base-footer-actions">
      <button class="secondary-button" type="button" data-action="update-history">업데이트 내역</button>
      <button class="secondary-button" type="button" data-action="settings">접근성 설정</button>
    </div>
    <section class="update-history-panel" data-update-panel hidden aria-label="업데이트 내역">
      <div class="panel-heading"><span class="eyebrow">CHANGELOG</span><button type="button" class="panel-close" data-action="close-updates" aria-label="업데이트 내역 닫기">×</button></div>
      <ul data-update-list></ul>
    </section>
  `;

  const startButton = screen.querySelector<HTMLButtonElement>('[data-action="start-mission"]');
  startButton?.addEventListener('click', () => {
    startButton.classList.remove('gi-pulse');
    options.onStart();
  });

  const panel = screen.querySelector<HTMLElement>('[data-update-panel]');
  const list = screen.querySelector<HTMLUListElement>('[data-update-list]');
  list?.append(...getUpdateHistory().map((entry) => {
    const item = document.createElement('li');
    item.innerHTML = `<time datetime="${entry.date}">${entry.date}</time><strong>${entry.title}</strong><span>${entry.summary}</span>`;
    return item;
  }));
  screen.querySelector<HTMLButtonElement>('[data-action="update-history"]')?.addEventListener('click', () => {
    if (panel) panel.hidden = false;
  });
  screen.querySelector<HTMLButtonElement>('[data-action="close-updates"]')?.addEventListener('click', () => {
    if (panel) panel.hidden = true;
  });
  screen.querySelector<HTMLButtonElement>('[data-action="settings"]')?.addEventListener('click', () => options.onSettings?.());
  return screen;
}
