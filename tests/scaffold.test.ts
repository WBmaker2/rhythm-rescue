import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, it } from 'vitest';

it('uses the approved game title', () => {
  const html = readFileSync(resolve('index.html'), 'utf8');
  expect(html).toContain('<title>리듬 구조대</title>');
});
