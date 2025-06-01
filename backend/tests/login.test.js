const request = require('supertest');
const app = require('../testServer');
const deleteUserByUsername = require('../services/deleteUserByUsername');

describe('POST /login', () => {
    const username = 'TestLoginUser';
    const password = 'validpassword';
    const role = 'client';

    beforeAll(async () => {
        // Register the test user first (if not already created)
        await request(app)
            .post('/register')
            .send({ username, password, role });
    });

    it('should return 400 if missing username or password', async () => {
        const res = await request(app)
            .post('/login')
            .send({ username: '', password: '' })
            .expect(400);

        expect(res.body).toHaveProperty('error', 'Missing username or password');
    });

    it('should return 401 for invalid username', async () => {
        const res = await request(app)
            .post('/login')
            .send({ username: 'WrongUser', password: 'something' })
            .expect(401);

        expect(res.body).toHaveProperty('error', 'Invalid credentials');
    });

    it('should return 401 for invalid password', async () => {
        const res = await request(app)
            .post('/login')
            .send({ username, password: 'wrongpassword' })
            .expect(401);

        expect(res.body).toHaveProperty('error', 'Invalid credentials');
    });

    it('should login successfully and set session & cookies', async () => {
        const res = await request(app)
            .post('/login')
            .send({ username, password })
            .expect(200);

        expect(res.body).toHaveProperty('message', 'Login successful');
        expect(res.body).toHaveProperty('user');
        expect(res.headers['set-cookie']).toEqual(
            expect.arrayContaining([
                expect.stringContaining('access_token='),
                expect.stringContaining('refresh_token='),
                expect.stringContaining('connect.sid')
            ])
        );
    });
    
    afterAll(async () => {
        // Clean up the test user
        await deleteUserByUsername(username);
    });
});
