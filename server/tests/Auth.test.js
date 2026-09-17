const request = require('supertest');
const { app } = require('../server');

/**
 * authentication automatized tests 
 * for register, login, validations and protected routes
 */

describe('Auth Endpoints', () => {
    const testUser = {
        name: 'Test User',
        email: `test_${Date.now()}@test.com`,
        password: 'Test1234'
    };

    let authToken = '';

    /* register test */
    describe('POST /api/auth/register', () => {
        test('Must register a new user', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send(testUser)

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.token).toBeDefined();
            expect(res.body.data.user.email).toBe(testUser.email);

            authToken = res.body.data.token;
        });

        test('Cannot register with existing email', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send(testUser);

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
        });
        
        test('Cannot register without name', async () => {
            const res =await request(app)
                .post('/api/auth/register')
                .send({ email: 'other@test.com', password: 'Test1234' });

            expect(res.statusCode).toBe(400);
        });

        test('Cannot register password without a number', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ name: 'Test', email: 'other@test.com', password: 'NoNumber' });

            expect(res.statusCode).toBe(400);
        });

        test('Cannot register password without at least 8 characters', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ name: 'Test', email: 'other@test.com', password: 'Short1' });

            expect(res.statusCode).toBe(400);
        });
    });

    /* login test */
    describe('POST /api/auth/login', () => {

        test('Must login with correct credentials', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: testUser.email, password: testUser.password });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.token).toBeDefined();
        });

        test('Cannot login with wrong password', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: testUser.email, password: 'WrongPass1' });

            expect(res.statusCode).toBe(401);
            expect(res.body.success).toBe(false);
        });

        test('Cannot login with non-existent email', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'nonexistent@test.com', password: 'Test1234' });

            expect(res.statusCode).toBe(401);
        });
    });

    /* protected routes test */
    describe('GET /api/auth/me', () => {

        test('Must return authenticated user with a valid token', async () => {
            const res = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.data.user.email).toBe(testUser.email);
        });

        test('Cannot access without token', async () => {
            const resNoToken = await request(app)
                .get('/api/auth/me');

            expect(resNoToken.statusCode).toBe(401);
        });

        test('Cannot access with invalid token', async () => {
            const res = await request(app)
                .get('/api/auth/me')
                .set('Authorization', 'Bearer invalid_token');

            expect(res.statusCode).toBe(401);
        });
    });
});