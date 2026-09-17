const request = require('supertest');
const jwt = require('jsonwebtoken');
const { app } = require('../server');
const { User, Project, Task } = require('../../../shared/models');

function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

describe('Projects Service', () => {
  let owner, ownerToken;
  let otherUser, otherToken;
  const suffix = Date.now();

  beforeAll(async () => {
    owner = await User.create({
      name: 'Project Owner',
      email: `projects_owner_${suffix}@test.com`,
      password: 'Test1234'
    });
    ownerToken = signToken(owner._id);

    otherUser = await User.create({
      name: 'Other User',
      email: `projects_other_${suffix}@test.com`,
      password: 'Test1234'
    });
    otherToken = signToken(otherUser._id);
  });

  afterAll(async () => {
    await Task.deleteMany({ project: { $exists: true }, title: /^Prueba /});
    await Project.deleteMany({ owner: { $in: [owner._id, otherUser._id] } });
    await User.deleteMany({ _id: { $in: [owner._id, otherUser._id] } });
  });

  let projectId;

  describe('POST /projects', () => {
    test('Create a new project for the authenticated user', async () => {
      const res = await request(app)
        .post('/projects')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: 'Test Project', description: 'Test description' });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.project.name).toBe('Test Project');
      expect(res.body.data.project.owner.toString()).toBe(owner._id.toString());

      projectId = res.body.data.project._id;
    });

    test('Rejects creation without a token', async () => {
      const res = await request(app).post('/projects').send({ name: 'No token' });
      expect(res.statusCode).toBe(401);
    });

    test('Rejects name that is too short (validation rule)', async () => {
      const res = await request(app)
        .post('/projects')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: 'AB' });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /projects', () => {
    test('List only the authenticated users projects.', async () => {
      const res = await request(app).get('/projects').set('Authorization', `Bearer ${ownerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.projects)).toBe(true);
      expect(res.body.data.projects.some((p) => p._id === projectId)).toBe(true);
    });

    test('Another user does not see the project in their own list.', async () => {
      const res = await request(app).get('/projects').set('Authorization', `Bearer ${otherToken}`);
      expect(res.body.data.projects.some((p) => p._id === projectId)).toBe(false);
    });
  });

  describe('GET /projects/:id', () => {
    test('The owner can view the project details', async () => {
      const res = await request(app)
        .get(`/projects/${projectId}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.project._id).toBe(projectId);
      expect(res.body.data.project.progress).toBeDefined();
    });

    test('A user with no connection to the project cannot view it (authorization).', async () => {
      const res = await request(app)
        .get(`/projects/${projectId}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.statusCode).toBe(403);
    });

    test('Responds with a 404 for a non-existent ID', async () => {
      const fakeId = '64b64f1234567890abcdef12';
      const res = await request(app)
        .get(`/projects/${fakeId}`)
        .set('Authorization', `Bearer ${ownerToken}`);
      expect(res.statusCode).toBe(404);
    });
  });

  describe('PUT /projects/:id', () => {
    test('The owner can update the project.', async () => {
      const res = await request(app)
        .put(`/projects/${projectId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ status: 'on-hold' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.project.status).toBe('on-hold');
    });

    test('A user who is not the owner cannot update (authorization).', async () => {
      const res = await request(app)
        .put(`/projects/${projectId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ status: 'completed' });

      expect(res.statusCode).toBe(403);
    });
  });

  describe('POST /projects/:id/collaborators', () => {
    test('The owner can add a collaborator', async () => {
      const res = await request(app)
        .post(`/projects/${projectId}/collaborators`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ userId: otherUser._id.toString() });

      expect(res.statusCode).toBe(200);
      expect(
        res.body.data.project.collaborators.some((c) => c._id === otherUser._id.toString())
      ).toBe(true);
    });

    test('It does not allow adding the same collaborator twice.', async () => {
      const res = await request(app)
        .post(`/projects/${projectId}/collaborators`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ userId: otherUser._id.toString() });

      expect(res.statusCode).toBe(400);
    });

    test('Now the collaborator can see the project', async () => {
      const res = await request(app)
        .get(`/projects/${projectId}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.statusCode).toBe(200);
    });
  });

  describe('PUT /projects/:id/archive', () => {
    test('Archives the project correctly', async () => {
      const res = await request(app)
        .put(`/projects/${projectId}/archive`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.project.isArchived).toBe(true);
    });
  });

  describe('DELETE /projects/:id', () => {
    test('A user who is not the owner cannot delete the project.', async () => {
      const res = await request(app)
        .delete(`/projects/${projectId}`)
        .set('Authorization', `Bearer ${otherToken}`);
      expect(res.statusCode).toBe(403);
    });

    test('The owner can delete the project.', async () => {
      const res = await request(app)
        .delete(`/projects/${projectId}`)
        .set('Authorization', `Bearer ${ownerToken}`);
      expect(res.statusCode).toBe(200);
    });
  });
});