// simple in-memory caching for Gateway GET responses

const store = new Map();

function buildKey(req) {
  // separates the cache by user via the Authorization header to avoid leaking
  // data from one user to another n by the exact requested URL+query.
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
    const chunks = [];
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
      return originalEnd(chunk, ...args);
    };

    // header is set b4 proceeding n once the proxy starts writing
    // the response res.write the headers have already been sent and cannot be modified
    res.set('X-Cache', 'MISS');
    next();
  };
}

module.exports = { cacheMiddleware };