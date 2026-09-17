const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler');

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

// socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// rutas REST
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects/:projectId/tasks', require('./routes/projectTasks'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'OkuTask API is running',
    timestamp: new Date().toISOString()
  });
});

app.use(errorHandler);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// socket.io chat
// saves connected users: socketId -> { name, avatar }
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // client sends data upon connecting
  socket.on('user:join', ({ name, avatar }) => {
    connectedUsers.set(socket.id, { name, avatar });

    // notifies ever1 som1 joined
    io.emit('chat:system', {
      text: `${name} joined the chat`,
      timestamp: new Date().toISOString()
    });

    // sends updated list of connected users
    io.emit('users:update', Array.from(connectedUsers.values()));
  });

  // cient sends msg
  socket.on('chat:message', ({ text }) => {
    const user = connectedUsers.get(socket.id);
    if (!user || !text?.trim()) return;

    const message = {
      id: `${socket.id}-${Date.now()}`,
      text: text.trim(),
      sender: user.name,
      avatar: user.avatar,
      timestamp: new Date().toISOString(),
      isOwn: false  // the client overrides it based on its socket
    };

    // broadcasts to everyone (including the sender)
    io.emit('chat:message', message);
  });

  // disconnected
  socket.on('disconnect', () => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      connectedUsers.delete(socket.id);
      io.emit('chat:system', {
        text: `${user.name} left the chat`,
        timestamp: new Date().toISOString()
      });
      io.emit('users:update', Array.from(connectedUsers.values()));
    }
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  process.exit(1);
});

module.exports = app;