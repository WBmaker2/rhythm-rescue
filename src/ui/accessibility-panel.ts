import type { ProgressSettings } from '../core/progression';

type SettingKey = keyof ProgressSettings;

const SETTINGS: ReadonlyArray<{ key: SettingKey; label: string }> = [
  { key: 'sound', label: '수리 소리 사용' },
  { key: 'vibration', label: '진동 사용' },
  { key: 'reducedMotion', label: '화면 흔들림 줄이기' },
  { key: 'relaxedTiming', label: '시간 목표 완화' },
];

export function createAccessibilityPanel(
  initialSettings: ProgressSettings,
  onChange: (settings: ProgressSettings) => void,
): HTMLDivElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'accessibility-panel';

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'settings-button';
  toggle.textContent = '접근성 설정';
  toggle.setAttribute('aria-expanded', 'false');

  const panel = document.createElement('div');
  panel.className = 'settings-panel';
  panel.hidden = true;
  panel.setAttribute('aria-label', '접근성 설정 패널');
  panel.innerHTML = '<strong>플레이 설정</strong>';
  let currentSettings = { ...initialSettings };

  for (const { key, label } of SETTINGS) {
    const field = document.createElement('label');
    field.className = 'setting-row';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = initialSettings[key];
    input.id = `setting-${key}`;
    input.addEventListener('change', () => {
      currentSettings = { ...currentSettings, [key]: input.checked };
      onChange(currentSettings);
    });
    field.append(input, document.createTextNode(label));
    panel.append(field);
  }

  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    panel.hidden = expanded;
  });

  wrapper.append(toggle, panel);
  return wrapper;
}

export function applyAccessibilitySettings(settings: ProgressSettings): void {
  document.documentElement.classList.toggle('reduced-motion', settings.reducedMotion);
}
