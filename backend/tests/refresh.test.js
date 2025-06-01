const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../testServer');
const deleteUserByUsername = require('../services/deleteUserByUsername');

describe('POST /refresh_token', () => {
    const username = 'TestRefreshUser';
    const password = 'validpassword';
    const role = 'client';
    let agent;

    beforeAll(async () => {
        // Register and login
        await request(app)
            .post('/register')
            .send({ username, password, role });

        agent = request.agent(app);

        await agent
            .post('/login')
            .send({ username, password })
            .expect(200);
    });

    it('should refresh access token using valid refresh token', async () => {
        const res = await agent
            .post('/refresh_token')
            .expect(200);

        expect(res.body).toHaveProperty('success', true);
        expect(res.body).toHaveProperty('message');
        expect(res.headers['set-cookie']).toEqual(
            expect.arrayContaining([
                expect.stringContaining('access_token=')
            ])
        );
    });

    afterAll(async () => {
        await deleteUserByUsername(username);
    });
});
