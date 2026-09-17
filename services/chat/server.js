console.log('NODE_ENV=', process.env.NODE_ENV);

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');

dotenv.config({ path: '../../.env' });

const app = express();
const server = http.createServer(app);
const PORT = process.env.CHAT_PORT || 3005;

// connceted user w memory
const connectedUsers = new Map();

// socket.io
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true,
    },
});

// middlewares
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5137', credentials: true}));
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        service: 'chat-service',
        port: PORT,
        connectedUsers: connectedUsers.size,
        timestamp: new Date().toISOString(),
    });
});

// event emitter
const { EventEmitter } = require('events');
const eventBus = new EventEmitter();
eventBus.setMaxListeners(20);

// endpoint 4 others mcsv 2 publish events
app.post('/events', (req, res) => {
    const { type, payload, room } =  req.body;
    if (!type || !payload) {
        return res.status(400).json({ success: false, message: 'type and payload are required' });
    }

    // pub - publishes internal bus
    eventBus.emit(type, { payload, room });

    // sub - resends to socket.io room
    if (room) {
        io.to(room).emit(type, payload);
    } else {
        io.emit(type, payload);
    }

    res.json({ success: true, message: `Event '${type}' published` });
});

// events socket.io
io.on('connection', (socket) => {
    if (process.env.NODE_ENV !== 'test') {
        console.log(`Socket connected: ${socket.id}`);
    }

    // client sends data upon connecting
    socket.on('user:join', ({ name, avatar, userId }) => {
        connectedUsers.set(socket.id, { socketId: socket.id, name, avatar, userId });

        // user enters personal room 4 notifs
        if (userId) socket.join(`user:${userId}`);

        io.emit('chat:system', {
            text: `${name} joined the chat`,
            timestamp: new Date().toISOString(),
        });

        io.emit('users:update', Array.from(connectedUsers.values()));
    });

    // they reunite 2 project room 4 notifs
    socket.on('project:join', ({ projectId }) => {
        socket.join(`project:${projectId}`);
        if (process.env.NODE_ENV !== 'test') {
            console.log(`Socket ${socket.id} joined project room: project:${projectId}`);
        }
    });

    socket.on('project:leave', ({ projectId }) => {
        socket.leave(`project:${projectId}`);
    });

    // chat msg 
    socket.on('chat:message', ({ text }) => {
        const user = connectedUsers.get(socket.id);
        if (!user || !text?.trim()) return;

        const message = {
            id: `${socket.id}-${Date.now()}`,
            socketId: socket.id,
            text: text.trim(),
            sender: user.name,
            avatar: user.avatar,
            timestamp: new Date().toISOString(),
        };

        io.emit('chat:message', message);
    });

    // disconnect
    socket.on('disconnect', () => {
        const user = connectedUsers.get(socket.id);
        if (user) {
            connectedUsers.delete(socket.id);
            io.emit('chat:system', {
                text: `${user.name} left the chat`,
                timestamp: new Date().toISOString(),
            });
            io.emit('users:update', Array.from(connectedUsers.values()));
        }
        if (process.env.NODE_ENV !== 'test') {
            console.log(`Socket disconnected: ${socket.id}`);
        }
    });
});

// loads server
if (process.env.NODE_ENV !== 'test') {
    server.listen(PORT, () => {
        console.log(`[Chat Service] running on port ${PORT}`);
        console.log(`[Chat Service] Socket.IO ready`);
    });
}

process.on('unhandledRejection', (err) => {
    console.error('[Chat Service] Unhandlded Rejection:', err.message);
    server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
    console.error('[Chat Service] Uncaught Exception:', err.message);
    process.exit(1);
});

module.exports = { app, server, io, eventBus };