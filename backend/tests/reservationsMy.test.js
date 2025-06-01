const request = require('supertest');
const app = require('../testServer');
const loginAndReturnAgent = require('../services/loginAndReturnAgent');

describe('GET /reservations/my', () => {
    let agent;

    beforeAll(async () => {
        // Log in as existing client user
        agent = await loginAndReturnAgent('User1', '12345678910', 'client');
    });

    it('should return 401 if not authenticated', async () => {
        const res = await request(app)
            .get('/reservations/my')
            .expect('Content-Type', /json/)
            .expect(401);

        expect(res.body).toHaveProperty('error');
    });

    it('should return reservations for authenticated client user', async () => {
        const res = await agent
            .get('/reservations/my')
            .expect('Content-Type', /json/)
            .expect(200);

        expect(res.body).toHaveProperty('success', true);
        expect(res.body).toHaveProperty('data');
        expect(Array.isArray(res.body.data)).toBe(true);
    });
});
