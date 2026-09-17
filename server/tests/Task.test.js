const request = require('supertest');
const { app } = require('../server');

/**
 * tasks automatized tests
 * tasks CRUD, validations, filters and protected routes
 */

describe('Task Endpoints', () => {
    let authToken = '';
    let projectId = '';
    let taskId = '';

    beforeAll(async () => {
        // registers user and gets token
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Task Tester',
                email: `task_${Date.now()}@test.com`,
                password: 'Test1234'
            });
        authToken = res.body.data.token;

        // creates base project
        const projRes = await request(app)
            .post('/api/projects')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ name: 'Project for Tasks', priority: 'high' });
        projectId = projRes.body.data.project._id;
    });

    /* cretes task */
    describe('POST /api/projects/:projectId/tasks', () => {

        test('Must create a task with valid data', async () => {
            const res = await request(app)
                .post(`/api/projects/${projectId}/tasks`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    title: 'Test Task',
                    description: 'This is a test task',
                    priority: 'high',
                });

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.task.title).toBe('Test Task');

            taskId = res.body.data.task._id; // guarda el id para tests posteriores
        });

        test('Cannot create a task without a title', async () => {
            const res = await request(app)
                .post(`/api/projects/${projectId}/tasks`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ description: 'No title' });
            
            expect(res.statusCode).toBe(400);
        });
    });

    /* list tasks */
    describe('GET /api/projects/:id/tasks', () => {

        test('Must return list of tasks of the project', async () => {
            const res = await request(app)
                .get(`/api/projects/${projectId}/tasks`)
                .set('Authorization', `Bearer ${authToken}`);
            
            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body.data.tasks)).toBe(true);
            expect(res.body.data.tasks.length).toBeGreaterThan(0);
        });
    });

    /* update task */
    describe('PUT /api/tasks/:id', () => {

        test('Must update task status', async () => {
            const res = await request(app)
                .put(`/api/tasks/${taskId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ status: 'in-progress' });

            expect(res.statusCode).toBe(200);
            expect(res.body.data.task.status).toBe('in-progress');
        });

        test('Must complete task data', async () => {
            const res = await request(app)
                .put(`/api/tasks/${taskId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ status: 'completed' });
            
            expect(res.statusCode).toBe(200);
            expect(res.body.data.task.status).toBe('completed');
        });

        test('Must reject invalid status', async () => {
            const res = await request(app)
                .put(`/api/tasks/${taskId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ status: 'invalid-status' });
            
            expect(res.statusCode).toBe(400);
        });
    });

    /* my tasks */
    describe('GET /api/tasks/my-tasks', () => {

        test('Must return tasks assigned to the user', async () => {
            const res = await request(app)
                .get('/api/tasks/my-tasks')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body.data.tasks)).toBe(true);
        });
    });

    /* deletes tasks */
    describe('DELETE /api/tasks/:id', () => {

        test('Must delete the task', async () => {
            const res = await request(app)
                .delete(`/api/tasks/${taskId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });

    /* health check */
    describe('GET /api/health', () =>  {

        test("Server must be running", async () => {
            const res = await request(app).get('/api/health');
            expect(res.statusCode).toBe(200);
            expect(res.body.status).toBe('OK');
        });
    });
});