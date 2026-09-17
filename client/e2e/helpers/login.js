import { expect } from '@playwright/test';

export async function login(
    page, 
    email = 'test@test.com', 
    password = 'Test1234'
) {
    await page.goto('http://localhost:5173/login');

    await page.fill('#email', email);
    await page.fill('#password', password);

    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/dashboard/);
}