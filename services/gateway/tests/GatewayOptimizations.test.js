const http = require('http');

// fake "projects" microservice lets us verify the gateways cache and
// compression without needing MongoDB or the real service running
// it counts how many requests actually reach it
let fakeProjects;
let downstreamHits = 0;

// >1KB payload so the compression middleware (default threshold 1KB) kicks in
const bigList = Array.from({ length: 40 }, (_, i) => ({
  _id: `id-${i}`,
  name: `Project number ${i}`,
  description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(2),
}));

let request;
let app;

beforeAll((done) => {
  fakeProjects = http.createServer((req, res) => {
    downstreamHits += 1;
    if (req.url === '/projects/fail') {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, message: 'boom' }));
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, data: { projects: bigList } }));
  });

  fakeProjects.listen(0, () => {
    process.env.PROJECTS_SERVICE_URL = `http://localhost:${fakeProjects.address().port}`;
    request = require('supertest');
    ({ app } = require('../server'));
    done();
  });
});

afterAll((done) => {
  jest.restoreAllMocks();
  if (fakeProjects.closeAllConnections) fakeProjects.closeAllConnections();
  fakeProjects.close(done);
});

beforeEach(() => {
  downstreamHits = 0;
});

describe('Gateway optimizations', () => {
  describe('In-memory cache for GET /api/projects', () => {
    test('First request is a MISS and reaches the projects service', async () => {
      const res = await request(app).get('/api/projects?cache=first').set('Authorization', 'Bearer user-a');

      expect(res.statusCode).toBe(200);
      expect(res.headers['x-cache']).toBe('MISS');
      expect(downstreamHits).toBe(1);
    });

    test('Repeating the same request is a HIT and never reaches the projects service', async () => {
      const url = '/api/projects?cache=repeat';
      const first = await request(app).get(url).set('Authorization', 'Bearer user-a');
      const second = await request(app).get(url).set('Authorization', 'Bearer user-a');

      expect(first.headers['x-cache']).toBe('MISS');
      expect(second.headers['x-cache']).toBe('HIT');
      expect(downstreamHits).toBe(1); // only the first 1 went downstream
      expect(second.body).toEqual(first.body);
    });

    test('Cache is isolated per user: another token never receives someone elses cached data', async () => {
      const url = '/api/projects?cache=per-user';
      await request(app).get(url).set('Authorization', 'Bearer user-a');
      const other = await request(app).get(url).set('Authorization', 'Bearer user-b');

      expect(other.headers['x-cache']).toBe('MISS');
      expect(downstreamHits).toBe(2);
    });

    test('Different query strings are cached separately (status filter)', async () => {
      await request(app).get('/api/projects?status=active').set('Authorization', 'Bearer user-a');
      const other = await request(app).get('/api/projects?status=on-hold').set('Authorization', 'Bearer user-a');

      expect(other.headers['x-cache']).toBe('MISS');
      expect(downstreamHits).toBe(2);
    });

    test('Non-GET requests are never cached', async () => {
      await request(app).post('/api/projects').set('Authorization', 'Bearer user-a').send({ name: 'x' });
      await request(app).post('/api/projects').set('Authorization', 'Bearer user-a').send({ name: 'x' });

      expect(downstreamHits).toBe(2);
    });

    test('Error responses (non-2xx) are not cached', async () => {
      const first = await request(app).get('/api/projects/fail').set('Authorization', 'Bearer user-a');
      const second = await request(app).get('/api/projects/fail').set('Authorization', 'Bearer user-a');

      expect(first.statusCode).toBe(500);
      expect(second.statusCode).toBe(500);
      expect(downstreamHits).toBe(2);
    });

    test('Cached entries expire after the 15s TTL', async () => {
      const url = '/api/projects?cache=ttl';
      const realNow = Date.now();
      const nowSpy = jest.spyOn(Date, 'now');

      nowSpy.mockReturnValue(realNow);
      await request(app).get(url).set('Authorization', 'Bearer user-a');

      nowSpy.mockReturnValue(realNow + 5000); // 5s later - still fresh
      const stillFresh = await request(app).get(url).set('Authorization', 'Bearer user-a');
      expect(stillFresh.headers['x-cache']).toBe('HIT');

      nowSpy.mockReturnValue(realNow + 16000); // 16s later - expired
      const expired = await request(app).get(url).set('Authorization', 'Bearer user-a');
      expect(expired.headers['x-cache']).toBe('MISS');

      nowSpy.mockRestore();
    });
  });

  describe('Response compression', () => {
    test('Compresses large responses with gzip when the client supports it', async () => {
      const res = await request(app)
        .get('/api/projects?compress=yes')
        .set('Authorization', 'Bearer user-a')
        .set('Accept-Encoding', 'gzip');

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-encoding']).toBe('gzip');
      // superagent transparently decompresses so the body is still readable
      expect(res.body.data.projects).toHaveLength(bigList.length);
    });

    test('Does not compress when the client does not accept it', async () => {
      const res = await request(app)
        .get('/api/projects?compress=no')
        .set('Authorization', 'Bearer user-a')
        .set('Accept-Encoding', 'identity');

      expect(res.headers['content-encoding']).toBeUndefined();
    });
  });

  // exhausts the per-IP request budget instance on purpose.
  describe('Rate limiter still protects every other route', () => {
    test('Returns 429 after 150 requests to a normal route, while /api/health keeps answering 200', async () => {
      let limited = false;
      for (let i = 0; i < 160; i++) {
        const res = await request(app).get('/api/this-route-does-not-exist');
        if (res.statusCode === 429) { limited = true; break; }
      }
      expect(limited).toBe(true);

      const health = await request(app).get('/api/health');
      expect(health.statusCode).toBe(200);
    });
  });
});