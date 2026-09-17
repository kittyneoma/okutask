import {test, expect} from '@playwright/test';
import { register } from './helpers/register';

test('Realtime Chat', async ({ browser }) => {

    const email = `chat_${Date.now()}@test.com`;
    const email2 = `chat2_${Date.now()}@test.com`;

    const page1 = await browser.newPage();
    const page2 = await browser.newPage();

    // register users
    await register(page1, 'Miku', email, 'Test1234');
    await register(page2, 'Chiikawa', email2, 'Test1234');

    // opens chat
    await page1.goto('http://localhost:5173/chat');
    await page2.goto('http://localhost:5173/chat');

    // connection socket
    await expect(
        page1.locator('.connection-status.online')
    ).toBeVisible();

    await expect(
        page2.locator('.connection-status.online')
    ).toBeVisible();

    // sends msg from
    await page1.fill(
        '.chat-input',
        'Hello Chiikawa! This is Miku :3'
    );

    await page1.click('.chat-send-btn');

    // gets msg from
    await expect(
        page2.getByText('Hello Chiikawa! This is Miku :3')
    ).toBeVisible();
});

test('Show system messages for when users joins/leaves', async ({ browser }) => {

    const email1 = `join1_${Date.now()}@test.com`;
    const email2 = `join2_${Date.now()}@test.com`;

    const page1 = await browser.newPage();

    // registers user 1
    await register(
        page1,
        'Miku',
        email1,
        'Test1234'
    );

    await page1.goto('http://localhost:5173/chat');

    // registers user 2
    const page2 = await browser.newPage();

    await register(
        page2,
        'Chiikawa',
        email2,
        'Test1234'
    );

    await page2.goto('http://localhost:5173/chat');

    // verifies input msg
    await expect(
        page1.getByText('Chiikawa joined the chat')
    ).toBeVisible();

    // user 2 leaves chat
    await page2.close();

    // verifies output msg
    await expect(
        page1.getByText('Chiikawa left the chat')
    ).toBeVisible();
});