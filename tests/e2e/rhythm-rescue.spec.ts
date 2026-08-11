import { expect, test } from '@playwright/test';

test('starts and completes the tutorial rescue', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '첫 구조 임무 시작' }).click();
  await expect(page.getByText('엔진 신호 복원 중')).toBeVisible();
  await page.getByRole('button', { name: '위 수리 신호' }).click();
  await expect(page.getByText('임무 결과')).toBeVisible();
});
