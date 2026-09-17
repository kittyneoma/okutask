const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { EventEmitter } = require('events');
const axios = require('axios');
 
dotenv.config({ path: '../../.env' });
 
const app = express();
const PORT = process.env.NOTIFICATIONS_PORT || 3004;
const CHAT_SERVICE_URL = process.env.CHAT_SERVICE_URL || 'http://localhost:3005';
 
// message bus
const eventBus = new EventEmitter();
eventBus.setMaxListeners(50);
 
// function 2 publish events 2 chat
const publishToChat = async (type, payload, room = null) => {
  try {
    await axios.post(`${CHAT_SERVICE_URL}/events`, { type, payload, room });
  } catch (err) {
    console.error(`[Notifications] Error publishing to Chat Service:`, err.message);
  }
};
 
// subscribers
 
// assigned task
eventBus.on('task:assigned', async ({ payload }) => {
  const { task, assignedTo, projectId } = payload;
  console.log(`[Notifications] task:assigned → user:${assignedTo}`);
  await publishToChat(
    'notification:task:assigned',
    {
      message: `Task has been assigned "${task.title}"`,
      task,
      type: 'task:assigned',
      timestamp: new Date().toISOString(),
    },
    `user:${assignedTo}`
  );
});
 
// task done
eventBus.on('task:completed', async ({ payload }) => {
  const { task, projectId, completedBy } = payload;
  console.log(`[Notifications] task:completed → project:${projectId}`);
  await publishToChat(
    'notification:task:completed',
    {
      message: `The task "${task.title}" has been completed by  ${completedBy}`,
      task,
      type: 'task:completed',
      timestamp: new Date().toISOString(),
    },
    `project:${projectId}`
  );
});
 
// expired task
eventBus.on('task:overdue', async ({ payload }) => {
  const { task, projectId, assignedTo } = payload;
  console.log(`[Notifications] task:overdue → project:${projectId}`);
  await publishToChat(
    'notification:task:overdue',
    {
      message: `⚠️ The task "${task.title}" reached its deadline`,
      task,
      type: 'task:overdue',
      timestamp: new Date().toISOString(),
    },
    `project:${projectId}`
  );
});
 
// updated project
eventBus.on('project:updated', async ({ payload }) => {
  const { project, updatedBy } = payload;
  console.log(`[Notifications] project:updated → project:${project._id}`);
  await publishToChat(
    'notification:project:updated',
    {
      message: `The project "${project.name}" has been updated`,
      project,
      type: 'project:updated',
      timestamp: new Date().toISOString(),
    },
    `project:${project._id}`
  );
});
 
// added collaborator
eventBus.on('project:collaborator:added', async ({ payload }) => {
  const { project, newCollaboratorId } = payload;
  console.log(`[Notifications] project:collaborator:added → user:${newCollaboratorId}`);
  await publishToChat(
    'notification:project:collaborator:added',
    {
      message: `You were added to the project "${project.name}"`,
      project,
      type: 'project:collaborator:added',
      timestamp: new Date().toISOString(),
    },
    `user:${newCollaboratorId}`
  );
});
 
// middlewares
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(morgan('dev'));
 
// endpoint pub
app.post('/notify', (req, res) => {
  const { type, payload } = req.body;
 
  if (!type || !payload) {
    return res.status(400).json({ success: false, message: 'type and payload are required' });
  }
 
  const supportedEvents = [
    'task:assigned', 'task:completed', 'task:overdue',
    'project:updated', 'project:collaborator:added',
  ];
 
  if (!supportedEvents.includes(type)) {
    return res.status(400).json({
      success: false,
      message: `Unsupported event type. Supported: ${supportedEvents.join(', ')}`,
    });
  }
 
  // pub - publises on internal bus
  eventBus.emit(type, { payload });
 
  res.json({ success: true, message: `Event '${type}' published to bus` });
});
 
// list of supported events
app.get('/events', (req, res) => {
  res.json({
    success: true,
    supportedEvents: [
      { type: 'task:assigned', description: 'Notify the user assigned to a task' },
      { type: 'task:completed', description: 'Notify the project room when a task is completed' },
      { type: 'task:overdue', description: 'Project room overdue task alert' },
      { type: 'project:updated', description: 'Notify collaborators of changes to a project.' },
      { type: 'project:collaborator:added', description: 'Notify the newly added collaborator' },
    ],
  });
});
 
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'notifications-service',
    port: PORT,
    chatServiceUrl: CHAT_SERVICE_URL,
    timestamp: new Date().toISOString(),
  });
});
 
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));
 
// loads server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[Notifications Service] running on port ${PORT}`);
    console.log(`[Notifications Service] Pub/Sub bus active with ${eventBus.eventNames().length} subscribers`);
  });
}
 
process.on('unhandledRejection', (err) => {
  console.error('[Notifications Service] Unhandled Rejection:', err.message);
  process.exit(1);
});
 
module.exports = { app, eventBus };