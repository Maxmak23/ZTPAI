const request = require('supertest');
const app = require('../testServer');
const deleteUserByUsername = require('../services/deleteUserByUsername');

describe('POST /logout', () => {
    const username = 'TestLogoutUser';
    const password = 'validpassword';
    const role = 'client';
    const agent = request.agent(app); // persist session

    beforeAll(async () => {
        await request(app)
            .post('/register')
            .send({ username, password, role });

        await agent
            .post('/login')
            .send({ username, password })
            .expect(200);
    });

    it('should logout and destroy session', async () => {
        const res = await agent
            .post('/logout')
            .expect(200);

        expect(res.body).toHaveProperty('message', 'Logged out successfully');
        expect(res.headers['set-cookie']).toEqual(
            expect.arrayContaining([
                expect.stringContaining('connect.sid='),
                expect.stringContaining('access_token='),
                expect.stringContaining('refresh_token=')
            ])
        );
    });

    // it('should return { authenticated: false } after logout', async () => {
    //     const res = await agent
    //         .get('/auth')
    //         .expect(200);

    //     expect(res.body).toEqual({ authenticated: false });
    // });

    afterAll(async () => {
        await deleteUserByUsername(username);
    });
});
