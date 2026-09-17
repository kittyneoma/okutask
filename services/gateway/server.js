const express = require('express');
const proxy = require('express-http-proxy');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

dotenv.config({ path: '../../.env' });

const app = express();
const PORT = process.env.GATEWAY_PORT || 3000;

// urls microservices
const SERVICES ={
    auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    projects: process.env.PROJECTS_SERVICE_URL || 'http://localhost:3002',
    tasks: process.env.TASKS_SERVICE_URL || 'http://localhost:3003',
    notifications: process.env.NOTIFICATIONS_SERVICE_URL || 'http://localhost:3004',
    chat: process.env.CHAT_SERVICE_URL || 'http://localhost:3005',
};

// middleware global
app.use(cors(({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
})));
app.use(morgan('dev'));
app.use(express.json());

// limiting rate 150 / 15 by ip
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 150,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, try again later'},
});
app.use(limiter);

// health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'OkuTask API Gateway is running',
        timestamp: new Date().toISOString(),
        services: SERVICES,
    });
});

// proxy helpers
const makeProxy = (target, pathPrefix) => 
    proxy(target, {
        proxyReqPathResolver: (req) => {
            const resolvedPath = `${pathPrefix}${req.url}`;
            console.log(`[Gateway] ${req.method} ${req.originalUrl} -> ${target}${resolvedPath}`);
            return resolvedPath;
        },
        proxyErrorHandler: (err, res) => {
            console.error(`[Gateway] Error proxying to ${target}:`, err.message);
            res.status(503).json({ success: false, message: `Service temporarily unvailable` });
        },
    });

// routes proxy- 
// auth serice
app.use('/api/auth', makeProxy(SERVICES.auth, '/auth'));
// task service
app.use('/api/projects/:projectId/tasks', (req, res, next) => {
    // reconstructs url w projectid on path
    const projectId = req.params.projectId;
    proxy(SERVICES.tasks, {
        proxyReqPathResolver: () => `/projects/${projectId}/tasks${req.url === '/' ? '' : req.url}`,
        proxyErrorHandler: (err, res) => {
            console.error('[Gateway Tasks Service Error:', err.message);
            res.status(503).json({ succes: false, message: 'Tasks Service unavailable' });
        },
    })(req, res, next);
});

// projects service
app.use('/api/projects', makeProxy(SERVICES.projects, '/projects'));

// tasks service
app.use('/api/tasks', makeProxy(SERVICES.tasks, '/tasks'));

// notifications service
app.use('/api/notifications', makeProxy(SERVICES.notifications, ''));

// route not found
app.use((req, res) => {
    res.status(404).json({ succes: false, message: `Route not found - ${req.originalUrl}`});
});

// load
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`[API Gateway] running on port ${PORT}`);
        console.log('[API Gateway] Services');
        Object.entries(SERVICES).forEach(([name, url]) =>
        console.log(` -> ${name.padEnd(14)} ${url}`)
        );
    });
}

module.exports = { app };