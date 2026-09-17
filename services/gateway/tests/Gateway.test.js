const request = require('supertest');
const { app } = require('../server');

describe('API Gateway', () => {
  describe('GET /api/health', () => {
    test('Answers with OK status and a list of registered services', async () => {
      const res = await request(app).get('/api/health');

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('OK');
      expect(res.body.services).toBeDefined();
      expect(res.body.services.auth).toBeDefined();
      expect(res.body.services.projects).toBeDefined();
      expect(res.body.services.tasks).toBeDefined();
      expect(res.body.services.notifications).toBeDefined();
      expect(res.body.services.chat).toBeDefined();
    });
  });

  describe('Routes not found', () => {
    test('Answers 404 on a non existent route', async () => {
      const res = await request(app).get('/api/this-routes-no-exist');
      expect(res.statusCode).toBe(404);
    });
  });

  describe('Rate limiting', () => {
    test('Health check does not count towards the general limit (explicitly excluded)', async () => {
      // the gateway excludes /api/health from the global rate limiter; 
      // // multiple consecutive calls should not return a 429
      const results = await Promise.all(
        Array.from({ length: 5 }, () => request(app).get('/api/health'))
      );
      results.forEach((res) => expect(res.statusCode).toBe(200));
    });
  });

  describe('Proxy towards microservicios', () => {
    test('Tries routing /api/auth/* to the auth service (it fails because the service isnt running, but it confirms that the proxy is activating)', async () => {
      const res = await request(app).post('/api/auth/login').send({ email: 'x@x.com', password: 'x' });
      // without the auth service running, the proxy should fail with a 502 or 500 error,
      // // never with a 404 (a 404 would mean the route isnt even recognized)
      expect(res.statusCode).not.toBe(404);
    });
  });
});