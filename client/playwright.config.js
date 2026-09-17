import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './e2e',

    use: {
        baseURL: 'http://localhost:5173',
        headless: true,
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },

    webServer: [
        {
            command: 'npm run dev',
            url: 'http://localhost:5173',
            reuseExistingServer: true,
        },
        {
            command: 'npm run dev',
            url: 'http://localhost:5000',
            reuseExistingServer: true,
            cwd: '../server'
        }
    ],
});