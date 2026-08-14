export function createPauseMenu(onResume: () => void): HTMLElement {
  const overlay = document.createElement('div');
  overlay.className = 'pause-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.innerHTML = `
    <span class="eyebrow">SIGNAL PAUSED</span>
    <h2>임무 일시정지</h2>
    <p>준비가 되면 구조 신호 입력을 다시 시작하세요.</p>
  `;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'primary-button gi-pulse';
  button.dataset.action = 'resume-mission';
  button.textContent = '임무 계속하기';
  button.addEventListener('click', () => {
    button.classList.remove('gi-pulse');
    onResume();
  });
  overlay.append(button);
  return overlay;
}
