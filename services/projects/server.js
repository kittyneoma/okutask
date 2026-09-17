const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');

dotenv.config({ path: '../../.env' });

const connectDB = require('../../shared/utils/connectDB');
const { errorHandler } = require('../../shared/middleware/errorHandler');

const app = express();
const PORT = process.env.PROJECTS_PORT || 3002;

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.use('/projects', require('./src/routes/projects'));

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'projects-service', port: PORT, timestamp: new Date().toISOString() });
});

app.use(errorHandler);
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// perosnal DB  - okutask-projects
connectDB('okutask-projects', 'Projects Service').then(() => {
  if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => console.log(`[Projects Service] running on port ${PORT}`));
  }
});

process.on('unhandledRejection', (err) => {
  console.error('[Projects Service] Unhandled Rejection:', err.message);
  process.exit(1);
});

module.exports = { app };