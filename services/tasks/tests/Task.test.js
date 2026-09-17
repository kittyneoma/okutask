const request = require('supertest');
const jwt = require('jsonwebtoken');
const { app } = require('../server');
const { User, Project, Task } = require('../../../shared/models');

function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

describe('Tasks Service', () => {
  let owner, ownerToken;
  let outsider, outsiderToken;
  let project;
  const suffix = Date.now();

  beforeAll(async () => {
    owner = await User.create({
      name: 'Tasks Owner',
      email: `tasks_owner_${suffix}@test.com`,
      password: 'Test1234'
    });
    ownerToken = signToken(owner._id);

    outsider = await User.create({
      name: 'Tasks Outsider',
      email: `tasks_outsider_${suffix}@test.com`,
      password: 'Test1234'
    });
    outsiderToken = signToken(outsider._id);

    project = await Project.create({
      name: 'Project for tasks',
      owner: owner._id
    });
  });

  afterAll(async () => {
    await Task.deleteMany({ project: project._id });
    await Project.findByIdAndDelete(project._id);
    await User.deleteMany({ _id: { $in: [owner._id, outsider._id] } });
  });

  let taskId;

  describe('POST /projects/:projectId/tasks', () => {
    test('Create a new task within the project.', async () => {
      const res = await request(app)
        .post(`/projects/${project._id}/tasks`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ title: 'Test Task 1' });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.task.title).toBe('Test Task 1');
      expect(res.body.data.task.position).toBe(0);

      taskId = res.body.data.task._id;
    });

    test('A user not associated with the project cannot create tasks (authorization).', async () => {
      const res = await request(app)
        .post(`/projects/${project._id}/tasks`)
        .set('Authorization', `Bearer ${outsiderToken}`)
        .send({ title: 'Intruder Test Task' });

      expect(res.statusCode).toBe(403);
    });

    test('Rejects title that is too short', async () => {
      const res = await request(app)
        .post(`/projects/${project._id}/tasks`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ title: 'AB' });

      expect(res.statusCode).toBe(400);
    });

    test('Responds with 404 if the project does not exist.', async () => {
      const fakeProjectId = '64b64f1234567890abcdef12';
      const res = await request(app)
        .post(`/projects/${fakeProjectId}/tasks`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ title: 'Orphan Test Task' });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('GET /projects/:projectId/tasks', () => {
    test('List the project tasks.', async () => {
      const res = await request(app)
        .get(`/projects/${project._id}/tasks`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.tasks.some((t) => t._id === taskId)).toBe(true);
    });

    test('An unauthorized user cannot list the tasks (authorization).', async () => {
      const res = await request(app)
        .get(`/projects/${project._id}/tasks`)
        .set('Authorization', `Bearer ${outsiderToken}`);

      expect(res.statusCode).toBe(403);
    });
  });

  describe('GET /tasks/:id', () => {
    test('Gets the task details', async () => {
      const res = await request(app).get(`/tasks/${taskId}`).set('Authorization', `Bearer ${ownerToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.task._id).toBe(taskId);
    });

    test('Responds with a 404 for a task ID that does not exist', async () => {
      const fakeTaskId = '64b64f1234567890abcdef12';
      const res = await request(app)
        .get(`/tasks/${fakeTaskId}`)
        .set('Authorization', `Bearer ${ownerToken}`);
      expect(res.statusCode).toBe(404);
    });
  });

  describe('PUT /tasks/:id', () => {
    test('Updates the task status', async () => {
      const res = await request(app)
        .put(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ status: 'in-progress' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.task.status).toBe('in-progress');
    });

    test('Rejects an invalid status', async () => {
      const res = await request(app)
        .put(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ status: 'fabricated-state' });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /tasks/:id/comments', () => {
    test('Add a comment to the task.', async () => {
      const res = await request(app)
        .post(`/tasks/${taskId}/comments`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ text: 'This is a test comment' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.task.comments.length).toBeGreaterThan(0);
    });

    test('Rejects an empty comment', async () => {
      const res = await request(app)
        .post(`/tasks/${taskId}/comments`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ text: '' });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('PUT /tasks/:id/position', () => {
    test('Move the task to another position/state (simulated drag and drop)', async () => {
      const res = await request(app)
        .put(`/tasks/${taskId}/position`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ position: 2, status: 'review' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.task.position).toBe(2);
      expect(res.body.data.task.status).toBe('review');
    });
  });

  describe('GET /tasks/my-tasks', () => {
    test('Lists the tasks assigned to the authenticated user', async () => {
      await Task.findByIdAndUpdate(taskId, { assignedTo: owner._id });

      const res = await request(app).get('/tasks/my-tasks').set('Authorization', `Bearer ${ownerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.tasks.some((t) => t._id === taskId)).toBe(true);
    });
  });

  describe('DELETE /tasks/:id', () => {
    test('A user who is not the project owner cannot delete the task.', async () => {
      const res = await request(app)
        .delete(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${outsiderToken}`);
      expect(res.statusCode).toBe(403);
    });

    test('The project owner can delete the task.', async () => {
      const res = await request(app)
        .delete(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${ownerToken}`);
      expect(res.statusCode).toBe(200);
    });
  });
});