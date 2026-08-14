import { expect, test, type Page } from '@playwright/test';

async function waitForInput(page: Page): Promise<void> {
  await expect(page.locator('.mission-screen')).toBeVisible();
  await expect(page.locator('.pattern-phase')).toHaveText('입력하세요');
  await expect(page.locator('[data-direction="up"]')).toBeEnabled();
}

async function input(page: Page, direction: 'up' | 'right' | 'down' | 'left'): Promise<void> {
  await waitForInput(page);
  await page.locator(`[data-direction="${direction}"]`).click();
}

async function completeTutorial(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.locator('.base-screen')).toBeVisible();
  await expect(page.locator('#game-world canvas')).toBeVisible();
  await expect(page.locator('[data-action="start-mission"]')).toHaveClass(/gi-pulse/);
  await page.locator('[data-action="start-mission"]').click();
  await input(page, 'up');
  await input(page, 'up');
  await input(page, 'right');
  await input(page, 'left');
  await input(page, 'down');
  await input(page, 'right');
  await expect(page.locator('.result-screen')).toBeVisible();
}

test('starts and completes the 3D tutorial rescue', async ({ page }) => {
  await completeTutorial(page);
  await expect(page.getByText('수리 성공!')).toBeVisible();
  await page.locator('[data-action="return-to-base"]').click();
  await expect(page.locator('.base-screen')).toBeVisible();
});

test('opens medium and long 3D obstacle missions from base', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-action="start-medium"]').click();
  await expect(page.locator('.mission-screen')).toContainText('궤도 드론을 피해 구조선 연결');
  await page.locator('[data-action="pause"]').click();
  await expect(page.getByText('임무 일시정지')).toBeVisible();
  await page.locator('[data-action="resume-mission"]').click();
  await page.goto('/');
  await page.locator('[data-action="start-long"]').click();
  await expect(page.locator('.mission-screen')).toContainText('신호 차단막 너머의 구조선 수리');
});

test('shows recovery feedback after an incorrect signal', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-action="start-mission"]').click();
  await waitForInput(page);
  await page.locator('[data-direction="right"]').click();
  await expect(page.locator('.mission-status')).toContainText('신호가 흔들렸습니다');
});

test('locks input during signal scan and keeps the HUD outside the playfield center', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');
  await page.locator('[data-action="start-mission"]').click();
  await expect(page.locator('.pattern-phase')).toHaveText('신호 스캔');
  await expect(page.locator('[data-direction="up"]')).toBeDisabled();

  const layout = await page.evaluate(() => {
    const rect = (selector: string) => {
      const element = document.querySelector<HTMLElement>(selector);
      const value = element?.getBoundingClientRect();
      return value ? { left: value.left, right: value.right, top: value.top, bottom: value.bottom, width: value.width } : null;
    };
    return {
      objective: rect('.objective-chip'),
      status: rect('.status-strip'),
      pattern: rect('.pattern-panel'),
      controls: rect('.direction-pad'),
    };
  });

  expect(layout.pattern?.left).toBeLessThan(32);
  expect(layout.pattern?.width).toBeLessThan(310);
  expect(layout.objective?.right).toBeLessThan(layout.status?.left ?? 0);
  expect(layout.pattern?.bottom).toBeLessThan(layout.controls?.top ?? 0);
  await page.waitForTimeout(900);
  await waitForInput(page);
});

test('supports keyboard input and saves the reward when returning to base', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-action="start-mission"]').click();
  await waitForInput(page);
  await page.keyboard.press('ArrowUp');
  await waitForInput(page);
  await page.keyboard.press('ArrowUp');
  await waitForInput(page);
  await page.keyboard.press('ArrowRight');
  await waitForInput(page);
  await page.keyboard.press('ArrowLeft');
  await waitForInput(page);
  await page.keyboard.press('ArrowDown');
  await waitForInput(page);
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.result-screen')).toBeVisible();
  await page.locator('[data-action="return-to-base"]').click();
  await expect(page.locator('.base-screen')).toBeVisible();
  const savedProgress = await page.evaluate(() => JSON.parse(localStorage.getItem('rhythm-rescue-progress-v1') ?? 'null'));
  expect(savedProgress.parts).toBe(3);
});

test('opens dated updates and keeps the launch pulse visible', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-action="start-mission"]')).toHaveClass(/gi-pulse/);
  await page.locator('[data-action="update-history"]').click();
  await expect(page.locator('[data-update-panel]')).toBeVisible();
  await expect(page.locator('[data-update-panel] time').first()).toHaveAttribute('datetime', /^\d{4}-\d{2}-\d{2}$/);
  await expect(page.locator('[data-update-panel]')).toContainText('3D 구조대 출동');
});

test('pauses on blur and keeps controls inside a narrow viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');
  await page.locator('[data-action="start-mission"]').click();
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await expect(page.getByText('임무 일시정지')).toBeVisible();
  await page.locator('[data-action="resume-mission"]').click();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
});
