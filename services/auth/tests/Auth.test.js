const request = require('supertest');
const { app } = require('../server');
const { User } = require('../../../shared/models');

describe('Auth Service', () => {
  const testUser = {
    name: 'Test User',
    email: `auth_test_${Date.now()}@test.com`,
    password: 'Test1234'
  };

  let authToken = '';

  afterAll(async () => {
    // deletes test users
    await User.deleteMany({ email: /@test\.com$/ });
  });

  describe('POST /auth/register', () => {
    test('Registers new user correctly', async () => {
      const res = await request(app).post('/auth/register').send(testUser);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe(testUser.email);
      expect(res.body.data.user.password).toBeUndefined();

      authToken = res.body.data.token;
    });

    test('Rejects duplicate email register', async () => {
      const res = await request(app).post('/auth/register').send(testUser);
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('Rejects register without name', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ email: `other_${Date.now()}@test.com`, password: 'Test1234' });
      expect(res.statusCode).toBe(400);
    });

    test('Rejects password without number', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ name: 'Test', email: `other2_${Date.now()}@test.com`, password: 'NoNumber' });
      expect(res.statusCode).toBe(400);
    });

    test('Rejects password with less than 8 characters', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ name: 'Test', email: `other3_${Date.now()}@test.com`, password: 'Short1' });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /auth/login', () => {
    test('Succesful login with valid credentials', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: testUser.email, password: testUser.password });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.token).toBeDefined();
    });

    test('Rejects login with invalid password', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: testUser.email, password: 'WrongPass1' });
      expect(res.statusCode).toBe(401);
    });

    test('Rejects login with non existent email', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: `doesntexist_${Date.now()}@test.com`, password: 'Test1234' });
      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /auth/me (ruta protegida)', () => {
    test('Returns authenticated user with valid token', async () => {
      const res = await request(app).get('/auth/me').set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.user.email).toBe(testUser.email);
    });

    test('Rejects access without token', async () => {
      const res = await request(app).get('/auth/me');
      expect(res.statusCode).toBe(401);
    });

    test('Rejects acces with invalid token', async () => {
      const res = await request(app).get('/auth/me').set('Authorization', 'Bearer token_invalid');
      expect(res.statusCode).toBe(401);
    });
  });

  describe('PUT /auth/profile', () => {
    test('Updates name of authenticated profile', async () => {
      const res = await request(app)
        .put('/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Name' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.user.name).toBe('Updated Name');
    });
  });

  describe('PUT /auth/password', () => {
    test('Rejects password change with invalid password', async () => {
      const res = await request(app)
        .put('/auth/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ currentPassword: 'IncorrectXX1', newPassword: 'NewPass1' });

      expect(res.statusCode).toBe(400);
    });

    test('Changes password with valid password', async () => {
      const res = await request(app)
        .put('/auth/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ currentPassword: testUser.password, newPassword: 'NewPass1' });

      expect(res.statusCode).toBe(200);
    });
  });
});