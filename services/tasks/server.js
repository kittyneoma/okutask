const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');

dotenv.config({ path: '../../.env' });

const connectDB = require('../../shared/utils/connectDB');
const { errorHandler } = require('../../shared/middleware/errorHandler');

const app = express();
const PORT = process.env.TASKS_PORT || 3003;

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

const taskRoutes = require('./src/routes/tasks');
const projectTaskRoutes = require('./src/routes/projectTasks');

// individual tasks
app.use('/tasks', taskRoutes);
// specific projects tasks
app.use('/projects/:projectId/tasks', projectTaskRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'tasks-service', port: PORT, timestamp: new Date().toISOString() });
});

app.use(errorHandler);
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// personal DB - okutask-tasks
connectDB('okutask-tasks', 'Tasks Service').then(() => {
  if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => console.log(`[Tasks Service] running on port ${PORT}`));
  }
});

process.on('unhandledRejection', (err) => {
  console.error('[Tasks Service] Unhandled Rejection:', err.message);
  process.exit(1);
});

module.exports = { app };