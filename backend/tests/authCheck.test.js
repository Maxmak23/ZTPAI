const request = require('supertest');
const app = require('../testServer');
const deleteUserByUsername = require('../services/deleteUserByUsername');

describe('GET /auth', () => {
    const username = 'TestAuthUser';
    const password = 'validpassword';
    const role = 'client';

    const agent = request.agent(app); // persists session

    beforeAll(async () => {
        await request(app)
            .post('/register')
            .send({ username, password, role });
    });

    it('should return { authenticated: false } if not logged in', async () => {
        const res = await request(app)
            .get('/auth')
            .expect(200);

        expect(res.body).toEqual({ authenticated: false });
    });

    it('should return { authenticated: true, user } after login', async () => {
        // Login with agent to persist session
        await agent
            .post('/login')
            .send({ username, password })
            .expect(200);

        const res = await agent
            .get('/auth')
            .expect(200);

        expect(res.body).toHaveProperty('authenticated', true);
        expect(res.body).toHaveProperty('user');
        expect(res.body.user).toMatchObject({ username, role });
    });

    afterAll(async () => {
        await deleteUserByUsername(username);
    });
});
