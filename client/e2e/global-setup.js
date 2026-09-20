import { chromium } from '@playwright/test';

async function globalSetup() {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    await page.goto('http://localhost:5173/register');
    await page.fill('#name', 'Test User');
    await page.fill('#email', 'test@test.com');
    await page.fill('#password', 'Test1234');
    await page.fill('#confirmPassword', 'Test1234');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);


    if (page.url().includes('register')) {
        await page.goto('http://localhost:5173/login');
        await page.fill('#email', 'test@test.com');
        await page.fill('#password', 'Test1234');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(1000);
    }

    if (!page.url().includes('dashboard')) {
        await page.goto('http://localhost:5173/dashboard');
    }

    const hasProject = await page.locator('.project-card').count();
    if (hasProject === 0) {
        await page.click('button:has-text("New Project")');
        await page.fill('#proj-name', 'E2E Seed Project');
        await page.click('button:has-text("Create Project")');
        await page.waitForTimeout(500);
    }

    await browser.close();
}

export default globalSetup;