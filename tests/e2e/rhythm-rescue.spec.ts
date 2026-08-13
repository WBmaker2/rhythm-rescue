import { expect, test } from '@playwright/test';

const buttonBySymbol: Record<string, string> = {
  '↑': '.direction-up',
  '→': '.direction-right',
  '↓': '.direction-down',
  '←': '.direction-left',
};

async function completeMission(page: import('@playwright/test').Page, repairPoints: number): Promise<void> {
  for (let point = 1; point <= repairPoints; point += 1) {
    await expect(page.locator('.mission-chip')).toContainText(`${point} / ${repairPoints}`);
    const pattern = (await page.locator('.pattern-display').textContent())?.trim().split(/\s+/).filter(Boolean) ?? [];
    expect(pattern.length).toBeGreaterThan(0);
    for (const symbol of pattern) {
      const selector = buttonBySymbol[symbol];
      expect(selector).toBeDefined();
      await page.locator(selector).click();
    }
  }
  await expect(page.getByText('임무 결과')).toBeVisible();
}

test('starts and completes the tutorial rescue', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '첫 구조 임무 시작' }).click();
  await expect(page.getByText('수리 지점 1 / 3')).toBeVisible();
  await page.getByRole('button', { name: '위 수리 신호' }).click();
  await expect(page.getByText('수리 지점 2 / 3')).toBeVisible();
  await page.getByRole('button', { name: '오른쪽 수리 신호' }).click();
  await expect(page.getByText('수리 지점 3 / 3')).toBeVisible();
  await page.getByRole('button', { name: '아래 수리 신호' }).click();
  await expect(page.getByText('임무 결과')).toBeVisible();
});

test('runs every medium repair point before showing the result', async ({ page }) => {
  await page.goto('/');
  await page.locator('.mission-options .primary-button').nth(0).click();
  await expect(page.getByText('DRONE SCAN')).toBeVisible();
  await completeMission(page, 5);
});

test('runs every long repair point before showing the result', async ({ page }) => {
  await page.goto('/');
  await page.locator('.mission-options .primary-button').nth(1).click();
  await expect(page.getByText('DRONE SCAN')).toBeVisible();
  await expect(page.getByText('SIGNAL SHIELD')).toBeVisible();
  await completeMission(page, 7);
});

test('keeps the mission controls reachable on a narrow viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');
  await page.getByRole('button', { name: '첫 구조 임무 시작' }).click();
  const screen = page.locator('.mission-screen');
  const box = await screen.boundingBox();
  expect(box?.width).toBeLessThanOrEqual(375);
  await page.getByRole('button', { name: '위 수리 신호' }).click();
  await page.getByRole('button', { name: '오른쪽 수리 신호' }).click();
  await page.getByRole('button', { name: '아래 수리 신호' }).click();
  await expect(page.getByText('임무 결과')).toBeVisible();
});

test('shows recovery feedback and still completes with sound and vibration disabled', async ({ page }) => {
  await page.goto('/');
  const missionMessage = page.locator('.mission-message');
  const recoveryStatus = page.locator('.feedback-status[aria-live="polite"]');
  const resultCopy = page.locator('.result-copy[aria-live="polite"]');
  await page.getByRole('button', { name: '접근성 설정' }).click();
  await page.getByLabel('수리 소리 사용').uncheck();
  await page.getByLabel('진동 사용').uncheck();
  await page.getByRole('button', { name: '첫 구조 임무 시작' }).click();
  const feedbackStatus = page.locator('.feedback-status[aria-live="polite"]');
  await expect(feedbackStatus).toHaveCount(1);
  await expect(feedbackStatus).toHaveText('');
  await expect(missionMessage).not.toHaveAttribute('aria-live', 'polite');
  await page.getByRole('button', { name: '오른쪽 수리 신호' }).click();
  await expect(recoveryStatus).toContainText('신호가 흐트러졌어요. 한 번 더 천천히 기억해요.');
  await page.getByRole('button', { name: '위 수리 신호' }).click();
  await page.getByRole('button', { name: '오른쪽 수리 신호' }).click();
  await page.getByRole('button', { name: '아래 수리 신호' }).click();
  await expect(page.getByText('임무 결과')).toBeVisible();
  await expect(resultCopy).toBeVisible();
});

test('pauses the mission and can reduce motion', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '접근성 설정' }).click();
  await page.getByLabel('화면 흔들림 줄이기').check();
  await page.getByRole('button', { name: '첫 구조 임무 시작' }).click();
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await expect(page.getByText('임무 일시정지')).toBeVisible();
});

test('supports keyboard input and returns to base with saved progress', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '첫 구조 임무 시작' }).click();
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowDown');
  await expect(page.getByText('임무 결과')).toBeVisible();
  await page.getByRole('button', { name: '본부로 돌아가기' }).click();
  await expect(page.getByText('구조 부품')).toBeVisible();

  const savedProgress = await page.evaluate(() =>
    JSON.parse(window.localStorage.getItem('rhythm-rescue-progress-v1') ?? 'null'),
  );
  expect(savedProgress.parts).toBe(3);
});

test('opens the drone mission from base', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '드론 경계 임무' }).click();
  await expect(page.getByText('DRONE SCAN')).toBeVisible();
});

