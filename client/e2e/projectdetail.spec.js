import {test, expect} from '@playwright/test';
import { login } from './helpers/login';

test('User can open project details', async ({ page }) => {

    // login
    await login(page);

    await page.goto('http://localhost:5173/dashboard');

    // auth ok
    await expect(
        page.locator('.project-card').first()
    ).toBeVisible();

    await page.locator('.project-card').first().click();

    await expect(
        page.locator('.project-detail-container')
    ).toBeVisible();
});