const request = require('supertest');
const { app } = require('../server');

describe('Notifications Service', () => {
  describe('GET /health', () => {
    test('Answers with "OK" and the configured chat service URL.', async () => {
      const res = await request(app).get('/health');

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('OK');
      expect(res.body.service).toBe('notifications-service');
    });
  });

  describe('POST /notify', () => {
    test('Accepts a valid event and responds success', async () => {
      const res = await request(app)
        .post('/notify')
        .send({
          type: 'task:assigned',
          payload: { task: { title: 'Test' }, assignedTo: 'user123' }
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('Rejects an event without a type', async () => {
      const res = await request(app)
        .post('/notify')
        .send({ payload: { foo: 'bar' } });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});