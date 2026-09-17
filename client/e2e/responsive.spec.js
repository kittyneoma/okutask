import { test, expect } from '@playwright/test';
import { login } from './helpers/login';

test('Dashboard responsive on mobile', async ({ page}) => {

    await page.setViewportSize({ 
        width: 375, 
        height: 667 
    });

    await login(page);
    
    await expect(page.locator('.dashboard-container')
    ).toBeVisible();
});

test('Header adapts to mobile', async ({ page }) => {

    await page.setViewportSize({
        width: 375,
        height: 812
    });

    await login(page);
    
    await page.goto('http://localhost:5173/dashboard');

    const header = page.locator('header');

    await expect(header).toBeVisible();
});

test('Dashboard desktop layout', async ({ page}) => {

    await page.setViewportSize({
        width: 1920,
        height: 1080
    });

    await login(page);

    await page.goto('http://localhost:5173/dashboard');

    await expect(page.locator('.dashboard-container')).toBeVisible();
});