test('opens the mixed obstacle mission from base', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '혼합 장애물 임무' }).click();
  await expect(page.getByText('DRONE SCAN')).toBeVisible();
  await expect(page.getByText('SIGNAL SHIELD')).toBeVisible();
});

test('pauses when document visibility changes to hidden', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '첫 구조 임무 시작' }).click();
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(page.getByText('임무 일시정지')).toBeVisible();
});

test('reduced motion disables obstacle animation', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '접근성 설정' }).click();
  await page.getByLabel('화면 흔들림 줄이기').check();
  await page.getByRole('button', { name: '드론 경계 임무' }).click();
  await expect.poll(async () =>
    page.locator('.obstacle-layer .obstacle-drone').evaluate((element) => getComputedStyle(element).animationName),
  ).toBe('none');
});

test('keeps the base screen and cosmetic grid inside a narrow viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');
  const screen = page.locator('.base-screen');
  const grid = page.locator('.cosmetic-grid');
  await expect(screen).toBeVisible();
  await expect(grid).toBeVisible();
  await expect.poll(async () => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  await expect.poll(async () => grid.evaluate((element) => element.getBoundingClientRect().right)).toBeLessThanOrEqual(375);
});

test('disables the base start pulse when reduced motion is enabled', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '접근성 설정' }).click();
  await page.getByLabel('화면 흔들림 줄이기').check();
  await expect.poll(async () => page.locator('.start-button').evaluate((element) => getComputedStyle(element).animationName)).toBe('none');
});

test('opens update history with keyboard activation', async ({ page }) => {
  await page.goto('/');
  const updateButton = page.getByRole('button', { name: '업데이트 내역' });
  await updateButton.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.update-history-panel')).toBeVisible();
  await expect(page.locator('.update-history-panel time').first()).toHaveAttribute('datetime', /^\d{4}-\d{2}-\d{2}$/);
  await expect(page.locator('.update-history-panel')).toContainText('2026-08-13');
});

test('shows locked cosmetics and a closed update history panel', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: '헬멧 스킨' })).toBeDisabled();
  await expect(page.getByText('기지 레벨 3에서 해금')).toBeVisible();
  await expect(page.getByRole('button', { name: '업데이트 내역' })).toBeVisible();
  await expect(page.locator('.update-history-panel')).toBeHidden();
});

test('opens dated updates and highlights the required mission button', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.start-button')).toHaveClass(/gi-pulse/);
  await page.getByRole('button', { name: '업데이트 내역' }).click();
  await expect(page.locator('.update-history-panel')).toBeVisible();
  await expect(page.getByText('2026-08-13').first()).toBeVisible();
});

test('selects an unlocked cosmetic and persists the choice', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('rhythm-rescue-progress-v1', JSON.stringify({
    stars: 6, parts: 6, baseLevel: 3, unlockedMissionIds: ['tutorial'],
    settings: { sound: true, vibration: true, reducedMotion: false, relaxedTiming: false },
    selectedSkinId: 'default-suit', selectedBaseDecorationId: 'default-hangar',
    unlockedCosmeticIds: ['default-suit', 'default-hangar', 'rescue-helmet'],
  })));
  await page.reload();
  await page.getByRole('button', { name: '헬멧 스킨' }).click();
  await expect(page.getByRole('button', { name: '헬멧 스킨' })).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('rhythm-rescue-progress-v1') ?? '{}').selectedSkinId)).toBe('rescue-helmet');
});

test('applies selected cosmetics to the base theme and mission HUD badge', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('rhythm-rescue-progress-v1', JSON.stringify({
    stars: 12, parts: 12, baseLevel: 5, unlockedMissionIds: ['tutorial'],
    settings: { sound: true, vibration: true, reducedMotion: false, relaxedTiming: false },
    selectedSkinId: 'default-suit', selectedBaseDecorationId: 'default-hangar',
    unlockedCosmeticIds: ['default-suit', 'default-hangar', 'rescue-helmet', 'signal-hq'],
  })));
  await page.reload();

  await page.getByRole('button', { name: '헬멧 스킨' }).click();
  await page.getByRole('button', { name: '신호 관제실' }).click();
  await expect(page.locator('.base-screen')).toHaveAttribute('data-skin', 'rescue-helmet');
  await expect(page.locator('.base-screen')).toHaveAttribute('data-decoration', 'signal-hq');

  await page.getByRole('button', { name: '첫 구조 임무 시작' }).click();
  await expect(page.locator('.selected-cosmetic-badge')).toContainText('헬멧 스킨');
  await expect(page.locator('.selected-cosmetic-badge')).toContainText('신호 관제실');
});

test('associates each locked cosmetic button with its requirement card text', async ({ page }) => {
  await page.goto('/');
  const lockedButton = page.getByRole('button', { name: '헬멧 스킨' });
  await expect(lockedButton).toBeDisabled();
  const descriptionId = await lockedButton.getAttribute('aria-describedby');
  expect(descriptionId).toBeTruthy();
  await expect(page.locator(`#${descriptionId}`)).toContainText('기지 레벨 3에서 해금');
  await expect(page.locator('.cosmetic-card')).toHaveCount(4);
  await page.setViewportSize({ width: 375, height: 667 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
});
