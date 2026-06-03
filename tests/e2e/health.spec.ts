import { expect, test } from '@playwright/test';

test('web health endpoint responds', async ({ request }) => {
  const response = await request.get('/health');
  expect(response.ok()).toBeTruthy();
});
