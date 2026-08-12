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
