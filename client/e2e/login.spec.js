import { test, expect } from '@playwright/test';
import { login } from './helpers/login'

test('User can login and access dashboard', async ({ page }) => {

    await login(page);
});