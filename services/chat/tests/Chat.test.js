const request = require('supertest');
const { io: ioClient } = require('socket.io-client');
const { app, server, io } = require('../server');

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

  describe('Socket.IO real-time events', () => {
    let port;
    const clients = [];

    // connect w client and wait for it to be ready
    const connectClient = () =>
      new Promise((resolve, reject) => {
        const c = ioClient(`http://localhost:${port}`, { forceNew: true, transports: ['websocket'] });
        clients.push(c);
        c.on('connect', () => resolve(c));
        c.on('connect_error', reject);
      });

    // waits for an event or rejects due to timeout
    const waitFor = (socket, event, ms = 1500) =>
      new Promise((resolve, reject) => {
        const t = setTimeout(() => reject(new Error(`timeout waiting for '${event}'`)), ms);
        socket.once(event, (data) => { clearTimeout(t); resolve(data); });
      });

    // confirms that an event doesnt arrive within a short time window
    const expectNoEvent = (socket, event, ms = 400) =>
      new Promise((resolve, reject) => {
        const handler = () => reject(new Error(`unexpected '${event}' received`));
        socket.once(event, handler);
        setTimeout(() => { socket.off(event, handler); resolve(); }, ms);
      });

    // connects and performs user:join, awaiting confirmation of users:update
    const joinAs = async (name) => {
      const c = await connectClient();
      const updated = waitFor(c, 'users:update');
      c.emit('user:join', { name, avatar: '' });
      await updated;
      return c;
    };

    beforeAll((done) => {
      server.listen(0, () => {
        port = server.address().port;
        done();
      });
    });

    afterEach(() => {
      while (clients.length) clients.pop().disconnect();
    });

    afterAll((done) => {
      io.close(() => done());
    });

    describe('user:join', () => {
      test('Announces the new user to everyone and updates the online list', async () => {
        const a = await connectClient();
        const system = waitFor(a, 'chat:system');
        const users = waitFor(a, 'users:update');
        a.emit('user:join', { name: 'Alice', avatar: '' });

        expect((await system).text).toBe('Alice joined the chat');
        expect((await users).some((u) => u.name === 'Alice')).toBe(true);
      });
    });

    describe('chat:message', () => {
      test('Broadcasts a text message to every connected user (image is null)', async () => {
        const a = await joinAs('Alice');
        const b = await joinAs('Bob');

        const received = waitFor(b, 'chat:message');
        a.emit('chat:message', { text: '  hola equipo  ' });
        const msg = await received;

        expect(msg.sender).toBe('Alice');
        expect(msg.text).toBe('hola equipo');
        expect(msg.image).toBeNull();
      });

      test('Broadcasts a message that includes an image (data URL)', async () => {
        const a = await joinAs('Alice');
        const b = await joinAs('Bob');
        const image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==';

        const received = waitFor(b, 'chat:message');
        a.emit('chat:message', { text: 'mira esto', image });
        const msg = await received;

        expect(msg.image).toBe(image);
        expect(msg.text).toBe('mira esto');
      });

      test('Accepts an image-only message (no text)', async () => {
        const a = await joinAs('Alice');
        const b = await joinAs('Bob');
        const image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==';

        const received = waitFor(b, 'chat:message');
        a.emit('chat:message', { text: '', image });
        const msg = await received;

        expect(msg.text).toBe('');
        expect(msg.image).toBe(image);
      });

      test('Rejects an image over the size limit and only notifies the sender', async () => {
        const a = await joinAs('Alice');
        const b = await joinAs('Bob');
        const hugeImage = 'data:image/png;base64,' + 'A'.repeat(700001);

        const error = waitFor(a, 'chat:error');
        const noBroadcast = expectNoEvent(b, 'chat:message');
        a.emit('chat:message', { text: 'demasiado grande', image: hugeImage });

        expect((await error).message).toMatch(/too large/i);
        await noBroadcast;
      });

      test('Ignores an empty message (no text and no image)', async () => {
        const a = await joinAs('Alice');
        const b = await joinAs('Bob');

        const noBroadcast = expectNoEvent(b, 'chat:message');
        a.emit('chat:message', { text: '   ' });
        await noBroadcast;
      });

      test('Ignores messages from a socket that never sent user:join', async () => {
        const anon = await connectClient();
        const b = await joinAs('Bob');

        const noBroadcast = expectNoEvent(b, 'chat:message');
        anon.emit('chat:message', { text: 'soy anonimo' });
        await noBroadcast;
      });
    });

    describe('chat:typing', () => {
      test('Other users are notified when someone starts typing', async () => {
        const a = await joinAs('Alice');
        const b = await joinAs('Bob');

        const typing = waitFor(b, 'chat:typing');
        a.emit('chat:typing', { isTyping: true });

        expect(await typing).toEqual({ sender: 'Alice', isTyping: true });
      });

      test('Other users are notified when someone stops typing', async () => {
        const a = await joinAs('Alice');
        const b = await joinAs('Bob');

        const typing = waitFor(b, 'chat:typing');
        a.emit('chat:typing', { isTyping: false });

        expect(await typing).toEqual({ sender: 'Alice', isTyping: false });
      });

      test('The sender does NOT receive their own typing indicator', async () => {
        const a = await joinAs('Alice');
        await joinAs('Bob');

        const noSelfEcho = expectNoEvent(a, 'chat:typing');
        a.emit('chat:typing', { isTyping: true });
        await noSelfEcho;
      });

      test('Ignores typing events from a socket that never sent user:join', async () => {
        const anon = await connectClient();
        const b = await joinAs('Bob');

        const noBroadcast = expectNoEvent(b, 'chat:typing');
        anon.emit('chat:typing', { isTyping: true });
        await noBroadcast;
      });
    });
  });
});