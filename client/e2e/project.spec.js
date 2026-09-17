import { test, expect } from '@playwright/test';
import { register } from './helpers/register';

test('Create and delete a project', async ({ page }) => {

    const email = `project_${Date.now()}@test.com`;

    await register(
        page,
        'Project E2E Tester',
        email,
        'Test1234'
    );

    // create project
    await page.click('button:has-text("New Project")');

    await page.fill('#proj-name', 'E2E Test Project');

    await page.click('button:has-text("Create Project")');

    await expect(
        page.locator('.project-card').filter({
            hasText: 'E2E Project Test'
        })
    ).toHaveCount(0);

    // delete project
    await page.getByTitle('Delete Project').first().click();

    await page.click('button:has-text("Yes, Delete")');

    await expect(
        page.locator('.project-card').filter({
            hasText: 'E2E Test Project'
        })
    ).toHaveCount(0);
});