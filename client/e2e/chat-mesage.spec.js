import { test, expect} from '@playwright/test';
import { login } from './helpers/login';

test('User can send a chat message', async ({ page }) => {

    // login
    await login(page);

    // chat
    await page.goto('http://localhost:5173/chat');

    const textarea = page.locator('.chat-input');

    await textarea.fill('Hello, this is a test message! :3');

    await page.click('.chat-send-btn');

    await expect(
        page.locator('.message-bubble').last()
    ).toContainText('Hello, this is a test message! :3');
});