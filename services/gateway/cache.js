const store = new Map();

function buildKey(req) {
  // separates the cache by user to avoid leaking
  // data from one user to another and by the exact requested URL query
  const auth = req.headers.authorization || 'anon';
  return `${auth}:${req.originalUrl}`;
}

function cacheMiddleware(ttlMs = 15000) {
  return (req, res, next) => {
    if (req.method !== 'GET') return next();

    const key = buildKey(req);
    const cached = store.get(key);
    const now = Date.now();

    if (cached && cached.expiresAt > now) {
      res.set('X-Cache', 'HIT');
      res.set('Content-Type', 'application/json');
      return res.status(cached.status).end(cached.body);
    }

    // express-http-proxy writes the response using res.write/res.end
    const originalWrite = res.write.bind(res);
    const originalEnd = res.end.bind(res);

    res.write = (chunk, ...args) => {
      if (chunk) chunks.push(Buffer.from(chunk));
      return originalWrite(chunk, ...args);
    };

    res.end = (chunk, ...args) => {
      if (chunk) chunks.push(Buffer.from(chunk));
      if (res.statusCode >= 200 && res.statusCode < 300 && chunks.length) {
        store.set(key, { body: Buffer.concat(chunks), status: res.statusCode, expiresAt: now + ttlMs });
      }
      res.set('X-Cache', 'MISS');
      return originalEnd(chunk, ...args);
    };

    next();
  };
}

module.exports = { cacheMiddleware };