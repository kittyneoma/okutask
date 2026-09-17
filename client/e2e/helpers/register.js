import { expect } from '@playwright/test';

export async function register(
    page,
    name,
    email, 
    password, 
    confirmPassword = password
) {
    await page.goto('http://localhost:5173/register');

    await page.fill('#name', name);
    await page.fill('#email', email);
    await page.fill('#password', password);
    await page.fill('#confirmPassword', confirmPassword);

    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/dashboard/);
}