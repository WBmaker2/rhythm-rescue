import { expect, test } from '@playwright/test';

test('starts and completes the tutorial rescue', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '첫 구조 임무 시작' }).click();
  await expect(page.getByText('엔진 신호 복원 중')).toBeVisible();
  await page.getByRole('button', { name: '위 수리 신호' }).click();
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
