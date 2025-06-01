const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../testServer');
const deleteUserByUsername = require('../../services/deleteUserByUsername');

describe('POST /refresh', () => {
    const username = 'TestRefreshUser';
    const password = 'validpassword';
    const role = 'client';

    beforeAll(async () => {
        await request(app)
            .post('/register')
            .send({ username, password, role });
    });

    it('should return 401 if refresh token is invalid', async () => {
        const res = await request(app)
            .post('/refresh')
            .set('Cookie', ['refresh_token=invalid.token.value'])
            .expect(401);

        expect(res.body).toHaveProperty('error');
    });


    afterAll(async () => {
        await deleteUserByUsername(username);
    });
});
