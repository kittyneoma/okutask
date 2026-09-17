import { test, expect } from '@playwright/test';
import { register } from './helpers/register';

test('User registration flow', async ({ page }) => {

    const email = `test_${Date.now()}@test.com`;

    await register(
        page,
        'Playwright User',
        email,
        'Test1234'
    );

    await expect(page).toHaveURL(/dashboard/);
});