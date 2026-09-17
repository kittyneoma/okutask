const request = require('supertest');
const { app } = require('../server');

describe('Chat Service', () => {
  describe('GET /health', () => {
    test('Answers OK with with the number of connected users', async () => {
      const res = await request(app).get('/health');

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('OK');
      expect(res.body.service).toBe('chat-service');
      expect(typeof res.body.connectedUsers).toBe('number');
    });
  });

  describe('Routes not found', () => {
    test('Answers 404 on a non existent route', async () => {
      const res = await request(app).get('/no-exist');
      expect(res.statusCode).toBe(404);
    });
  });
});