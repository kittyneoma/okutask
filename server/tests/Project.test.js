const request = require('supertest');
const { app } = require('../server');

/**
 * project automatized tests
 * complete CRUD, validations, filters and rpotected routes
 */

describe('Project Endpoints', () => {
    let authToken = '';
    let projectId = '';

    // register user and gets token before tests
    beforeAll(async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Project Tester',
                email: `proj_${Date.now()}@test.com`,
                password: 'Test1234'
            });
        authToken = res.body.data.token;
    });

    /* create project */
    describe('POST /api/projects', () => {

        test('Must craete a project with valid data', async () => {
            const res = await request(app)
                .post('/api/projects')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Test Project',
                    description: 'This is a test project',
                    color: '#2292A4',
                    priority: 'medium'
                });
            
            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.project.name).toBe('Test Project');

            projectId = res.body.data.project._id; // guarda el id para tests posteriores
        });

        test('Cannot create a project without a name', async () => {
            const res = await request(app)
                .post('/api/projects')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ description: 'No name' });

            expect(res.statusCode).toBe(400);
        });

        test('Must reject unauthenticated requests', async () => {
            const res = await request(app)
                .post('/api/projects')
                .send({ name: 'No Token' });

            expect(res.statusCode).toBe(401);
        });
    });

    /* list projects */
    describe('GET /api/projects', () => {

        test('Must return a list of projects of the user', async () => {
            const res = await request(app)
                .get('/api/projects')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data.projects)).toBe(true);
        });

        test('Must reject without token', async () => {
            const res = await request(app).get('/api/projects');
            expect(res.statusCode).toBe(401);
        });
    });

    /* get project by id */
    describe('GET /api/projects/:id', () => {

        test('Must return created project', async () => {
            const res = await request(app)
                .get(`/api/projects/${projectId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.data.project._id).toBe(projectId);
        });

        test('Must return 404 for invalid id', async () => {
            const res =await request(app)
                .get('/api/projects/000000000000000000000000')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toBe(404);
        });
    });

    /* update project */
    describe('PUT /api/projects/:id', () => {

        test('Must update status project', async () => {
            const res = await request(app)
                .put(`/api/projects/${projectId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ status: 'completed' });

            expect(res.statusCode).toBe(200);
            expect(res.body.data.project.status).toBe('completed');
        });

        test('Must update project name', async () => {
            const res = await request(app)
                .put(`/api/projects/${projectId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ name: 'Updated Project Name' });

            expect(res.statusCode).toBe(200);
            expect(res.body.data.project.name).toBe('Updated Project Name');
        });
    });

    /* delete project */
    describe('DELETE /api/projects/:id', () => {

        test('Must delete the project', async () => {
            const res = await request(app)
                .delete(`/api/projects/${projectId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
        });

        test('Must return 404 when attempting to delete the same project', async () => {
            const res = await request(app)
                .delete(`/api/projects/${projectId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toBe(404);
        });
    });
});